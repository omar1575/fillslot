import { addDays } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { bookings, courts, slots, users, venues } from "./schema";
import { DEFAULT_COMMISSION_BPS, TIMEZONE } from "@/lib/constants";
import { commissionFromGross } from "@/lib/money";

type SeedDb = PostgresJsDatabase<typeof schema>;

function amsterdamAt(base: Date, hour: number, minute = 0) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(base);
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  const local = `${get("year")}-${get("month")}-${get("day")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
  return fromZonedTime(local, TIMEZONE);
}

function upcomingDay(offset: number) {
  return addDays(new Date(), offset);
}

const DEMO_EVENTS = [
  {
    id: "slot_demo_bowling_1",
    courtId: "court_bowl_3",
    startsAt: () => amsterdamAt(upcomingDay(2), 19),
    endsAt: () => amsterdamAt(upcomingDay(2), 20),
    originalPriceCents: 3200,
    dealPriceCents: 1600,
    capacity: 1,
  },
  {
    id: "slot_demo_padel_1",
    courtId: "court_plaza_8",
    startsAt: () => amsterdamAt(upcomingDay(2), 17),
    endsAt: () => amsterdamAt(upcomingDay(2), 18),
    originalPriceCents: 3600,
    dealPriceCents: 1800,
    capacity: 1,
  },
  {
    id: "slot_demo_bowling_2",
    courtId: "court_bowl_4",
    startsAt: () => amsterdamAt(upcomingDay(3), 20),
    endsAt: () => amsterdamAt(upcomingDay(3), 21),
    originalPriceCents: 3200,
    dealPriceCents: 1600,
    capacity: 1,
  },
  {
    id: "slot_demo_karting_1",
    courtId: "court_kart_1",
    startsAt: () => amsterdamAt(upcomingDay(3), 18),
    endsAt: () => amsterdamAt(upcomingDay(3), 18, 30),
    originalPriceCents: 4900,
    dealPriceCents: 2500,
    capacity: 1,
  },
  {
    id: "slot_demo_cinema_1",
    courtId: "court_cinema_1",
    startsAt: () => amsterdamAt(upcomingDay(4), 21),
    endsAt: () => amsterdamAt(upcomingDay(4), 23),
    originalPriceCents: 1400,
    dealPriceCents: 700,
    capacity: 12,
  },
] as const;

const DEMO_BOOKINGS = [
  {
    bookingId: "booking_demo_lars",
    code: "LARS16",
    email: "lars@fillslot.test",
    quantity: 1,
    exclusive: true,
    slot: {
      id: "slot_booked_bowling_1",
      courtId: "court_bowl_3",
      startsAt: () => amsterdamAt(upcomingDay(2), 18),
      endsAt: () => amsterdamAt(upcomingDay(2), 19),
      originalPriceCents: 3200,
      dealPriceCents: 1600,
      capacity: 1,
    },
  },
  {
    bookingId: "booking_demo_noor",
    code: "NOOR18",
    email: "noor@fillslot.test",
    quantity: 1,
    exclusive: true,
    slot: {
      id: "slot_booked_padel_1",
      courtId: "court_plaza_8",
      startsAt: () => amsterdamAt(upcomingDay(2), 16),
      endsAt: () => amsterdamAt(upcomingDay(2), 17),
      originalPriceCents: 3600,
      dealPriceCents: 1800,
      capacity: 1,
    },
  },
  {
    bookingId: "booking_demo_sem",
    code: "SEM16",
    email: "sem@fillslot.test",
    quantity: 1,
    exclusive: true,
    slot: {
      id: "slot_booked_bowling_2",
      courtId: "court_bowl_4",
      startsAt: () => amsterdamAt(upcomingDay(3), 19),
      endsAt: () => amsterdamAt(upcomingDay(3), 20),
      originalPriceCents: 3200,
      dealPriceCents: 1600,
      capacity: 1,
    },
  },
  {
    bookingId: "booking_demo_ines",
    code: "INES25",
    email: "ines@fillslot.test",
    quantity: 1,
    exclusive: true,
    slot: {
      id: "slot_booked_karting_1",
      courtId: "court_kart_1",
      startsAt: () => amsterdamAt(upcomingDay(3), 19),
      endsAt: () => amsterdamAt(upcomingDay(3), 19, 30),
      originalPriceCents: 4900,
      dealPriceCents: 2500,
      capacity: 1,
    },
  },
  {
    bookingId: "booking_demo_jules",
    code: "JULES7",
    email: "jules@fillslot.test",
    quantity: 2,
    exclusive: false,
    slot: {
      id: "slot_demo_cinema_1",
      courtId: "court_cinema_1",
      startsAt: () => amsterdamAt(upcomingDay(4), 21),
      endsAt: () => amsterdamAt(upcomingDay(4), 23),
      originalPriceCents: 1400,
      dealPriceCents: 700,
      capacity: 12,
    },
  },
] as const;

async function ensureGoKartingCategory(db: SeedDb) {
  await db.execute(
    sql`ALTER TYPE activity_category ADD VALUE IF NOT EXISTS 'go_karting'`,
  );
}

async function ensureKartingVenue(db: SeedDb) {
  const owner = await db.query.users.findFirst({
    where: eq(users.email, "club@kartingbeatrixhaven.test"),
  });
  if (!owner) {
    throw new Error("Karting partner missing after seed");
  }

  let venue = await db.query.venues.findFirst({
    where: eq(venues.slug, "karting-beatrixhaven"),
  });
  if (!venue) {
    const [created] = await db
      .insert(venues)
      .values({
        id: "venue_karting_beatrixhaven",
        ownerId: owner.id,
        name: "Karting Beatrixhaven",
        slug: "karting-beatrixhaven",
        description:
          "Indoor leftover sessions on the Beatrixhaven track. Empty karts go on Fillslot instead of sitting idle.",
        address: "Merwedeweg 5",
        city: "Maastricht",
        postalCode: "6222 AE",
        country: "NL",
        category: "go_karting",
        commissionBps: 1500,
        status: "approved",
      })
      .returning();
    venue = created;
  } else {
    await db
      .update(venues)
      .set({
        ownerId: owner.id,
        status: "approved",
        category: "go_karting",
        name: "Karting Beatrixhaven",
      })
      .where(eq(venues.id, venue.id));
  }

  const existing = await db.query.courts.findFirst({
    where: eq(courts.id, "court_kart_1"),
  });
  if (!existing) {
    await db.insert(courts).values({
      id: "court_kart_1",
      venueId: venue.id,
      name: "Kart 1 · leftover session",
      sortOrder: 1,
    });
  }
}

async function insertDemoSlot(
  db: SeedDb,
  event: {
    id: string;
    courtId: string;
    startsAt: () => Date;
    endsAt: () => Date;
    originalPriceCents: number;
    dealPriceCents: number;
    capacity: number;
  },
  status: "open" | "booked" = "open",
) {
  const startsAt = event.startsAt();
  const endsAt = event.endsAt();
  if (startsAt <= new Date()) return false;

  const byId = await db.query.slots.findFirst({
    where: eq(slots.id, event.id),
  });
  if (byId) return false;

  const court = await db.query.courts.findFirst({
    where: eq(courts.id, event.courtId),
  });
  if (!court) {
    throw new Error(`Demo court missing: ${event.courtId}`);
  }

  await db.insert(slots).values({
    id: event.id,
    courtId: event.courtId,
    startsAt,
    endsAt,
    originalPriceCents: event.originalPriceCents,
    dealPriceCents: event.dealPriceCents,
    capacity: event.capacity,
    status,
  });
  return true;
}

async function seedDemoBookings(db: SeedDb) {
  let inserted = 0;
  for (const guest of DEMO_BOOKINGS) {
    await insertDemoSlot(db, guest.slot, guest.exclusive ? "booked" : "open");

    const existing = await db.query.bookings.findFirst({
      where: eq(bookings.id, guest.bookingId),
    });
    if (existing) continue;

    const user = await db.query.users.findFirst({
      where: eq(users.email, guest.email),
    });
    if (!user) {
      throw new Error(`Demo guest missing after seed: ${guest.email}`);
    }

    const slot = await db.query.slots.findFirst({
      where: eq(slots.id, guest.slot.id),
    });
    if (!slot) {
      throw new Error(`Demo slot missing for booking: ${guest.slot.id}`);
    }

    const court = await db.query.courts.findFirst({
      where: eq(courts.id, slot.courtId),
    });
    const venue = court
      ? await db.query.venues.findFirst({
          where: eq(venues.id, court.venueId),
        })
      : undefined;
    const commissionBps = venue?.commissionBps ?? DEFAULT_COMMISSION_BPS;
    const grossCents = slot.dealPriceCents * guest.quantity;
    const commissionCents = commissionFromGross(grossCents, commissionBps);

    await db.insert(bookings).values({
      id: guest.bookingId,
      slotId: slot.id,
      userId: user.id,
      code: guest.code,
      quantity: guest.quantity,
      grossCents,
      commissionCents,
      netCents: grossCents - commissionCents,
      payoutPending: 1,
      stripeCheckoutSessionId: `demo_${guest.bookingId}`,
      stripePaymentIntentId: `demo_pi_${guest.bookingId}`,
      status: "paid",
    });

    if (guest.exclusive) {
      await db
        .update(slots)
        .set({ status: "booked", holdExpiresAt: null })
        .where(eq(slots.id, slot.id));
    }
    inserted += 1;
  }
  return inserted;
}

export async function seedDemoEvents(db: SeedDb) {
  await ensureGoKartingCategory(db);
  await ensureKartingVenue(db);
  let inserted = 0;
  for (const event of DEMO_EVENTS) {
    if (await insertDemoSlot(db, event)) inserted += 1;
  }
  const bookingsInserted = await seedDemoBookings(db);
  return { inserted, total: DEMO_EVENTS.length, bookings: bookingsInserted };
}
