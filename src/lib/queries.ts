import { and, asc, eq, gt, inArray, lt, or } from "drizzle-orm";
import { getDb } from "@/db";
import { bookings, courts, slots, users, venues, type Slot } from "@/db/schema";
import { DEFAULT_CITY } from "@/lib/constants";

export function isSlotBookable(slot: Pick<Slot, "status" | "holdExpiresAt" | "startsAt">, now = new Date()) {
  if (slot.startsAt <= now) return false;
  if (slot.status === "open") return true;
  if (slot.status === "held" && slot.holdExpiresAt && slot.holdExpiresAt <= now) {
    return true;
  }
  return false;
}

export async function getOpenDeals(city = DEFAULT_CITY) {
  const db = await getDb();
  const now = new Date();
  const rows = await db
    .select({
      slot: slots,
      court: courts,
      venue: venues,
    })
    .from(slots)
    .innerJoin(courts, eq(slots.courtId, courts.id))
    .innerJoin(venues, eq(courts.venueId, venues.id))
    .where(
      and(
        eq(venues.city, city),
        eq(venues.status, "approved"),
        gt(slots.startsAt, now),
        or(
          eq(slots.status, "open"),
          and(eq(slots.status, "held"), lt(slots.holdExpiresAt, now)),
        ),
      ),
    )
    .orderBy(asc(slots.startsAt));

  return rows;
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
  return row ?? null;
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
    .where(eq(bookings.userId, userId))
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
            booking: bookings,
            player: users,
          })
          .from(slots)
          .innerJoin(courts, eq(slots.courtId, courts.id))
          .leftJoin(bookings, eq(bookings.slotId, slots.id))
          .leftJoin(users, eq(bookings.userId, users.id))
          .where(inArray(slots.courtId, courtIds))
          .orderBy(asc(slots.startsAt));

  return { courts: venueCourts, slots: venueSlots };
}

export async function getPendingVenues() {
  const db = await getDb();
  return db.select().from(venues).where(eq(venues.status, "pending"));
}

export async function getAllVenues() {
  const db = await getDb();
  return db.select().from(venues).orderBy(asc(venues.name));
}
