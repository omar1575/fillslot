import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { UserRole } from "@/db/schema";

export function isVendorRole(role?: UserRole | null) {
  return role === "club";
}

export async function bounceVendorToDesk() {
  const session = await auth();
  if (session?.user?.role === "club") redirect("/club");
  return session;
}

export async function requirePlayer(callbackUrl: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  if (session.user.role === "club") redirect("/club");
  return session;
}

export async function requireVendor(callbackUrl = "/club") {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  if (session.user.role !== "club" && session.user.role !== "admin") {
    redirect("/deals");
  }
  return session;
}
