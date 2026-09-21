"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { isDevLoginEnabled } from "@/lib/env";

export async function sendMagicLinkAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/");
  await signIn("resend", { email, redirectTo: callbackUrl });
}

export async function googleSignInAction(formData: FormData) {
  const callbackUrl = String(formData.get("callbackUrl") ?? "/");
  await signIn("google", { redirectTo: callbackUrl });
}

export async function devSignInAction(email: string, callbackUrl: string) {
  if (!isDevLoginEnabled()) {
    throw new Error("Dev login is disabled.");
  }
  await signIn("dev-login", { email, redirectTo: callbackUrl });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function redirectToLogin(callbackUrl: string) {
  redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
}
