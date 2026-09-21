import { eq } from "drizzle-orm";
import { addDays } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { courts, slots, users, venues } from "./schema";
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

export async function seed(db: SeedDb) {
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
        commissionBps: 1500,
        status: "approved",
      })
      .returning();
    venue = created;
  } else {
    await db
      .update(venues)
      .set({ ownerId: club.id, status: "approved" })
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
  const createdSlots: { courtId: string; startsAt: Date; endsAt: Date }[] = [];

  while (createdSlots.length < 18) {
    if (isAmsterdamWeekday(cursor)) {
      for (const court of surplusCourts) {
        for (const hour of hours) {
          const startsAt = amsterdamAt(cursor, hour);
          const endsAt = amsterdamAt(cursor, hour + 1);
          if (startsAt <= new Date()) continue;
          createdSlots.push({ courtId: court.id, startsAt, endsAt });
        }
      }
    }
    cursor = addDays(cursor, 1);
    if (createdSlots.length > 40) break;
  }

  for (const slot of createdSlots.slice(0, 18)) {
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
      originalPriceCents: 3600,
      dealPriceCents: 1800,
      status: "open",
    });
  }

  return { venueId: venue.id, slots: Math.min(createdSlots.length, 18) };
}
