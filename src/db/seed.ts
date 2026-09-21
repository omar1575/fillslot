import { eq } from "drizzle-orm";
import { addDays } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { courts, slots, users, venues, type ActivityCategory } from "./schema";
import { DEV_ACCOUNTS, TIMEZONE } from "@/lib/constants";

type SeedDb =
  | PgliteDatabase<typeof schema>
  | PostgresJsDatabase<typeof schema>;

const PLAZA_COURTS = [
  "Padel 1 · Beks Interieur",
  "Padel 2 · Bundeling",
  "Padel 3 · Previder",
  "Padel 4",
  "Padel 5",
  "Padel 6 · Benelux Vloerverwarming",
  "Padel 7 · Occasion Center Maastricht",
  "Padel 8",
  "Padel 9 · Forza Asset Management",
];

type CatalogVenue = {
  ownerEmail: string;
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  postalCode: string;
  category: ActivityCategory;
  resources: { id: string; name: string }[];
  makeSlots: (resourceIds: Map<string, string>) => SeedSlot[];
};

type SeedSlot = {
  courtId: string;
  startsAt: Date;
  endsAt: Date;
  originalPriceCents: number;
  dealPriceCents: number;
  capacity: number;
};

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

function isAmsterdamWeekday(date: Date) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
  }).format(date);
  return !["Sat", "Sun"].includes(weekday);
}

function upcomingDays(count: number, predicate: (date: Date) => boolean) {
  const days: Date[] = [];
  let cursor = addDays(new Date(), 1);
  while (days.length < count) {
    if (predicate(cursor)) days.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }
  return days;
}

const CATALOG: CatalogVenue[] = [
  {
    ownerEmail: "club@salonsstokstraat.test",
    id: "venue_salon_stokstraat",
    name: "Salon Stokstraat",
    slug: "salon-stokstraat",
    description:
      "Walk-in chairs in the Stokstraat that sit empty between regulars. Off-peak cuts go on Fillslot at about half the usual rate.",
    address: "Stokstraat 12",
    postalCode: "6211 GD",
    category: "hair",
    resources: [
      { id: "court_salon_1", name: "Chair 1 · window" },
      { id: "court_salon_2", name: "Chair 2 · mirror wall" },
    ],
    makeSlots: (ids) => {
      const days = upcomingDays(4, isAmsterdamWeekday);
      const chairs = [...ids.values()];
      return days.flatMap((day) =>
        chairs.flatMap((courtId) => [
          {
            courtId,
            startsAt: amsterdamAt(day, 14),
            endsAt: amsterdamAt(day, 15),
            originalPriceCents: 4500,
            dealPriceCents: 2200,
            capacity: 1,
          },
          {
            courtId,
            startsAt: amsterdamAt(day, 15),
            endsAt: amsterdamAt(day, 16),
            originalPriceCents: 4500,
            dealPriceCents: 2200,
            capacity: 1,
          },
        ]),
      );
    },
  },
  {
    ownerEmail: "club@badhuyswyck.test",
    id: "venue_badhuys_wyck",
    name: "Badhuys Wyck",
    slug: "badhuys-wyck",
    description:
      "Treatment rooms on Rechtstraat. Late-afternoon massages that did not book go on Fillslot instead of sitting idle.",
    address: "Rechtstraat 40",
    postalCode: "6221 EJ",
    category: "spa",
    resources: [
      { id: "court_spa_1", name: "Room 1 · heat" },
      { id: "court_spa_2", name: "Room 2 · quiet" },
    ],
    makeSlots: (ids) => {
      const days = upcomingDays(3, isAmsterdamWeekday);
      const rooms = [...ids.values()];
      return days.flatMap((day) =>
        rooms.map((courtId) => ({
          courtId,
          startsAt: amsterdamAt(day, 16),
          endsAt: amsterdamAt(day, 17),
          originalPriceCents: 8000,
          dealPriceCents: 4000,
          capacity: 1,
        })),
      );
    },
  },
  {
    ownerEmail: "club@strikeboschstraat.test",
    id: "venue_strike_boschstraat",
    name: "Strike Boschstraat",
    slug: "strike-boschstraat",
    description:
      "Bowling lanes near the Bassin. Midweek hours that never fill land here at a cut lane rate.",
    address: "Boschstraat 80",
    postalCode: "6211 AX",
    category: "bowling",
    resources: [
      { id: "court_bowl_3", name: "Lane 3" },
      { id: "court_bowl_4", name: "Lane 4" },
    ],
    makeSlots: (ids) => {
      const days = upcomingDays(4, isAmsterdamWeekday);
      const lanes = [...ids.values()];
      return days.flatMap((day) =>
        lanes.map((courtId) => ({
          courtId,
          startsAt: amsterdamAt(day, 15),
          endsAt: amsterdamAt(day, 16),
          originalPriceCents: 3200,
          dealPriceCents: 1600,
          capacity: 1,
        })),
      );
    },
  },
  {
    ownerEmail: "club@lumiereleftover.test",
    id: "venue_lumiere_leftover",
    name: "Lumière leftover",
    slug: "lumiere-leftover",
    description:
      "Leftover seats for selected screenings at the Bassin. Not a live cinema partnership — demo surplus tickets for the Maastricht pilot.",
    address: "Bassin 88",
    postalCode: "6211 AK",
    category: "cinema",
    resources: [{ id: "court_cinema_1", name: "Screen 1 · leftover seats" }],
    makeSlots: (ids) => {
      const courtId = ids.get("Screen 1 · leftover seats")!;
      const days = upcomingDays(3, () => true);
      return days.map((day) => ({
        courtId,
        startsAt: amsterdamAt(day, 19),
        endsAt: amsterdamAt(day, 21),
        originalPriceCents: 1400,
        dealPriceCents: 700,
        capacity: 24,
      }));
    },
  },
  {
    ownerEmail: "club@geusselt.test",
    id: "venue_geusselt_last_call",
    name: "Geusselt last call",
    slug: "geusselt-last-call",
    description:
      "Leftover match tickets dumped before kick-off. Demo surplus only — not an MVV box office.",
    address: "Olympiaweg 81",
    postalCode: "6225 XS",
    category: "stadium",
    resources: [{ id: "court_stadium_1", name: "Stand A · last call" }],
    makeSlots: (ids) => {
      const courtId = ids.get("Stand A · last call")!;
      const days = upcomingDays(2, (date) => !isAmsterdamWeekday(date));
      return days.map((day) => ({
        courtId,
        startsAt: amsterdamAt(day, 14, 30),
        endsAt: amsterdamAt(day, 16, 30),
        originalPriceCents: 2800,
        dealPriceCents: 1400,
        capacity: 8,
      }));
    },
  },
];

async function ensureUsers(db: SeedDb) {
  for (const account of DEV_ACCOUNTS) {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, account.email),
    });
    if (existing) {
      await db
        .update(users)
        .set({ name: account.name, role: account.role })
        .where(eq(users.id, existing.id));
    } else {
      await db.insert(users).values({
        id: account.id,
        email: account.email,
        name: account.name,
        role: account.role,
        emailVerified: new Date(),
      });
    }
  }
}

async function ensureSlots(db: SeedDb, created: SeedSlot[]) {
  let inserted = 0;
  for (const slot of created) {
    if (slot.startsAt <= new Date()) continue;
    const existing = await db.query.slots.findFirst({
      where: (table, helpers) =>
        helpers.and(
          helpers.eq(table.courtId, slot.courtId),
          helpers.eq(table.startsAt, slot.startsAt),
        ),
    });
    if (existing) continue;
    await db.insert(slots).values({
      courtId: slot.courtId,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      originalPriceCents: slot.originalPriceCents,
      dealPriceCents: slot.dealPriceCents,
      capacity: slot.capacity,
      status: "open",
    });
    inserted += 1;
  }
  return inserted;
}

async function ensureCatalogVenue(db: SeedDb, catalog: CatalogVenue) {
  const owner = await db.query.users.findFirst({
    where: eq(users.email, catalog.ownerEmail),
  });
  if (!owner) {
    throw new Error(`Partner user missing after seed: ${catalog.ownerEmail}`);
  }

  let venue = await db.query.venues.findFirst({
    where: eq(venues.slug, catalog.slug),
  });

  if (!venue) {
    const [created] = await db
      .insert(venues)
      .values({
        id: catalog.id,
        ownerId: owner.id,
        name: catalog.name,
        slug: catalog.slug,
        description: catalog.description,
        address: catalog.address,
        city: "Maastricht",
        postalCode: catalog.postalCode,
        country: "NL",
        category: catalog.category,
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
        category: catalog.category,
        name: catalog.name,
        description: catalog.description,
      })
      .where(eq(venues.id, venue.id));
  }

  const existingCourts = await db.query.courts.findMany({
    where: eq(courts.venueId, venue.id),
  });

  if (existingCourts.length === 0) {
    await db.insert(courts).values(
      catalog.resources.map((resource, index) => ({
        id: resource.id,
        venueId: venue.id,
        name: resource.name,
        sortOrder: index + 1,
      })),
    );
  }

  const allCourts = await db.query.courts.findMany({
    where: eq(courts.venueId, venue.id),
  });
  const ids = new Map(allCourts.map((court) => [court.name, court.id]));
  const createdSlots = catalog.makeSlots(ids);
  const inserted = await ensureSlots(db, createdSlots);
  return { venueId: venue.id, slots: inserted };
}

async function seedPlaza(db: SeedDb) {
  const club = await db.query.users.findFirst({
    where: eq(users.email, "club@plazapadel.test"),
  });
  if (!club) {
    throw new Error("Club user missing after seed");
  }

  let venue = await db.query.venues.findFirst({
    where: eq(venues.slug, "plaza-padel-maastricht"),
  });

  if (!venue) {
    const [created] = await db
      .insert(venues)
      .values({
        id: "venue_plaza_maastricht",
        ownerId: club.id,
        name: "Plaza Padel Maastricht",
        slug: "plaza-padel-maastricht",
        description:
          "Nine indoor courts on Heerderweg. Off-peak hours that would sit empty go on Fillslot at about half the usual court rate.",
        address: "Heerderweg 146-148",
        city: "Maastricht",
        postalCode: "6224 LJ",
        country: "NL",
        category: "padel",
        commissionBps: 1500,
        status: "approved",
      })
      .returning();
    venue = created;
  } else {
    await db
      .update(venues)
      .set({ ownerId: club.id, status: "approved", category: "padel" })
      .where(eq(venues.id, venue.id));
  }

  const existingCourts = await db.query.courts.findMany({
    where: eq(courts.venueId, venue.id),
  });

  if (existingCourts.length === 0) {
    await db.insert(courts).values(
      PLAZA_COURTS.map((name, index) => ({
        id: `court_plaza_${index + 1}`,
        venueId: venue.id,
        name,
        sortOrder: index + 1,
      })),
    );
  }

  const allCourts = await db.query.courts.findMany({
    where: eq(courts.venueId, venue.id),
  });

  const surplusCourts = allCourts.filter((court) =>
    [
      "Padel 3 · Previder",
      "Padel 6 · Benelux Vloerverwarming",
      "Padel 8",
    ].includes(court.name),
  );

  const hours = [14, 15];
  let cursor = new Date();
  const createdSlots: SeedSlot[] = [];

  while (createdSlots.length < 18) {
    if (isAmsterdamWeekday(cursor)) {
      for (const court of surplusCourts) {
        for (const hour of hours) {
          const startsAt = amsterdamAt(cursor, hour);
          const endsAt = amsterdamAt(cursor, hour + 1);
          if (startsAt <= new Date()) continue;
          createdSlots.push({
            courtId: court.id,
            startsAt,
            endsAt,
            originalPriceCents: 3600,
            dealPriceCents: 1800,
            capacity: 1,
          });
        }
      }
    }
    cursor = addDays(cursor, 1);
    if (createdSlots.length > 40) break;
  }

  const inserted = await ensureSlots(db, createdSlots.slice(0, 18));
  return { venueId: venue.id, slots: inserted };
}

export async function seed(db: SeedDb) {
  await ensureUsers(db);
  const plaza = await seedPlaza(db);
  const extras = [];
  for (const catalog of CATALOG) {
    extras.push(await ensureCatalogVenue(db, catalog));
  }
  return {
    venueId: plaza.venueId,
    slots: plaza.slots + extras.reduce((sum, item) => sum + item.slots, 0),
    venues: 1 + extras.length,
  };
}
