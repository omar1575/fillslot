import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["consumer", "club", "admin"]);
export const venueStatusEnum = pgEnum("venue_status", ["pending", "approved"]);
export const activityCategoryEnum = pgEnum("activity_category", [
  "padel",
  "hair",
  "spa",
  "bowling",
  "cinema",
  "stadium",
  "go_karting",
  "escape_room",
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
export const fillModeEnum = pgEnum("fill_mode", ["threshold", "exact", "cap"]);
export const fillStateEnum = pgEnum("fill_state", [
  "collecting",
  "confirmed",
  "inviting",
  "refunded",
]);
export const noticeTypeEnum = pgEnum("notice_type", [
  "fill_invite",
  "switch_offer",
  "confirmed",
  "refunded",
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

export const weeklyWindows = pgTable("weekly_window", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  venueId: text("venue_id")
    .notNull()
    .references(() => venues.id, { onDelete: "cascade" }),
  weekday: integer("weekday").notNull(),
  startMinute: integer("start_minute").notNull(),
  endMinute: integer("end_minute").notNull(),
  sessionMinutes: integer("session_minutes").notNull(),
  originalPriceCents: integer("original_price_cents").notNull(),
  dealPriceCents: integer("deal_price_cents").notNull(),
  fillMode: fillModeEnum("fill_mode").notNull().default("threshold"),
  minPartySize: integer("min_party_size").notNull().default(1),
  capacity: integer("capacity").notNull().default(1),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
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
    weeklyWindowId: text("weekly_window_id").references(() => weeklyWindows.id, {
      onDelete: "set null",
    }),
    startsAt: timestamp("starts_at", { mode: "date" }).notNull(),
    endsAt: timestamp("ends_at", { mode: "date" }).notNull(),
    originalPriceCents: integer("original_price_cents").notNull(),
    dealPriceCents: integer("deal_price_cents").notNull(),
    capacity: integer("capacity").notNull().default(1),
    minPartySize: integer("min_party_size").notNull().default(1),
    fillMode: fillModeEnum("fill_mode").notNull().default("cap"),
    fillState: fillStateEnum("fill_state").notNull().default("collecting"),
    fillInviteSentAt: timestamp("fill_invite_sent_at", { mode: "date" }),
    fillResolvedAt: timestamp("fill_resolved_at", { mode: "date" }),
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

export const notices = pgTable("notice", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: noticeTypeEnum("type").notNull(),
  slotId: text("slot_id").references(() => slots.id, { onDelete: "cascade" }),
  relatedSlotId: text("related_slot_id").references(() => slots.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  readAt: timestamp("read_at", { mode: "date" }),
});

export const groupMessages = pgTable(
  "group_message",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    roomId: text("room_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (message) => [index("group_message_room_created_idx").on(message.roomId, message.createdAt)],
);

export const usersRelations = relations(users, ({ many }) => ({
  venues: many(venues),
  bookings: many(bookings),
  notices: many(notices),
  groupMessages: many(groupMessages),
}));

export const venuesRelations = relations(venues, ({ one, many }) => ({
  owner: one(users, { fields: [venues.ownerId], references: [users.id] }),
  courts: many(courts),
  weeklyWindows: many(weeklyWindows),
}));

export const courtsRelations = relations(courts, ({ one, many }) => ({
  venue: one(venues, { fields: [courts.venueId], references: [venues.id] }),
  slots: many(slots),
}));

export const weeklyWindowsRelations = relations(weeklyWindows, ({ one, many }) => ({
  venue: one(venues, { fields: [weeklyWindows.venueId], references: [venues.id] }),
  slots: many(slots),
}));

export const slotsRelations = relations(slots, ({ one, many }) => ({
  court: one(courts, { fields: [slots.courtId], references: [courts.id] }),
  weeklyWindow: one(weeklyWindows, {
    fields: [slots.weeklyWindowId],
    references: [weeklyWindows.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  slot: one(slots, { fields: [bookings.slotId], references: [slots.id] }),
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
}));

export const noticesRelations = relations(notices, ({ one }) => ({
  user: one(users, { fields: [notices.userId], references: [users.id] }),
  slot: one(slots, { fields: [notices.slotId], references: [slots.id] }),
}));

export const groupMessagesRelations = relations(groupMessages, ({ one }) => ({
  user: one(users, { fields: [groupMessages.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type Venue = typeof venues.$inferSelect;
export type Court = typeof courts.$inferSelect;
export type WeeklyWindow = typeof weeklyWindows.$inferSelect;
export type Slot = typeof slots.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Notice = typeof notices.$inferSelect;
export type GroupMessage = typeof groupMessages.$inferSelect;
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type ActivityCategory = (typeof activityCategoryEnum.enumValues)[number];
export type FillMode = (typeof fillModeEnum.enumValues)[number];
export type FillState = (typeof fillStateEnum.enumValues)[number];
export type NoticeType = (typeof noticeTypeEnum.enumValues)[number];
