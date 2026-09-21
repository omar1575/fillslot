import { sql, type SQL } from "drizzle-orm";

type ExecDb = {
  execute: (query: SQL) => Promise<unknown>;
};

let ensured: Promise<void> | null = null;

export async function ensureMerchantOnboardingSchema(db: ExecDb) {
  if (!ensured) {
    ensured = applyMerchantOnboardingSchema(db).catch((error) => {
      ensured = null;
      throw error;
    });
  }
  return ensured;
}

async function applyMerchantOnboardingSchema(db: ExecDb) {
  await db.execute(sql`ALTER TYPE activity_category ADD VALUE IF NOT EXISTS 'go_karting'`);
  await db.execute(sql`ALTER TYPE activity_category ADD VALUE IF NOT EXISTS 'escape_room'`);
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE fill_mode AS ENUM ('threshold', 'exact', 'cap');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$
  `);
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE fill_state AS ENUM ('collecting', 'confirmed', 'inviting', 'refunded');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$
  `);
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE notice_type AS ENUM ('fill_invite', 'switch_offer', 'confirmed', 'refunded');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS weekly_window (
      id text PRIMARY KEY,
      venue_id text NOT NULL REFERENCES venue(id) ON DELETE CASCADE,
      weekday integer NOT NULL,
      start_minute integer NOT NULL,
      end_minute integer NOT NULL,
      session_minutes integer NOT NULL,
      original_price_cents integer NOT NULL,
      deal_price_cents integer NOT NULL,
      fill_mode fill_mode NOT NULL DEFAULT 'threshold',
      min_party_size integer NOT NULL DEFAULT 1,
      capacity integer NOT NULL DEFAULT 1,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    ALTER TABLE slot ADD COLUMN IF NOT EXISTS weekly_window_id text REFERENCES weekly_window(id) ON DELETE SET NULL
  `);
  await db.execute(sql`ALTER TABLE slot ADD COLUMN IF NOT EXISTS min_party_size integer NOT NULL DEFAULT 1`);
  await db.execute(sql`ALTER TABLE slot ADD COLUMN IF NOT EXISTS fill_mode fill_mode NOT NULL DEFAULT 'cap'`);
  await db.execute(sql`ALTER TABLE slot ADD COLUMN IF NOT EXISTS fill_state fill_state NOT NULL DEFAULT 'collecting'`);
  await db.execute(sql`ALTER TABLE slot ADD COLUMN IF NOT EXISTS fill_invite_sent_at timestamp`);
  await db.execute(sql`ALTER TABLE slot ADD COLUMN IF NOT EXISTS fill_resolved_at timestamp`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS notice (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      type notice_type NOT NULL,
      slot_id text REFERENCES slot(id) ON DELETE CASCADE,
      related_slot_id text REFERENCES slot(id) ON DELETE SET NULL,
      title text NOT NULL,
      body text NOT NULL,
      created_at timestamp NOT NULL DEFAULT now(),
      read_at timestamp
    )
  `);
}
