import type { ActivityCategory, FillMode, Slot } from "@/db/schema";

export const APP_NAME = "Fillslot";
export const DEFAULT_CITY = "Maastricht";
export const TIMEZONE = "Europe/Amsterdam";
export const DEFAULT_COMMISSION_BPS = 1500;
export const CHECKOUT_HOLD_MINUTES = 30;
export const FILL_INVITE_MINUTES = 60;
export const FILL_REFUND_MINUTES = 15;
export const SCHEDULE_WEEKS_AHEAD = 2;

export const ACTIVITY_CATEGORIES = [
  "padel",
  "hair",
  "spa",
  "bowling",
  "cinema",
  "stadium",
  "go_karting",
  "escape_room",
] as const satisfies readonly ActivityCategory[];

export const TICKET_CATEGORIES = ["cinema", "stadium"] as const satisfies readonly ActivityCategory[];

export const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  padel: "Padel",
  hair: "Hair",
  spa: "Spa",
  bowling: "Bowling",
  cinema: "Cinema",
  stadium: "Stadium",
  go_karting: "Go-karting",
  escape_room: "Escape room",
};

export const RESOURCE_LABELS: Record<ActivityCategory, string> = {
  padel: "court",
  hair: "chair",
  spa: "room",
  bowling: "lane",
  cinema: "seat",
  stadium: "ticket",
  go_karting: "kart",
  escape_room: "room",
};

export const WEEKDAYS = [
  { id: 1, label: "Monday", short: "Mon" },
  { id: 2, label: "Tuesday", short: "Tue" },
  { id: 3, label: "Wednesday", short: "Wed" },
  { id: 4, label: "Thursday", short: "Thu" },
  { id: 5, label: "Friday", short: "Fri" },
  { id: 6, label: "Saturday", short: "Sat" },
  { id: 7, label: "Sunday", short: "Sun" },
] as const;

export type CategoryFillDefault = {
  fillMode: FillMode;
  minPartySize: number;
  capacity: number;
  sessionMinutes: number;
  originalPrice: string;
  dealPrice: string;
  start: string;
  end: string;
};

export const CATEGORY_FILL_DEFAULTS: Record<ActivityCategory, CategoryFillDefault> = {
  padel: {
    fillMode: "exact",
    minPartySize: 4,
    capacity: 4,
    sessionMinutes: 90,
    originalPrice: "36",
    dealPrice: "18",
    start: "14:00",
    end: "17:00",
  },
  escape_room: {
    fillMode: "exact",
    minPartySize: 4,
    capacity: 4,
    sessionMinutes: 60,
    originalPrice: "40",
    dealPrice: "22",
    start: "16:00",
    end: "20:00",
  },
  go_karting: {
    fillMode: "threshold",
    minPartySize: 6,
    capacity: 12,
    sessionMinutes: 30,
    originalPrice: "49",
    dealPrice: "25",
    start: "17:00",
    end: "20:00",
  },
  bowling: {
    fillMode: "threshold",
    minPartySize: 2,
    capacity: 6,
    sessionMinutes: 60,
    originalPrice: "32",
    dealPrice: "16",
    start: "15:00",
    end: "18:00",
  },
  cinema: {
    fillMode: "cap",
    minPartySize: 1,
    capacity: 24,
    sessionMinutes: 120,
    originalPrice: "14",
    dealPrice: "7",
    start: "19:00",
    end: "23:00",
  },
  stadium: {
    fillMode: "cap",
    minPartySize: 1,
    capacity: 8,
    sessionMinutes: 120,
    originalPrice: "28",
    dealPrice: "14",
    start: "14:30",
    end: "16:30",
  },
  hair: {
    fillMode: "cap",
    minPartySize: 1,
    capacity: 1,
    sessionMinutes: 45,
    originalPrice: "45",
    dealPrice: "22",
    start: "14:00",
    end: "16:30",
  },
  spa: {
    fillMode: "cap",
    minPartySize: 1,
    capacity: 1,
    sessionMinutes: 60,
    originalPrice: "80",
    dealPrice: "40",
    start: "16:00",
    end: "18:00",
  },
};

const CATEGORY_INTERESTS: Record<ActivityCategory, string[]> = {
  padel: ["padel"],
  bowling: ["bowling"],
  go_karting: ["go-karting"],
  cinema: ["movies"],
  escape_room: ["escape-room"],
  stadium: ["music"],
  hair: [],
  spa: [],
};

export function interestsForCategory(category: ActivityCategory) {
  return CATEGORY_INTERESTS[category];
}

export function usesSharedInventory(
  slot: Pick<Slot, "capacity" | "fillMode">,
  category: ActivityCategory,
) {
  if (isTicketCategory(category)) return true;
  if (slot.fillMode === "threshold" || slot.fillMode === "exact") return true;
  return slot.capacity > 1;
}

export function usesFillThreshold(slot: Pick<Slot, "fillMode">) {
  return slot.fillMode === "threshold" || slot.fillMode === "exact";
}

export function isTicketCategory(category: ActivityCategory) {
  return (TICKET_CATEGORIES as readonly ActivityCategory[]).includes(category);
}

export function resourceLabel(category: ActivityCategory, count = 1) {
  const label = RESOURCE_LABELS[category];
  if (count === 1) return label;
  if (label === "seat") return "seats";
  return `${label}s`;
}

export function leftoverDescription(category: ActivityCategory) {
  if (isTicketCategory(category)) {
    return `Non-refundable leftover ${resourceLabel(category, 2)}`;
  }
  return `Non-refundable leftover ${RESOURCE_LABELS[category]} time`;
}

export function parseCategory(value: unknown): ActivityCategory | undefined {
  if (typeof value !== "string") return undefined;
  if ((ACTIVITY_CATEGORIES as readonly string[]).includes(value)) {
    return value as ActivityCategory;
  }
  return undefined;
}

export const DEV_ACCOUNTS = [
  {
    email: "player@fillslot.test",
    name: "Maya van Dijk",
    role: "consumer" as const,
    id: "user_player_fillslot",
  },
  {
    email: "lars@fillslot.test",
    name: "Lars de Groot",
    role: "consumer" as const,
    id: "user_player_lars",
  },
  {
    email: "noor@fillslot.test",
    name: "Noor Hendriks",
    role: "consumer" as const,
    id: "user_player_noor",
  },
  {
    email: "sem@fillslot.test",
    name: "Sem Peeters",
    role: "consumer" as const,
    id: "user_player_sem",
  },
  {
    email: "ines@fillslot.test",
    name: "Ines Bakker",
    role: "consumer" as const,
    id: "user_player_ines",
  },
  {
    email: "jules@fillslot.test",
    name: "Jules Vermeulen",
    role: "consumer" as const,
    id: "user_player_jules",
  },
  {
    email: "club@plazapadel.test",
    name: "Plaza Padel Maastricht",
    role: "club" as const,
    id: "user_club_plaza",
  },
  {
    email: "club@salonsstokstraat.test",
    name: "Salon Stokstraat",
    role: "club" as const,
    id: "user_club_salon",
  },
  {
    email: "club@badhuyswyck.test",
    name: "Badhuys Wyck",
    role: "club" as const,
    id: "user_club_spa",
  },
  {
    email: "club@strikeboschstraat.test",
    name: "Strike Boschstraat",
    role: "club" as const,
    id: "user_club_bowling",
  },
  {
    email: "club@kartingbeatrixhaven.test",
    name: "Karting Beatrixhaven",
    role: "club" as const,
    id: "user_club_karting",
  },
  {
    email: "club@lumiereleftover.test",
    name: "Lumière leftover",
    role: "club" as const,
    id: "user_club_cinema",
  },
  {
    email: "club@geusselt.test",
    name: "Geusselt last call",
    role: "club" as const,
    id: "user_club_stadium",
  },
  {
    email: "admin@fillslot.test",
    name: "Fillslot Admin",
    role: "admin" as const,
    id: "user_admin_fillslot",
  },
];
