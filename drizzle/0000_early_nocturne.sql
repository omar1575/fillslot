CREATE TYPE "public"."booking_status" AS ENUM('pending', 'paid', 'cancelled', 'refunded', 'completed');--> statement-breakpoint
CREATE TYPE "public"."slot_status" AS ENUM('open', 'held', 'booked', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('consumer', 'club', 'admin');--> statement-breakpoint
CREATE TYPE "public"."venue_status" AS ENUM('pending', 'approved');--> statement-breakpoint
CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "booking" (
	"id" text PRIMARY KEY NOT NULL,
	"slot_id" text NOT NULL,
	"user_id" text NOT NULL,
	"code" text NOT NULL,
	"gross_cents" integer NOT NULL,
	"commission_cents" integer NOT NULL,
	"net_cents" integer NOT NULL,
	"payout_pending" integer DEFAULT 1 NOT NULL,
	"stripe_checkout_session_id" text,
	"stripe_payment_intent_id" text,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "booking_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "court" (
	"id" text PRIMARY KEY NOT NULL,
	"venue_id" text NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slot" (
	"id" text PRIMARY KEY NOT NULL,
	"court_id" text NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"original_price_cents" integer NOT NULL,
	"deal_price_cents" integer NOT NULL,
	"status" "slot_status" DEFAULT 'open' NOT NULL,
	"hold_expires_at" timestamp,
	"stripe_checkout_session_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	"role" "user_role" DEFAULT 'consumer' NOT NULL,
	"stripe_customer_id" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "venue" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"postal_code" text NOT NULL,
	"country" text DEFAULT 'NL' NOT NULL,
	"photo_url" text,
	"commission_bps" integer DEFAULT 1500 NOT NULL,
	"stripe_account_id" text,
	"stripe_details_submitted" integer DEFAULT 0 NOT NULL,
	"status" "venue_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "venue_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_slot_id_slot_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."slot"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "court" ADD CONSTRAINT "court_venue_id_venue_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot" ADD CONSTRAINT "slot_court_id_court_id_fk" FOREIGN KEY ("court_id") REFERENCES "public"."court"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue" ADD CONSTRAINT "venue_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "booking_slot_idx" ON "booking" USING btree ("slot_id");--> statement-breakpoint
CREATE UNIQUE INDEX "slot_court_start_idx" ON "slot" USING btree ("court_id","starts_at");