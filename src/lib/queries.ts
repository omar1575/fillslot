import { and, asc, desc, eq, gt, inArray, lt, or } from "drizzle-orm";
import { getDb } from "@/db";
import {
  bookings,
  courts,
  notices,
  slots,
  users,
  venues,
  weeklyWindows,
  type ActivityCategory,
  type Booking,
  type Court,
  type Slot,
  type User,
  type Venue,
} from "@/db/schema";
import { DEFAULT_CITY, parseCategory, usesSharedInventory } from "@/lib/constants";
import { remainingCapacity } from "@/lib/inventory";

export function isSlotBookable(slot: Pick<Slot, "status" | "holdExpiresAt" | "startsAt">, now = new Date()) {
  if (slot.startsAt <= now) return false;
  if (slot.status === "open") return true;
  if (slot.status === "held" && slot.holdExpiresAt && slot.holdExpiresAt <= now) {
    return true;
  }
  return false;
}

export type DealRow = {
  slot: Slot;
  court: Court;
  venue: Venue;
  remaining: number;
};

function isDealListed(row: DealRow, now = new Date()) {
  if (row.venue.status !== "approved") return false;
  if (row.slot.startsAt <= now) return false;
  if (row.slot.status === "cancelled") return false;
  if (row.slot.fillState === "refunded") return false;
  if (usesSharedInventory(row.slot, row.venue.category)) {
    return row.remaining > 0;
  }
  return isSlotBookable(row.slot, now);
}

export function isDealBookable(row: DealRow, now = new Date()) {
  return isDealListed(row, now);
}

async function attachRemaining(
  rows: { slot: Slot; court: Court; venue: Venue }[],
): Promise<DealRow[]> {
  if (rows.length === 0) return [];
  const db = await getDb();
  const slotIds = rows.map((row) => row.slot.id);
  const slotBookings = await db
    .select()
    .from(bookings)
    .where(inArray(bookings.slotId, slotIds));
  const bySlot = new Map<string, Booking[]>();
  for (const booking of slotBookings) {
    const list = bySlot.get(booking.slotId) ?? [];
    list.push(booking);
    bySlot.set(booking.slotId, list);
  }
  return rows.map((row) => ({
    ...row,
    remaining: remainingCapacity(row.slot.capacity, bySlot.get(row.slot.id) ?? []),
  }));
}

function signedInQuantity(list: Booking[]) {
  return list
    .filter((booking) => booking.status === "paid" || booking.status === "completed")
    .reduce((sum, booking) => sum + booking.quantity, 0);
}

async function occupancyBySlotId(slotIds: string[]) {
  const counts = new Map<string, number>();
  if (slotIds.length === 0) return counts;
  const db = await getDb();
  const rows = await db.select().from(bookings).where(inArray(bookings.slotId, slotIds));
  const bySlot = new Map<string, Booking[]>();
  for (const booking of rows) {
    const list = bySlot.get(booking.slotId) ?? [];
    list.push(booking);
    bySlot.set(booking.slotId, list);
  }
  for (const [slotId, list] of bySlot) {
    counts.set(slotId, signedInQuantity(list));
  }
  return counts;
}

export async function getOpenDeals(city = DEFAULT_CITY, category?: ActivityCategory | string) {
  try {
    const { processFillDeadlines } = await import("@/lib/fill");
    await processFillDeadlines();
  } catch {
    // Local demo still lists leftovers if the fill job cannot run.
  }

  const db = await getDb();
  const now = new Date();
  const parsedCategory = parseCategory(category);
  const filters = [
    eq(venues.city, city),
    eq(venues.status, "approved"),
    gt(slots.startsAt, now),
    or(
      eq(slots.status, "open"),
      and(eq(slots.status, "held"), lt(slots.holdExpiresAt, now)),
    ),
  ];
  if (parsedCategory) filters.push(eq(venues.category, parsedCategory));

  const rows = await db
    .select({
      slot: slots,
      court: courts,
      venue: venues,
    })
    .from(slots)
    .innerJoin(courts, eq(slots.courtId, courts.id))
    .innerJoin(venues, eq(courts.venueId, venues.id))
    .where(and(...filters))
    .orderBy(asc(slots.startsAt));

  const withRemaining = await attachRemaining(rows);
  return withRemaining.filter((row) => isDealListed(row, now));
}

export async function getDealById(id: string) {
  const db = await getDb();
  const [row] = await db
    .select({
      slot: slots,
      court: courts,
      venue: venues,
    })
    .from(slots)
    .innerJoin(courts, eq(slots.courtId, courts.id))
    .innerJoin(venues, eq(courts.venueId, venues.id))
    .where(eq(slots.id, id))
    .limit(1);
  if (!row) return null;
  const [deal] = await attachRemaining([row]);
  return deal ?? null;
}

export async function getBookingWithDetails(id: string) {
  const db = await getDb();
  const [row] = await db
    .select({
      booking: bookings,
      slot: slots,
      court: courts,
      venue: venues,
      player: users,
    })
    .from(bookings)
    .innerJoin(slots, eq(bookings.slotId, slots.id))
    .innerJoin(courts, eq(slots.courtId, courts.id))
    .innerJoin(venues, eq(courts.venueId, venues.id))
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(eq(bookings.id, id))
    .limit(1);
  if (!row) return null;
  const occupancy = await occupancyBySlotId([row.slot.id]);
  return {
    ...row,
    signedIn: occupancy.get(row.slot.id) ?? 0,
  };
}

export async function getBookingByCheckoutSession(sessionId: string) {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.stripeCheckoutSessionId, sessionId))
    .limit(1);
  return row ?? null;
}

export async function getUserBookings(userId: string) {
  const db = await getDb();
  const rows = await db
    .select({
      booking: bookings,
      slot: slots,
      court: courts,
      venue: venues,
    })
    .from(bookings)
    .innerJoin(slots, eq(bookings.slotId, slots.id))
    .innerJoin(courts, eq(slots.courtId, courts.id))
    .innerJoin(venues, eq(courts.venueId, venues.id))
    .where(and(eq(bookings.userId, userId), inArray(bookings.status, ["paid", "refunded", "completed"])))
    .orderBy(asc(slots.startsAt));
  const occupancy = await occupancyBySlotId(rows.map((row) => row.slot.id));
  return rows.map((row) => ({
    ...row,
    signedIn: occupancy.get(row.slot.id) ?? 0,
  }));
}

export async function getVenueForOwner(userId: string) {
  const db = await getDb();
  const [venue] = await db
    .select()
    .from(venues)
    .where(eq(venues.ownerId, userId))
    .limit(1);
  return venue ?? null;
}

export async function getClubDashboard(venueId: string) {
  const db = await getDb();
  const venueCourts = await db
    .select()
    .from(courts)
    .where(eq(courts.venueId, venueId))
    .orderBy(asc(courts.sortOrder));

  const courtIds = venueCourts.map((court) => court.id);
  const venueSlots =
    courtIds.length === 0
      ? []
      : await db
          .select({
            slot: slots,
            court: courts,
          })
          .from(slots)
          .innerJoin(courts, eq(slots.courtId, courts.id))
          .where(inArray(slots.courtId, courtIds))
          .orderBy(asc(slots.startsAt));

  const slotIds = venueSlots.map((row) => row.slot.id);
  const bookingRows =
    slotIds.length === 0
      ? []
      : await db
          .select({
            booking: bookings,
            player: users,
          })
          .from(bookings)
          .leftJoin(users, eq(bookings.userId, users.id))
          .where(inArray(bookings.slotId, slotIds));

  const bookingsBySlot = new Map<string, { booking: Booking; player: User | null }[]>();
  for (const row of bookingRows) {
    const list = bookingsBySlot.get(row.booking.slotId) ?? [];
    list.push({ booking: row.booking, player: row.player });
    bookingsBySlot.set(row.booking.slotId, list);
  }

  return {
    courts: venueCourts,
    slots: venueSlots.map((row) => {
      const slotBookings = bookingsBySlot.get(row.slot.id) ?? [];
      return {
        ...row,
        bookings: slotBookings,
        remaining: remainingCapacity(
          row.slot.capacity,
          slotBookings.map((item) => item.booking),
        ),
        sold: signedInQuantity(slotBookings.map((item) => item.booking)),
      };
    }),
  };
}

export async function getPendingVenues() {
  const db = await getDb();
  return db.select().from(venues).where(eq(venues.status, "pending"));
}

export async function getAllVenues() {
  const db = await getDb();
  return db.select().from(venues).orderBy(asc(venues.name));
}

export async function getWeeklyWindowsForVenue(venueId: string) {
  const db = await getDb();
  return db
    .select()
    .from(weeklyWindows)
    .where(eq(weeklyWindows.venueId, venueId))
    .orderBy(asc(weeklyWindows.weekday), asc(weeklyWindows.startMinute));
}

export async function getUserNotices(userId: string) {
  const db = await getDb();
  return db
    .select({
      notice: notices,
      slot: slots,
      venue: venues,
    })
    .from(notices)
    .leftJoin(slots, eq(notices.slotId, slots.id))
    .leftJoin(courts, eq(slots.courtId, courts.id))
    .leftJoin(venues, eq(courts.venueId, venues.id))
    .where(eq(notices.userId, userId))
    .orderBy(desc(notices.createdAt));
}
