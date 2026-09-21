import { customAlphabet } from "nanoid";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { courts, users, venues, type ActivityCategory, type FillMode } from "@/db/schema";
import {
  CATEGORY_FILL_DEFAULTS,
  DEFAULT_CITY,
  DEFAULT_COMMISSION_BPS,
  parseCategory,
  WEEKDAYS,
} from "@/lib/constants";
import { parseFillMode, resolveFillSizes } from "@/lib/fill-rules";
import { replaceVenueWindows } from "@/lib/schedule";
import { formatClock, parseClock } from "@/lib/time";

const slugTail = customAlphabet("abcdefghijklmnopqrstuvwxyz23456789", 6);

export type MerchantWindowInput = {
  weekday: number;
  startMinute: number;
  endMinute: number;
  sessionMinutes: number;
  originalPriceCents: number;
  dealPriceCents: number;
  fillMode: FillMode;
  minPartySize: number;
  capacity: number;
};

export type MerchantOnboardingInput = {
  name: string;
  summary: string;
  category: ActivityCategory;
  address: string;
  postalCode: string;
  city: string;
  windows: MerchantWindowInput[];
};

const WEEKDAY_IDS = new Set(WEEKDAYS.map((day) => day.id));

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${base || "venue"}-${slugTail()}`;
}

export function venueSlugFromName(name: string) {
  return slugify(name);
}

export function defaultResourceName(category: ActivityCategory, venueName: string) {
  if (category === "padel") return `${venueName} · leftover court`;
  if (category === "cinema") return `${venueName} · leftover seats`;
  if (category === "stadium") return `${venueName} · leftover tickets`;
  if (category === "escape_room") return `${venueName} · leftover room`;
  if (category === "go_karting") return `${venueName} · leftover session`;
  if (category === "bowling") return `${venueName} · leftover lane`;
  if (category === "hair") return `${venueName} · leftover chair`;
  return `${venueName} · leftover room`;
}

function eurosToCents(value: string) {
  const amount = Number(value.replace(",", "."));
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount * 100);
}

export function parseMerchantOnboarding(formData: FormData):
  | { ok: true; data: MerchantOnboardingInput }
  | { ok: false; error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim().toUpperCase();
  const city = String(formData.get("city") ?? DEFAULT_CITY).trim() || DEFAULT_CITY;
  const category = parseCategory(formData.get("category"));

  if (name.length < 2) return { ok: false, error: "Give the venue a name." };
  if (summary.length < 20) {
    return { ok: false, error: "Write a short summary of what you do (at least a couple of sentences)." };
  }
  if (summary.length > 600) return { ok: false, error: "Keep the summary under 600 characters." };
  if (!category) return { ok: false, error: "Pick one category." };
  if (address.length < 4) return { ok: false, error: "Add the street address." };
  if (!/^[1-9][0-9]{3}\s?[A-Z]{2}$/i.test(postalCode)) {
    return { ok: false, error: "Use a Dutch postcode, like 6224 LJ." };
  }

  const count = Math.floor(Number(formData.get("windowCount") ?? 0));
  if (!Number.isInteger(count) || count < 1 || count > 14) {
    return { ok: false, error: "Add at least one leftover window for the week." };
  }

  const windows: MerchantWindowInput[] = [];
  for (let index = 0; index < count; index += 1) {
    const weekday = Number(formData.get(`windows.${index}.weekday`));
    const startMinute = parseClock(String(formData.get(`windows.${index}.start`) ?? ""));
    const endMinute = parseClock(String(formData.get(`windows.${index}.end`) ?? ""));
    const sessionMinutes = Math.floor(Number(formData.get(`windows.${index}.sessionMinutes`)));
    const originalPriceCents = eurosToCents(String(formData.get(`windows.${index}.originalPrice`) ?? ""));
    const dealPriceCents = eurosToCents(String(formData.get(`windows.${index}.dealPrice`) ?? ""));
    const fillMode = parseFillMode(formData.get(`windows.${index}.fillMode`));
    const minPartySize = Math.floor(Number(formData.get(`windows.${index}.minPartySize`) ?? 1));
    const capacity = Math.floor(Number(formData.get(`windows.${index}.capacity`) ?? 1));

    if (!WEEKDAY_IDS.has(weekday as (typeof WEEKDAYS)[number]["id"])) {
      return { ok: false, error: "Pick a weekday for every leftover window." };
    }
    if (startMinute == null || endMinute == null) {
      return { ok: false, error: "Use times like 14:00 to 18:00." };
    }
    if (endMinute <= startMinute) {
      return { ok: false, error: "Each window has to end after it starts." };
    }
    if (!Number.isInteger(sessionMinutes) || sessionMinutes < 15 || sessionMinutes > 240) {
      return { ok: false, error: "Session length has to be between 15 and 240 minutes." };
    }
    if (endMinute - startMinute < sessionMinutes) {
      return { ok: false, error: "The leftover window has to be long enough for one session." };
    }
    if (
      originalPriceCents == null ||
      dealPriceCents == null ||
      dealPriceCents <= 0 ||
      originalPriceCents < dealPriceCents
    ) {
      return { ok: false, error: "Deal price has to be lower than the usual price." };
    }
    if (!fillMode) return { ok: false, error: "Pick how this leftover fills: at least, exactly, or up to." };

    const sizes = resolveFillSizes({ fillMode, minPartySize, capacity });
    if (!sizes.ok) return sizes;

    windows.push({
      weekday,
      startMinute,
      endMinute,
      sessionMinutes,
      originalPriceCents,
      dealPriceCents,
      fillMode,
      minPartySize: sizes.minPartySize,
      capacity: sizes.capacity,
    });
  }

  return {
    ok: true,
    data: {
      name,
      summary,
      category,
      address,
      postalCode: postalCode.replace(/\s+/, " ").toUpperCase(),
      city,
      windows,
    },
  };
}

export function defaultWindowFor(category: ActivityCategory): MerchantWindowInput {
  const defaults = CATEGORY_FILL_DEFAULTS[category];
  return {
    weekday: 2,
    startMinute: parseClock(defaults.start) ?? 14 * 60,
    endMinute: parseClock(defaults.end) ?? 18 * 60,
    sessionMinutes: defaults.sessionMinutes,
    originalPriceCents: Math.round(Number(defaults.originalPrice) * 100),
    dealPriceCents: Math.round(Number(defaults.dealPrice) * 100),
    fillMode: defaults.fillMode,
    minPartySize: defaults.minPartySize,
    capacity: defaults.capacity,
  };
}

export function windowsToDraft(windows: MerchantWindowInput[]) {
  return windows.map((window) => ({
    weekday: window.weekday,
    start: formatClock(window.startMinute),
    end: formatClock(window.endMinute),
    sessionMinutes: window.sessionMinutes,
    originalPrice: (window.originalPriceCents / 100).toString(),
    dealPrice: (window.dealPriceCents / 100).toString(),
    fillMode: window.fillMode,
    minPartySize: window.minPartySize,
    capacity: window.capacity,
  }));
}

export async function saveMerchantOnboarding(userId: string, input: MerchantOnboardingInput) {
  const db = await getDb();
  const existing = await db.query.venues.findFirst({
    where: eq(venues.ownerId, userId),
  });

  let venue = existing;
  if (!venue) {
    const [created] = await db
      .insert(venues)
      .values({
        ownerId: userId,
        name: input.name,
        slug: venueSlugFromName(input.name),
        description: input.summary,
        address: input.address,
        city: input.city || DEFAULT_CITY,
        postalCode: input.postalCode,
        country: "NL",
        category: input.category,
        commissionBps: DEFAULT_COMMISSION_BPS,
        status: "pending",
      })
      .returning();
    venue = created;
  } else {
    const [updated] = await db
      .update(venues)
      .set({
        name: input.name,
        description: input.summary,
        address: input.address,
        city: input.city || DEFAULT_CITY,
        postalCode: input.postalCode,
        category: input.category,
      })
      .where(eq(venues.id, venue.id))
      .returning();
    venue = updated ?? venue;
  }

  const existingCourt = await db.query.courts.findFirst({
    where: eq(courts.venueId, venue.id),
  });
  if (!existingCourt) {
    await db.insert(courts).values({
      venueId: venue.id,
      name: defaultResourceName(input.category, input.name),
      sortOrder: 1,
    });
  }

  await db.update(users).set({ role: "club", name: input.name }).where(eq(users.id, userId));

  const materialized = await replaceVenueWindows(
    venue.id,
    input.windows.map((window) => ({
      weekday: window.weekday,
      startMinute: window.startMinute,
      endMinute: window.endMinute,
      sessionMinutes: window.sessionMinutes,
      originalPriceCents: window.originalPriceCents,
      dealPriceCents: window.dealPriceCents,
      fillMode: window.fillMode,
      minPartySize: window.minPartySize,
      capacity: window.capacity,
    })),
  );

  return { venue, inserted: materialized.inserted };
}
