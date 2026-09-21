import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import * as schema from "./schema";
import { seed } from "./seed";

type AppDb =
  | ReturnType<typeof drizzlePglite<typeof schema>>
  | ReturnType<typeof drizzlePostgres<typeof schema>>;

const globalForDb = globalThis as unknown as {
  fillslotDb?: Promise<AppDb>;
  fillslotLock?: Promise<void>;
};

function migrationsFolder() {
  return path.join(process.cwd(), "drizzle");
}

async function maybeSeed(db: AppDb) {
  const existing = await db.query.venues.findFirst();
  if (!existing) {
    await seed(db);
  }
}

async function createPostgresDb(): Promise<AppDb> {
  const url = process.env.DATABASE_URL!;
  const client = postgres(url, { max: 4 });
  const db = drizzlePostgres(client, { schema });
  if (fs.existsSync(migrationsFolder())) {
    await migratePostgres(db, { migrationsFolder: migrationsFolder() });
  }
  await maybeSeed(db);
  return db;
}

async function createPgliteDb(): Promise<AppDb> {
  const client = new PGlite();
  await client.waitReady;
  const db = drizzlePglite({ client, schema });
  if (fs.existsSync(migrationsFolder())) {
    await migratePglite(db, { migrationsFolder: migrationsFolder() });
  }
  await maybeSeed(db);
  return db;
}

export function getDb(): Promise<AppDb> {
  if (!globalForDb.fillslotDb) {
    globalForDb.fillslotDb = process.env.DATABASE_URL?.startsWith("postgres")
      ? createPostgresDb()
      : createPgliteDb();
    globalForDb.fillslotDb.catch(() => {
      globalForDb.fillslotDb = undefined;
    });
  }
  return globalForDb.fillslotDb;
}

export type { AppDb };
