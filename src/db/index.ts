import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { ensureMerchantOnboardingSchema } from "./ensure-merchant";
import { seed } from "./seed";
import { requireDatabaseUrl } from "@/lib/env";

type AppDb = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  fillslotDb?: Promise<AppDb>;
};

async function maybeSeed(db: AppDb) {
  const existing = await db.query.venues.findFirst();
  if (!existing) {
    await seed(db);
  }
}

async function createPostgresDb(): Promise<AppDb> {
  const url = requireDatabaseUrl();
  const pooled = url.includes("pooler") || url.includes("pgbouncer=true");
  const client = postgres(url, { max: 4, prepare: pooled ? false : undefined });
  const db = drizzle(client, { schema });
  await ensureMerchantOnboardingSchema(db);
  await maybeSeed(db);
  return db;
}

export async function getDb(): Promise<AppDb> {
  if (!globalForDb.fillslotDb) {
    globalForDb.fillslotDb = createPostgresDb();
    globalForDb.fillslotDb.catch(() => {
      globalForDb.fillslotDb = undefined;
    });
  }
  const db = await globalForDb.fillslotDb;
  await ensureMerchantOnboardingSchema(db);
  return db;
}

export type { AppDb };
