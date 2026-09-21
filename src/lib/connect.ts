import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { venues } from "@/db/schema";
import { getStripe } from "@/lib/stripe";

export function isConnectReady(venue: {
  stripeAccountId: string | null;
  stripeDetailsSubmitted: number;
}) {
  return Boolean(venue.stripeAccountId && venue.stripeDetailsSubmitted);
}

export async function syncConnectAccount(accountId: string) {
  const stripe = getStripe();
  if (!stripe) return;
  const account = await stripe.accounts.retrieve(accountId);
  const db = await getDb();
  await db
    .update(venues)
    .set({ stripeDetailsSubmitted: account.details_submitted ? 1 : 0 })
    .where(eq(venues.stripeAccountId, accountId));
}
