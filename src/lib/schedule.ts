import { addDays } from "date-fns";
import { and, asc, eq, gt, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { bookings, courts, slots, weeklyWindows, type WeeklyWindow } from "@/db/schema";
import { SCHEDULE_WEEKS_AHEAD } from "@/lib/constants";
import { amsterdamAtMinutes, amsterdamWeekday } from "@/lib/time";

export function sessionStarts(window: Pick<WeeklyWindow, "startMinute" | "endMinute" | "sessionMinutes">) {
  const starts: number[] = [];
  for (
    let start = window.startMinute;
    start + window.sessionMinutes <= window.endMinute;
    start += window.sessionMinutes
  ) {
    starts.push(start);
  }
  return starts;
}

function upcomingDays(count: number) {
  const days: Date[] = [];
  let cursor = addDays(new Date(), 1);
  while (days.length < count) {
    days.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }
  return days;
}

export async function materializeVenueSchedule(venueId: string, weeksAhead = SCHEDULE_WEEKS_AHEAD) {
  const db = await getDb();
  const [court] = await db
    .select()
    .from(courts)
    .where(eq(courts.venueId, venueId))
    .orderBy(asc(courts.sortOrder))
    .limit(1);
  if (!court) return { inserted: 0 };

  const windows = await db
    .select()
    .from(weeklyWindows)
    .where(eq(weeklyWindows.venueId, venueId));
  if (windows.length === 0) return { inserted: 0 };

  const days = upcomingDays(weeksAhead * 7);
  let inserted = 0;

  for (const window of windows) {
    const starts = sessionStarts(window);
    for (const day of days) {
      if (amsterdamWeekday(day) !== window.weekday) continue;
      for (const startMinute of starts) {
        const startsAt = amsterdamAtMinutes(day, startMinute);
        const endsAt = amsterdamAtMinutes(day, startMinute + window.sessionMinutes);
        if (startsAt <= new Date()) continue;
        try {
          await db.insert(slots).values({
            courtId: court.id,
            weeklyWindowId: window.id,
            startsAt,
            endsAt,
            originalPriceCents: window.originalPriceCents,
            dealPriceCents: window.dealPriceCents,
            capacity: window.capacity,
            minPartySize: window.minPartySize,
            fillMode: window.fillMode,
            fillState: "collecting",
            status: "open",
          });
          inserted += 1;
        } catch {
          // Unique court + start: this leftover is already listed.
        }
      }
    }
  }

  return { inserted };
}

export async function replaceVenueWindows(
  venueId: string,
  windows: Omit<WeeklyWindow, "id" | "venueId" | "createdAt">[],
) {
  const db = await getDb();
  const existing = await db
    .select({ id: weeklyWindows.id })
    .from(weeklyWindows)
    .where(eq(weeklyWindows.venueId, venueId));
  const windowIds = existing.map((row) => row.id);

  if (windowIds.length > 0) {
    const futureSlots = await db
      .select({ id: slots.id })
      .from(slots)
      .where(
        and(inArray(slots.weeklyWindowId, windowIds), gt(slots.startsAt, new Date())),
      );

    const futureIds = futureSlots.map((row) => row.id);
    if (futureIds.length > 0) {
      const paid = await db
        .select({ slotId: bookings.slotId })
        .from(bookings)
        .where(and(inArray(bookings.slotId, futureIds), eq(bookings.status, "paid")));
      const paidSlotIds = new Set(paid.map((row) => row.slotId));
      const unused = futureIds.filter((id) => !paidSlotIds.has(id));
      if (unused.length > 0) {
        await db
          .update(slots)
          .set({ status: "cancelled", fillState: "refunded", fillResolvedAt: new Date() })
          .where(inArray(slots.id, unused));
      }
    }

    await db.delete(weeklyWindows).where(eq(weeklyWindows.venueId, venueId));
  }

  if (windows.length > 0) {
    await db.insert(weeklyWindows).values(
      windows.map((window) => ({
        ...window,
        venueId,
      })),
    );
  }

  return materializeVenueSchedule(venueId);
}

export async function materializeAllSchedules() {
  const db = await getDb();
  const windows = await db.select({ venueId: weeklyWindows.venueId }).from(weeklyWindows);
  const venueIds = [...new Set(windows.map((row) => row.venueId))];
  let inserted = 0;
  for (const venueId of venueIds) {
    inserted += (await materializeVenueSchedule(venueId)).inserted;
  }
  return { inserted, venues: venueIds.length };
}
