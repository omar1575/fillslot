ALTER TYPE "public"."activity_category" ADD VALUE IF NOT EXISTS 'go_karting';--> statement-breakpoint
ALTER TYPE "public"."activity_category" ADD VALUE IF NOT EXISTS 'escape_room';--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."fill_mode" AS ENUM('threshold', 'exact', 'cap');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."fill_state" AS ENUM('collecting', 'confirmed', 'inviting', 'refunded');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."notice_type" AS ENUM('fill_invite', 'switch_offer', 'confirmed', 'refunded');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "weekly_window" (
	"id" text PRIMARY KEY NOT NULL,
	"venue_id" text NOT NULL,
	"weekday" integer NOT NULL,
	"start_minute" integer NOT NULL,
	"end_minute" integer NOT NULL,
	"session_minutes" integer NOT NULL,
	"original_price_cents" integer NOT NULL,
	"deal_price_cents" integer NOT NULL,
	"fill_mode" "fill_mode" DEFAULT 'threshold' NOT NULL,
	"min_party_size" integer DEFAULT 1 NOT NULL,
	"capacity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notice" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "notice_type" NOT NULL,
	"slot_id" text,
	"related_slot_id" text,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp
);--> statement-breakpoint
ALTER TABLE "slot" ADD COLUMN IF NOT EXISTS "weekly_window_id" text;--> statement-breakpoint
ALTER TABLE "slot" ADD COLUMN IF NOT EXISTS "min_party_size" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "slot" ADD COLUMN IF NOT EXISTS "fill_mode" "fill_mode" DEFAULT 'cap' NOT NULL;--> statement-breakpoint
ALTER TABLE "slot" ADD COLUMN IF NOT EXISTS "fill_state" "fill_state" DEFAULT 'collecting' NOT NULL;--> statement-breakpoint
ALTER TABLE "slot" ADD COLUMN IF NOT EXISTS "fill_invite_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "slot" ADD COLUMN IF NOT EXISTS "fill_resolved_at" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "weekly_window" ADD CONSTRAINT "weekly_window_venue_id_venue_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venue"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notice" ADD CONSTRAINT "notice_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notice" ADD CONSTRAINT "notice_slot_id_slot_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."slot"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notice" ADD CONSTRAINT "notice_related_slot_id_slot_id_fk" FOREIGN KEY ("related_slot_id") REFERENCES "public"."slot"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "slot" ADD CONSTRAINT "slot_weekly_window_id_weekly_window_id_fk" FOREIGN KEY ("weekly_window_id") REFERENCES "public"."weekly_window"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
