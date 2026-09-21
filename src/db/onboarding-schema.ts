import { date, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./schema";

export const userOnboarding = pgTable("user_onboarding", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  dateOfBirth: date("date_of_birth", { mode: "string" }).notNull(),
  interests: text("interests").array().notNull(),
  reasons: text("reasons").array().notNull(),
  completedAt: timestamp("completed_at", { mode: "date" }).notNull().defaultNow(),
});

export type UserOnboarding = typeof userOnboarding.$inferSelect;
