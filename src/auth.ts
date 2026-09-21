import { eq, or } from "drizzle-orm";
import { getDb } from "@/db";
import { users, type UserRole } from "@/db/schema";
import { isSupabaseConfigured } from "@/lib/env";
import { ensurePublicUser } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  role: UserRole;
};

export type Session = {
  user: SessionUser;
};

export async function auth(): Promise<Session | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  await ensurePublicUser(user);
  const db = await getDb();
  const row = await db.query.users.findFirst({
    where: user.email
      ? or(eq(users.id, user.id), eq(users.email, user.email))
      : eq(users.id, user.id),
  });
  if (!row) return null;

  return {
    user: {
      id: row.id,
      email: row.email,
      name: row.name,
      image: row.image,
      role: row.role,
    },
  };
}
