import { and, asc, eq, gt, inArray, ne, or, sql } from "drizzle-orm";
import { addHours } from "date-fns";
import { getDb } from "@/db";
import { userOnboarding } from "@/db/onboarding-schema";
import {
  bookings,
  courts,
  notices,
  slots,
  users,
  venues,
  type Slot,
} from "@/db/schema";
import { refundPaidBookingsForSlot, syncSharedSlotStatus } from "@/lib/booking";
import {
  CATEGORY_LABELS,
  FILL_INVITE_MINUTES,
  FILL_REFUND_MINUTES,
  interestsForCategory,
  usesFillThreshold,
} from "@/lib/constants";
import { isFillMet } from "@/lib/fill-rules";
import { remainingCapacity } from "@/lib/inventory";
import { formatDate, formatTimeRange } from "@/lib/time";

function paidCount(slotBookings: { status: string; quantity: number }[]) {
  return slotBookings.reduce((sum, booking) => {
    if (booking.status === "paid") return sum + booking.quantity;
    return sum;
  }, 0);
}

async function writeNotice(input: {
  userId: string;
  type: "fill_invite" | "switch_offer" | "confirmed" | "refunded";
  slotId?: string | null;
  relatedSlotId?: string | null;
  title: string;
  body: string;
}) {
  const db = await getDb();
  if (input.slotId) {
    const existing = await db
      .select({ id: notices.id })
      .from(notices)
      .where(
        and(
          eq(notices.userId, input.userId),
          eq(notices.type, input.type),
          eq(notices.slotId, input.slotId),
          input.relatedSlotId
            ? eq(notices.relatedSlotId, input.relatedSlotId)
            : sql`${notices.relatedSlotId} is null`,
        ),
      )
      .limit(1);
    if (existing[0]) return;
  }
  await db.insert(notices).values({
    userId: input.userId,
    type: input.type,
    slotId: input.slotId ?? null,
    relatedSlotId: input.relatedSlotId ?? null,
    title: input.title,
    body: input.body,
  });
}

async function loadFillSlot(slotId: string) {
  const db = await getDb();
  const [row] = await db
    .select({ slot: slots, court: courts, venue: venues })
    .from(slots)
    .innerJoin(courts, eq(slots.courtId, courts.id))
    .innerJoin(venues, eq(courts.venueId, venues.id))
    .where(eq(slots.id, slotId))
    .limit(1);
  if (!row) return null;
  const slotBookings = await db.select().from(bookings).where(eq(bookings.slotId, slotId));
  return { ...row, bookings: slotBookings, paid: paidCount(slotBookings) };
}

async function alternativeSlots(slot: Slot, venueId: string, category: (typeof venues.$inferSelect)["category"]) {
  const db = await getDb();
  const now = new Date();
  const rows = await db
    .select({ slot: slots, court: courts, venue: venues })
    .from(slots)
    .innerJoin(courts, eq(slots.courtId, courts.id))
    .innerJoin(venues, eq(courts.venueId, venues.id))
    .where(
      and(
        ne(slots.id, slot.id),
        eq(venues.category, category),
        eq(venues.status, "approved"),
        gt(slots.startsAt, now),
        or(eq(slots.status, "open"), eq(slots.status, "held")),
        sql`${slots.startsAt} <= ${addHours(slot.startsAt, 4)}`,
      ),
    )
    .orderBy(asc(slots.startsAt))
    .limit(12);

  const slotIds = rows.map((row) => row.slot.id);
  const allBookings =
    slotIds.length === 0
      ? []
      : await db.select().from(bookings).where(inArray(bookings.slotId, slotIds));
  const bySlot = new Map<string, typeof allBookings>();
  for (const booking of allBookings) {
    const list = bySlot.get(booking.slotId) ?? [];
    list.push(booking);
    bySlot.set(booking.slotId, list);
  }

  return rows
    .filter((row) => remainingCapacity(row.slot.capacity, bySlot.get(row.slot.id) ?? []) > 0)
    .filter((row) => row.venue.id === venueId || row.slot.startsAt.getTime() - slot.startsAt.getTime() < 4 * 60 * 60 * 1000)
    .slice(0, 3);
}

async function inviteGuests(row: NonNullable<Awaited<ReturnType<typeof loadFillSlot>>>) {
  const db = await getDb();
  const interests = interestsForCategory(row.venue.category);
  const paidUserIds = new Set(
    row.bookings.filter((booking) => booking.status === "paid").map((booking) => booking.userId),
  );

  let candidates: { id: string }[] = [];
  if (interests.length > 0) {
    candidates = await db
      .select({ id: users.id })
      .from(users)
      .innerJoin(userOnboarding, eq(userOnboarding.userId, users.id))
      .where(
        and(
          eq(users.role, "consumer"),
          sql`${userOnboarding.interests} && ARRAY[${sql.join(
            interests.map((interest) => sql`${interest}`),
            sql`, `,
          )}]::text[]`,
        ),
      )
      .limit(24);
  }

  const when = `${formatDate(row.slot.startsAt)} ${formatTimeRange(row.slot.startsAt, row.slot.endsAt)}`;
  const title = `${row.venue.name} still needs people`;
  const body = `${CATEGORY_LABELS[row.venue.category]} leftover at ${when} is short of its fill. Join now or it may be cancelled.`;

  let invited = 0;
  for (const candidate of candidates) {
    if (paidUserIds.has(candidate.id)) continue;
    await writeNotice({
      userId: candidate.id,
      type: "fill_invite",
      slotId: row.slot.id,
      title,
      body,
    });
    invited += 1;
  }
  return invited;
}

async function offerSwitches(row: NonNullable<Awaited<ReturnType<typeof loadFillSlot>>>) {
  const alternatives = await alternativeSlots(row.slot, row.venue.id, row.venue.category);
  const guests = row.bookings.filter((booking) => booking.status === "paid");
  if (guests.length === 0) return 0;

  const when = `${formatDate(row.slot.startsAt)} ${formatTimeRange(row.slot.startsAt, row.slot.endsAt)}`;
  let sent = 0;
  for (const guest of guests) {
    if (alternatives.length === 0) {
      await writeNotice({
        userId: guest.userId,
        type: "switch_offer",
        slotId: row.slot.id,
        title: `${row.venue.name} is still short`,
        body: `${when} does not have enough people yet. If it still is not filled close to start, you get your money back.`,
      });
      sent += 1;
      continue;
    }
    for (const option of alternatives) {
      await writeNotice({
        userId: guest.userId,
        type: "switch_offer",
        slotId: row.slot.id,
        relatedSlotId: option.slot.id,
        title: "This leftover may not fill",
        body: `${row.venue.name} at ${when} is still short. Another leftover is open at ${option.venue.name}, ${formatDate(option.slot.startsAt)} ${formatTimeRange(option.slot.startsAt, option.slot.endsAt)}.`,
      });
      sent += 1;
    }
  }
  return sent;
}

export async function confirmFilledSlot(slotId: string) {
  const row = await loadFillSlot(slotId);
  if (!row || !usesFillThreshold(row.slot)) return false;
  if (!isFillMet(row.slot, row.paid)) return false;
  if (row.slot.fillState === "confirmed" || row.slot.fillState === "refunded") return false;

  const db = await getDb();
  await db
    .update(slots)
    .set({
      fillState: "confirmed",
      fillResolvedAt: new Date(),
    })
    .where(eq(slots.id, slotId));
  await syncSharedSlotStatus(slotId);

  const when = `${formatDate(row.slot.startsAt)} ${formatTimeRange(row.slot.startsAt, row.slot.endsAt)}`;
  for (const guest of row.bookings.filter((booking) => booking.status === "paid")) {
    await writeNotice({
      userId: guest.userId,
      type: "confirmed",
      slotId,
      title: "This leftover is on",
      body: `${row.venue.name} at ${when} hit its fill. See you there.`,
    });
  }
  return true;
}

async function inviteForSlot(slotId: string) {
  const row = await loadFillSlot(slotId);
  if (!row || !usesFillThreshold(row.slot)) return;
  if (row.slot.status === "cancelled" || row.slot.fillState === "refunded") return;
  if (isFillMet(row.slot, row.paid)) {
    await confirmFilledSlot(slotId);
    return;
  }
  if (row.slot.fillInviteSentAt) return;

  const db = await getDb();
  await db
    .update(slots)
    .set({
      fillState: "inviting",
      fillInviteSentAt: new Date(),
    })
    .where(eq(slots.id, slotId));

  try {
    await inviteGuests(row);
  } catch {
    // Guest interest matching is best-effort.
  }
  await offerSwitches(row);
}

async function refundIfStillShort(slotId: string) {
  const row = await loadFillSlot(slotId);
  if (!row || !usesFillThreshold(row.slot)) return;
  if (row.slot.fillResolvedAt || row.slot.status === "cancelled") return;
  if (isFillMet(row.slot, row.paid)) {
    await confirmFilledSlot(slotId);
    return;
  }

  const when = `${formatDate(row.slot.startsAt)} ${formatTimeRange(row.slot.startsAt, row.slot.endsAt)}`;
  await refundPaidBookingsForSlot(slotId);
  const db = await getDb();
  await db
    .update(slots)
    .set({
      status: "cancelled",
      fillState: "refunded",
      fillResolvedAt: new Date(),
      holdExpiresAt: null,
    })
    .where(eq(slots.id, slotId));

  for (const guest of row.bookings.filter((booking) => booking.status === "paid")) {
    await writeNotice({
      userId: guest.userId,
      type: "refunded",
      slotId,
      title: "This leftover did not fill",
      body: `${row.venue.name} at ${when} did not hit its minimum, so your payment was refunded.`,
    });
  }
}

export async function processFillDeadlines(now = new Date()) {
  const db = await getDb();
  const inviteCutoff = new Date(now.getTime() + FILL_INVITE_MINUTES * 60 * 1000);
  const refundCutoff = new Date(now.getTime() + FILL_REFUND_MINUTES * 60 * 1000);

  const due = await db
    .select({ id: slots.id, startsAt: slots.startsAt, fillInviteSentAt: slots.fillInviteSentAt, fillResolvedAt: slots.fillResolvedAt })
    .from(slots)
    .where(
      and(
        gt(slots.startsAt, now),
        or(eq(slots.fillMode, "threshold"), eq(slots.fillMode, "exact")),
        or(eq(slots.status, "open"), eq(slots.status, "held"), eq(slots.status, "booked")),
      ),
    );

  let invited = 0;
  let refunded = 0;
  let confirmed = 0;

  for (const slot of due) {
    if (slot.fillResolvedAt) continue;
    if (slot.startsAt <= refundCutoff) {
      const before = await loadFillSlot(slot.id);
      await refundIfStillShort(slot.id);
      const after = await loadFillSlot(slot.id);
      if (after?.slot.fillState === "refunded") refunded += 1;
      else if (after?.slot.fillState === "confirmed" && before?.slot.fillState !== "confirmed") confirmed += 1;
      continue;
    }
    if (slot.startsAt <= inviteCutoff) {
      const before = slot.fillInviteSentAt;
      await inviteForSlot(slot.id);
      const after = await loadFillSlot(slot.id);
      if (!before && after?.slot.fillInviteSentAt) invited += 1;
      if (after?.slot.fillState === "confirmed") confirmed += 1;
    }
  }

  return { checked: due.length, invited, refunded, confirmed };
}
