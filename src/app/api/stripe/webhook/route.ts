import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { venues } from "@/db/schema";
import { fulfillCheckoutSession, releaseCheckoutHold } from "@/lib/booking";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 501 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const payload = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.payment_status === "paid") {
      await fulfillCheckoutSession(session);
    }
  }

  if (event.type === "checkout.session.async_payment_succeeded") {
    await fulfillCheckoutSession(event.data.object);
  }

  if (
    event.type === "checkout.session.expired" ||
    event.type === "checkout.session.async_payment_failed"
  ) {
    await releaseCheckoutHold(event.data.object);
  }

  if (event.type === "account.updated") {
    const account = event.data.object;
    const db = await getDb();
    await db
      .update(venues)
      .set({
        stripeDetailsSubmitted: account.details_submitted ? 1 : 0,
      })
      .where(eq(venues.stripeAccountId, account.id));
  }

  return NextResponse.json({ received: true });
}
