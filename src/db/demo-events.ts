import { addDays } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { courts, slots, users, venues } from "./schema";
import { TIMEZONE } from "@/lib/constants";

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
    venueSlug: "strike-boschstraat",
    startsAt: () => amsterdamAt(upcomingDay(2), 19),
    endsAt: () => amsterdamAt(upcomingDay(2), 20),
    originalPriceCents: 3200,
    dealPriceCents: 1600,
  },
  {
    id: "slot_demo_padel_1",
    courtId: "court_plaza_8",
    venueSlug: "plaza-padel-maastricht",
    startsAt: () => amsterdamAt(upcomingDay(2), 17),
    endsAt: () => amsterdamAt(upcomingDay(2), 18),
    originalPriceCents: 3600,
    dealPriceCents: 1800,
  },
  {
    id: "slot_demo_bowling_2",
    courtId: "court_bowl_4",
    venueSlug: "strike-boschstraat",
    startsAt: () => amsterdamAt(upcomingDay(3), 20),
    endsAt: () => amsterdamAt(upcomingDay(3), 21),
    originalPriceCents: 3200,
    dealPriceCents: 1600,
  },
  {
    id: "slot_demo_karting_1",
    courtId: "court_kart_1",
    venueSlug: "karting-beatrixhaven",
    startsAt: () => amsterdamAt(upcomingDay(3), 18),
    endsAt: () => amsterdamAt(upcomingDay(3), 18, 30),
    originalPriceCents: 4900,
    dealPriceCents: 2500,
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
  event: (typeof DEMO_EVENTS)[number],
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
    capacity: 1,
    status: "open",
  });
  return true;
}

export async function seedDemoEvents(db: SeedDb) {
  await ensureGoKartingCategory(db);
  await ensureKartingVenue(db);
  let inserted = 0;
  for (const event of DEMO_EVENTS) {
    if (await insertDemoSlot(db, event)) inserted += 1;
  }
  return { inserted, total: DEMO_EVENTS.length };
}
