"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { venues } from "@/db/schema";
import { appUrl } from "@/lib/env";
import { getStripe } from "@/lib/stripe";

function connectFailureMessage(error: unknown) {
  if (error instanceof Stripe.errors.StripePermissionError) {
    return "Stripe key cannot create Connect accounts. Use a Secret key (sk_test_...) or enable Connected accounts Write.";
  }
  return "Could not start Stripe Connect.";
}

export async function startConnectOnboarding() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/club");

  const stripe = getStripe();
  if (!stripe) {
    redirect("/club?error=Stripe%20is%20not%20configured%20yet");
  }

  const db = await getDb();
  const venue = await db.query.venues.findFirst({
    where: eq(venues.ownerId, session.user.id),
  });
  if (!venue) redirect("/club");

  let accountId = venue.stripeAccountId;
  try {
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "NL",
        email: session.user.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: venue.name,
          product_description: "Surplus leftover hours and tickets",
        },
      });
      accountId = account.id;
      await db
        .update(venues)
        .set({ stripeAccountId: accountId })
        .where(eq(venues.id, venue.id));
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl()}/club?connect=refresh`,
      return_url: `${appUrl()}/club?connect=return`,
      type: "account_onboarding",
    });

    redirect(link.url);
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      redirect(`/club?error=${encodeURIComponent(connectFailureMessage(error))}`);
    }
    throw error;
  }
}
