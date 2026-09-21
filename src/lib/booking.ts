import { and, eq, or, sql } from "drizzle-orm";
import { addMinutes } from "date-fns";
import Stripe from "stripe";
import { getDb } from "@/db";
import { bookings, courts, slots, users, venues } from "@/db/schema";
import { makeBookingCode } from "@/lib/codes";
import { CHECKOUT_HOLD_MINUTES } from "@/lib/constants";
import { appUrl, isStripeConfigured } from "@/lib/env";
import { commissionFromGross } from "@/lib/money";
import { isConnectReady } from "@/lib/connect";
import { getStripe } from "@/lib/stripe";
import { formatDate, formatTimeRange } from "@/lib/time";

const CHECKOUT_EXPIRE_BUFFER_SECONDS = 120;

export class BookingError extends Error {}

async function loadDeal(slotId: string) {
  const db = await getDb();
  const [row] = await db
    .select({ slot: slots, court: courts, venue: venues })
    .from(slots)
    .innerJoin(courts, eq(slots.courtId, courts.id))
    .innerJoin(venues, eq(courts.venueId, venues.id))
    .where(eq(slots.id, slotId))
    .limit(1);
  return row ?? null;
}

export async function holdSlot(slotId: string) {
  const db = await getDb();
  const now = new Date();
  const holdExpiresAt = addMinutes(now, CHECKOUT_HOLD_MINUTES);
  const updated = await db
    .update(slots)
    .set({
      status: "held",
      holdExpiresAt,
    })
    .where(
      and(
        eq(slots.id, slotId),
        sql`${slots.startsAt} > ${now}`,
        or(
          eq(slots.status, "open"),
          and(eq(slots.status, "held"), sql`${slots.holdExpiresAt} <= ${now}`),
        ),
      ),
    )
    .returning();
  return updated[0] ?? null;
}

export async function releaseHold(slotId: string, checkoutSessionId?: string) {
  const db = await getDb();
  await db
    .update(slots)
    .set({
      status: "open",
      holdExpiresAt: null,
      stripeCheckoutSessionId: null,
    })
    .where(
      and(
        eq(slots.id, slotId),
        eq(slots.status, "held"),
        checkoutSessionId
          ? eq(slots.stripeCheckoutSessionId, checkoutSessionId)
          : sql`true`,
      ),
    );
}

export async function fulfillPaidSlot(input: {
  slotId: string;
  userId: string;
  checkoutSessionId?: string;
  paymentIntentId?: string;
}) {
  const db = await getDb();
  const deal = await loadDeal(input.slotId);
  if (!deal) throw new BookingError("That court time is gone.");

  const existing = await db.query.bookings.findFirst({
    where: eq(bookings.slotId, input.slotId),
  });
  if (existing) return existing;

  const commissionCents = commissionFromGross(
    deal.slot.dealPriceCents,
    deal.venue.commissionBps,
  );
  const [booking] = await db
    .insert(bookings)
    .values({
      id: crypto.randomUUID(),
      slotId: input.slotId,
      userId: input.userId,
      code: makeBookingCode(),
      grossCents: deal.slot.dealPriceCents,
      commissionCents,
      netCents: deal.slot.dealPriceCents - commissionCents,
      payoutPending: isConnectReady(deal.venue) ? 0 : 1,
      stripeCheckoutSessionId: input.checkoutSessionId,
      stripePaymentIntentId: input.paymentIntentId,
      status: "paid",
    })
    .returning();

  await db
    .update(slots)
    .set({
      status: "booked",
      holdExpiresAt: null,
      stripeCheckoutSessionId: input.checkoutSessionId ?? null,
    })
    .where(eq(slots.id, input.slotId));

  return booking;
}

export async function startCheckout(slotId: string, userId: string) {
  const deal = await loadDeal(slotId);
  if (!deal) throw new BookingError("That court time is gone.");
  if (deal.venue.status !== "approved") {
    throw new BookingError("This club is not live yet.");
  }

  const db = await getDb();
  const existing = await db.query.bookings.findFirst({
    where: eq(bookings.slotId, slotId),
  });
  if (existing) {
    if (existing.userId === userId && existing.status === "paid") {
      return { url: `${appUrl()}/bookings/${existing.id}` };
    }
    throw new BookingError("Someone else just took this slot.");
  }

  const held = await holdSlot(slotId);
  if (!held) {
    throw new BookingError("Someone else just took this slot.");
  }
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!isStripeConfigured()) {
    const booking = await fulfillPaidSlot({
      slotId,
      userId,
      checkoutSessionId: `dev_${slotId}`,
      paymentIntentId: `dev_pi_${slotId}`,
    });
    return { url: `${appUrl()}/bookings/${booking.id}` };
  }

  const stripe = getStripe();
  if (!stripe) throw new BookingError("Payments are not configured.");

  const label = `${deal.venue.name} · ${deal.court.name} · ${formatDate(deal.slot.startsAt)} ${formatTimeRange(deal.slot.startsAt, deal.slot.endsAt)}`;
  const commissionCents = commissionFromGross(
    deal.slot.dealPriceCents,
    deal.venue.commissionBps,
  );

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    payment_method_types: ["ideal", "card"],
    customer_email: user?.email ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: deal.slot.dealPriceCents,
          product_data: {
            name: label,
            description: "Non-refundable surplus court time",
          },
        },
      },
    ],
    metadata: {
      slotId,
      userId,
    },
    success_url: `${appUrl()}/bookings/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl()}/deals/${slotId}?cancelled=1`,
    expires_at:
      Math.floor(Date.now() / 1000) +
      CHECKOUT_HOLD_MINUTES * 60 +
      CHECKOUT_EXPIRE_BUFFER_SECONDS,
  };

  if (isConnectReady(deal.venue) && deal.venue.stripeAccountId) {
    sessionParams.payment_intent_data = {
      application_fee_amount: commissionCents,
      transfer_data: { destination: deal.venue.stripeAccountId },
    };
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create(sessionParams);
  } catch {
    await releaseHold(slotId);
    throw new BookingError("Could not start checkout.");
  }

  await db
    .update(slots)
    .set({
      stripeCheckoutSessionId: session.id,
      holdExpiresAt: session.expires_at
        ? new Date(session.expires_at * 1000)
        : held.holdExpiresAt,
    })
    .where(eq(slots.id, slotId));

  if (!session.url) {
    await releaseHold(slotId, session.id);
    throw new BookingError("Could not start checkout.");
  }

  return { url: session.url };
}

export async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  const slotId = session.metadata?.slotId;
  const userId = session.metadata?.userId;
  if (!slotId || !userId) return null;
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;
  return fulfillPaidSlot({
    slotId,
    userId,
    checkoutSessionId: session.id,
    paymentIntentId,
  });
}

export async function refundAndCancelBooking(bookingId: string, venueOwnerId: string) {
  const db = await getDb();
  const [row] = await db
    .select({
      booking: bookings,
      slot: slots,
      venue: venues,
    })
    .from(bookings)
    .innerJoin(slots, eq(bookings.slotId, slots.id))
    .innerJoin(courts, eq(slots.courtId, courts.id))
    .innerJoin(venues, eq(courts.venueId, venues.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!row) throw new BookingError("Booking not found.");
  if (row.venue.ownerId !== venueOwnerId) {
    throw new BookingError("You cannot cancel this booking.");
  }
  if (row.booking.status !== "paid") {
    throw new BookingError("This booking is already closed.");
  }

  const stripe = getStripe();
  if (stripe && row.booking.stripePaymentIntentId?.startsWith("pi_")) {
    const refund: Stripe.RefundCreateParams = {
      payment_intent: row.booking.stripePaymentIntentId,
    };
    if (!row.booking.payoutPending && isConnectReady(row.venue)) {
      refund.refund_application_fee = true;
    }
    await stripe.refunds.create(refund);
  }

  await db
    .update(bookings)
    .set({ status: "refunded" })
    .where(eq(bookings.id, bookingId));
  await db
    .update(slots)
    .set({ status: "cancelled", holdExpiresAt: null })
    .where(eq(slots.id, row.slot.id));
}

export async function cancelOpenSlot(slotId: string, venueOwnerId: string) {
  const db = await getDb();
  const deal = await loadDeal(slotId);
  if (!deal) throw new BookingError("Slot not found.");
  if (deal.venue.ownerId !== venueOwnerId) {
    throw new BookingError("You cannot cancel this slot.");
  }
  if (deal.slot.status === "booked") {
    throw new BookingError("This slot is already booked. Refund the player instead.");
  }
  await db
    .update(slots)
    .set({ status: "cancelled", holdExpiresAt: null })
    .where(eq(slots.id, slotId));
}
