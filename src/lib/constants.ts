export const APP_NAME = "Fillslot";
export const DEFAULT_CITY = "Maastricht";
export const TIMEZONE = "Europe/Amsterdam";
export const DEFAULT_COMMISSION_BPS = 1500;
export const CHECKOUT_HOLD_MINUTES = 30;

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
    email: "admin@fillslot.test",
    name: "Fillslot Admin",
    role: "admin" as const,
    id: "user_admin_fillslot",
  },
];
