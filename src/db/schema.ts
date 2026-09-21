import { relations } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

export const userRoleEnum = pgEnum("user_role", ["consumer", "club", "admin"]);
export const venueStatusEnum = pgEnum("venue_status", ["pending", "approved"]);
export const activityCategoryEnum = pgEnum("activity_category", [
  "padel",
  "hair",
  "spa",
  "bowling",
  "cinema",
  "stadium",
]);
export const slotStatusEnum = pgEnum("slot_status", [
  "open",
  "held",
  "booked",
  "cancelled",
]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "paid",
  "cancelled",
  "refunded",
  "completed",
]);

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("consumer"),
  stripeCustomerId: text("stripe_customer_id"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ],
);

export const venues = pgTable("venue", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull().default("NL"),
  photoUrl: text("photo_url"),
  category: activityCategoryEnum("category").notNull().default("padel"),
  commissionBps: integer("commission_bps").notNull().default(1500),
  stripeAccountId: text("stripe_account_id"),
  stripeDetailsSubmitted: integer("stripe_details_submitted")
    .notNull()
    .default(0),
  status: venueStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const courts = pgTable("court", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  venueId: text("venue_id")
    .notNull()
    .references(() => venues.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const slots = pgTable(
  "slot",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    courtId: text("court_id")
      .notNull()
      .references(() => courts.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { mode: "date" }).notNull(),
    endsAt: timestamp("ends_at", { mode: "date" }).notNull(),
    originalPriceCents: integer("original_price_cents").notNull(),
    dealPriceCents: integer("deal_price_cents").notNull(),
    capacity: integer("capacity").notNull().default(1),
    status: slotStatusEnum("status").notNull().default("open"),
    holdExpiresAt: timestamp("hold_expires_at", { mode: "date" }),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (slot) => [
    uniqueIndex("slot_court_start_idx").on(slot.courtId, slot.startsAt),
  ],
);

export const bookings = pgTable(
  "booking",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slotId: text("slot_id")
      .notNull()
      .references(() => slots.id, { onDelete: "restrict" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    code: text("code").notNull().unique(),
    quantity: integer("quantity").notNull().default(1),
    grossCents: integer("gross_cents").notNull(),
    commissionCents: integer("commission_cents").notNull(),
    netCents: integer("net_cents").notNull(),
    payoutPending: integer("payout_pending").notNull().default(1),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    status: bookingStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (booking) => [
    uniqueIndex("booking_checkout_session_idx").on(booking.stripeCheckoutSessionId),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  venues: many(venues),
  bookings: many(bookings),
}));

export const venuesRelations = relations(venues, ({ one, many }) => ({
  owner: one(users, { fields: [venues.ownerId], references: [users.id] }),
  courts: many(courts),
}));

export const courtsRelations = relations(courts, ({ one, many }) => ({
  venue: one(venues, { fields: [courts.venueId], references: [venues.id] }),
  slots: many(slots),
}));

export const slotsRelations = relations(slots, ({ one, many }) => ({
  court: one(courts, { fields: [slots.courtId], references: [courts.id] }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  slot: one(slots, { fields: [bookings.slotId], references: [slots.id] }),
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type Venue = typeof venues.$inferSelect;
export type Court = typeof courts.$inferSelect;
export type Slot = typeof slots.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type ActivityCategory = (typeof activityCategoryEnum.enumValues)[number];
