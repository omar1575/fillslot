import type { ActivityCategory } from "@/db/schema";

export const APP_NAME = "Fillslot";
export const DEFAULT_CITY = "Maastricht";
export const TIMEZONE = "Europe/Amsterdam";
export const DEFAULT_COMMISSION_BPS = 1500;
export const CHECKOUT_HOLD_MINUTES = 30;

export const ACTIVITY_CATEGORIES = [
  "padel",
  "hair",
  "spa",
  "bowling",
  "cinema",
  "stadium",
  "go_karting",
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
};

export const RESOURCE_LABELS: Record<ActivityCategory, string> = {
  padel: "court",
  hair: "chair",
  spa: "room",
  bowling: "lane",
  cinema: "seat",
  stadium: "ticket",
  go_karting: "kart",
};

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
