import { and, eq, or, sql } from "drizzle-orm";
import { addMinutes } from "date-fns";
import Stripe from "stripe";
import { getDb } from "@/db";
import { bookings, courts, slots, users, venues } from "@/db/schema";
import { makeBookingCode } from "@/lib/codes";
import {
  CHECKOUT_HOLD_MINUTES,
  isTicketCategory,
  leftoverDescription,
} from "@/lib/constants";
import { appUrl, isStripeConfigured } from "@/lib/env";
import { remainingCapacity } from "@/lib/inventory";
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

export async function cancelPendingBooking(bookingId: string, checkoutSessionId?: string) {
  const db = await getDb();
  await db
    .update(bookings)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(bookings.id, bookingId),
        eq(bookings.status, "pending"),
        checkoutSessionId
          ? or(
              eq(bookings.stripeCheckoutSessionId, checkoutSessionId),
              eq(bookings.stripeCheckoutSessionId, `hold_${bookingId}`),
            )
          : sql`true`,
      ),
    );
}

export async function releaseCheckoutHold(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.bookingId;
  if (bookingId) {
    await cancelPendingBooking(bookingId, session.id);
    return;
  }
  const slotId = session.metadata?.slotId;
  if (slotId) {
    await releaseHold(slotId, session.id);
  }
}

async function syncTicketSlotStatus(slotId: string) {
  const db = await getDb();
  const deal = await loadDeal(slotId);
  if (!deal || !isTicketCategory(deal.venue.category)) return;
  if (deal.slot.status === "cancelled") return;

  const slotBookings = await db
    .select()
    .from(bookings)
    .where(eq(bookings.slotId, slotId));
  const remaining = remainingCapacity(deal.slot.capacity, slotBookings);
  await db
    .update(slots)
    .set({
      status: remaining <= 0 ? "booked" : "open",
      holdExpiresAt: null,
    })
    .where(eq(slots.id, slotId));
}

export async function fulfillPaidSlot(input: {
  slotId: string;
  userId: string;
  checkoutSessionId?: string;
  paymentIntentId?: string;
  bookingId?: string;
  quantity?: number;
}) {
  const db = await getDb();
  const deal = await loadDeal(input.slotId);
  if (!deal) throw new BookingError("That leftover is gone.");

  if (input.checkoutSessionId) {
    const bySession = await db.query.bookings.findFirst({
      where: eq(bookings.stripeCheckoutSessionId, input.checkoutSessionId),
    });
    if (bySession?.status === "paid") return bySession;
    if (bySession?.status === "pending") {
      return payPendingBooking(bySession.id, deal.venue.category, input);
    }
  }

  if (input.bookingId) {
    const existing = await db.query.bookings.findFirst({
      where: eq(bookings.id, input.bookingId),
    });
    if (existing?.status === "paid") return existing;
    if (existing?.status === "pending") {
      return payPendingBooking(existing.id, deal.venue.category, input);
    }
  }

  if (isTicketCategory(deal.venue.category)) {
    throw new BookingError("That leftover hold expired.");
  }

  const existingPaid = await db.query.bookings.findFirst({
    where: and(eq(bookings.slotId, input.slotId), eq(bookings.status, "paid")),
  });
  if (existingPaid) return existingPaid;

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
      quantity: 1,
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

async function payPendingBooking(
  bookingId: string,
  category: (typeof venues.$inferSelect)["category"],
  input: {
    slotId: string;
    checkoutSessionId?: string;
    paymentIntentId?: string;
  },
) {
  const db = await getDb();
  const [updated] = await db
    .update(bookings)
    .set({
      status: "paid",
      ...(input.checkoutSessionId
        ? { stripeCheckoutSessionId: input.checkoutSessionId }
        : {}),
      stripePaymentIntentId: input.paymentIntentId,
    })
    .where(eq(bookings.id, bookingId))
    .returning();

  if (isTicketCategory(category)) {
    await syncTicketSlotStatus(input.slotId);
  } else {
    await db
      .update(slots)
      .set({
        status: "booked",
        holdExpiresAt: null,
        stripeCheckoutSessionId: input.checkoutSessionId ?? null,
      })
      .where(eq(slots.id, input.slotId));
  }
  return updated;
}

async function reserveTicketHold(slotId: string, userId: string, quantity: number) {
  const db = await getDb();
  const deal = await loadDeal(slotId);
  if (!deal) throw new BookingError("That leftover is gone.");
  if (deal.venue.status !== "approved") {
    throw new BookingError("This venue is not live yet.");
  }
  if (deal.slot.status === "cancelled" || deal.slot.startsAt <= new Date()) {
    throw new BookingError("That leftover is gone.");
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new BookingError("Pick at least one leftover ticket.");
  }

  return db.transaction(async (tx) => {
    const [locked] = await tx
      .select()
      .from(slots)
      .where(eq(slots.id, slotId))
      .for("update");
    if (!locked) throw new BookingError("That leftover is gone.");

    const slotBookings = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.slotId, slotId));
    const remaining = remainingCapacity(locked.capacity, slotBookings);
    if (quantity > remaining) {
      throw new BookingError("Not enough leftover tickets left.");
    }

    const bookingId = crypto.randomUUID();
    const grossCents = locked.dealPriceCents * quantity;
    const commissionCents = commissionFromGross(grossCents, deal.venue.commissionBps);
    const [pending] = await tx
      .insert(bookings)
      .values({
        id: bookingId,
        slotId,
        userId,
        code: makeBookingCode(),
        quantity,
        grossCents,
        commissionCents,
        netCents: grossCents - commissionCents,
        payoutPending: isConnectReady(deal.venue) ? 0 : 1,
        stripeCheckoutSessionId: `hold_${bookingId}`,
        status: "pending",
      })
      .returning();
    return pending;
  });
}

export async function startCheckout(slotId: string, userId: string, quantity = 1) {
  const deal = await loadDeal(slotId);
  if (!deal) throw new BookingError("That leftover is gone.");
  if (deal.venue.status !== "approved") {
    throw new BookingError("This venue is not live yet.");
  }

  const db = await getDb();
  const ticketed = isTicketCategory(deal.venue.category);
  const qty = ticketed ? quantity : 1;

  if (!ticketed) {
    const existingPaid = await db.query.bookings.findFirst({
      where: and(eq(bookings.slotId, slotId), eq(bookings.status, "paid")),
    });
    if (existingPaid) {
      if (existingPaid.userId === userId) {
        return { url: `${appUrl()}/bookings/${existingPaid.id}` };
      }
      throw new BookingError("Someone else just took this slot.");
    }

    const held = await holdSlot(slotId);
    if (!held) {
      throw new BookingError("Someone else just took this slot.");
    }
  }

  const pending = ticketed ? await reserveTicketHold(slotId, userId, qty) : null;
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!isStripeConfigured()) {
    const booking = await fulfillPaidSlot({
      slotId,
      userId,
      bookingId: pending?.id,
      checkoutSessionId: pending ? `dev_${pending.id}` : `dev_${slotId}`,
      paymentIntentId: pending ? `dev_pi_${pending.id}` : `dev_pi_${slotId}`,
      quantity: qty,
    });
    return { url: `${appUrl()}/bookings/${booking.id}` };
  }

  const stripe = getStripe();
  if (!stripe) throw new BookingError("Payments are not configured.");

  const label = `${deal.venue.name} · ${deal.court.name} · ${formatDate(deal.slot.startsAt)} ${formatTimeRange(deal.slot.startsAt, deal.slot.endsAt)}`;
  const commissionCents = commissionFromGross(
    deal.slot.dealPriceCents * qty,
    deal.venue.commissionBps,
  );

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    payment_method_types: ["ideal", "card"],
    customer_email: user?.email ?? undefined,
    line_items: [
      {
        quantity: qty,
        price_data: {
          currency: "eur",
          unit_amount: deal.slot.dealPriceCents,
          product_data: {
            name: label,
            description: leftoverDescription(deal.venue.category),
          },
        },
      },
    ],
    metadata: {
      slotId,
      userId,
      quantity: String(qty),
      ...(pending ? { bookingId: pending.id } : {}),
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
    if (pending) await cancelPendingBooking(pending.id);
    else await releaseHold(slotId);
    throw new BookingError("Could not start checkout.");
  }

  if (pending) {
    await db
      .update(bookings)
      .set({ stripeCheckoutSessionId: session.id })
      .where(eq(bookings.id, pending.id));
  } else {
    await db
      .update(slots)
      .set({
        stripeCheckoutSessionId: session.id,
        holdExpiresAt: session.expires_at
          ? new Date(session.expires_at * 1000)
          : undefined,
      })
      .where(eq(slots.id, slotId));
  }

  if (!session.url) {
    if (pending) await cancelPendingBooking(pending.id, session.id);
    else await releaseHold(slotId, session.id);
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
    bookingId: session.metadata?.bookingId,
    checkoutSessionId: session.id,
    paymentIntentId,
    quantity: Number(session.metadata?.quantity ?? 1),
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

  if (isTicketCategory(row.venue.category)) {
    await syncTicketSlotStatus(row.slot.id);
  } else {
    await db
      .update(slots)
      .set({ status: "cancelled", holdExpiresAt: null })
      .where(eq(slots.id, row.slot.id));
  }
}

export async function cancelOpenSlot(slotId: string, venueOwnerId: string) {
  const db = await getDb();
  const deal = await loadDeal(slotId);
  if (!deal) throw new BookingError("Slot not found.");
  if (deal.venue.ownerId !== venueOwnerId) {
    throw new BookingError("You cannot cancel this slot.");
  }

  if (isTicketCategory(deal.venue.category)) {
    await db
      .update(slots)
      .set({ status: "cancelled", holdExpiresAt: null })
      .where(eq(slots.id, slotId));
    return;
  }

  if (deal.slot.status === "booked") {
    throw new BookingError("This slot is already booked. Refund the guest instead.");
  }
  await db
    .update(slots)
    .set({ status: "cancelled", holdExpiresAt: null })
    .where(eq(slots.id, slotId));
}
