import { and, asc, eq, gt, inArray, lt, or } from "drizzle-orm";
import { getDb } from "@/db";
import {
  bookings,
  courts,
  slots,
  users,
  venues,
  type ActivityCategory,
  type Booking,
  type Court,
  type Slot,
  type User,
  type Venue,
} from "@/db/schema";
import { DEFAULT_CITY, isTicketCategory, parseCategory } from "@/lib/constants";
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
  if (isTicketCategory(row.venue.category)) {
    return row.slot.status !== "booked" && row.remaining > 0;
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

export async function getOpenDeals(city = DEFAULT_CITY, category?: ActivityCategory | string) {
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
  return row ?? null;
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
  return db
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
        sold: slotBookings
          .filter((item) => item.booking.status === "paid")
          .reduce((sum, item) => sum + item.booking.quantity, 0),
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
