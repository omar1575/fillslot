CREATE TYPE "public"."activity_category" AS ENUM('padel', 'hair', 'spa', 'bowling', 'cinema', 'stadium');--> statement-breakpoint
DROP INDEX "booking_slot_idx";--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "quantity" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "slot" ADD COLUMN "capacity" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "venue" ADD COLUMN "category" "activity_category" DEFAULT 'padel' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "booking_checkout_session_idx" ON "booking" USING btree ("stripe_checkout_session_id");