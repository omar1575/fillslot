import { eq } from "drizzle-orm";
import type { User as AuthUser } from "@supabase/supabase-js";
import { getDb } from "@/db";
import { users, type UserRole } from "@/db/schema";

function profileFromAuthUser(user: AuthUser) {
  const metadata = user.user_metadata ?? {};
  const name =
    (typeof metadata.full_name === "string" && metadata.full_name) ||
    (typeof metadata.name === "string" && metadata.name) ||
    user.email?.split("@")[0] ||
    null;
  const image =
    (typeof metadata.avatar_url === "string" && metadata.avatar_url) ||
    (typeof metadata.picture === "string" && metadata.picture) ||
    null;
  return { name, image };
}

export async function ensurePublicUser(
  user: AuthUser,
  role: UserRole = "consumer",
) {
  const db = await getDb();
  const existing = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });
  const { name, image } = profileFromAuthUser(user);
  const emailVerified = user.email_confirmed_at
    ? new Date(user.email_confirmed_at)
    : new Date();

  if (existing) {
    await db
      .update(users)
      .set({
        email: user.email ?? existing.email,
        name: name ?? existing.name,
        image: image ?? existing.image,
        emailVerified,
      })
      .where(eq(users.id, existing.id));
    return existing.role;
  }

  const byEmail = user.email
    ? await db.query.users.findFirst({
        where: eq(users.email, user.email),
      })
    : undefined;
  if (byEmail) {
    await db
      .update(users)
      .set({
        name: name ?? byEmail.name,
        image: image ?? byEmail.image,
        emailVerified,
      })
      .where(eq(users.id, byEmail.id));
    return byEmail.role;
  }

  await db.insert(users).values({
    id: user.id,
    email: user.email,
    name,
    image,
    role,
    emailVerified,
  });
  return role;
}
