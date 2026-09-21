"use server";

import { redirect } from "next/navigation";
import { appUrl, devLoginPassword, isDevLoginEnabled, safeNextPath } from "@/lib/env";
import { ensurePublicUser } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function oauthRedirect(callbackUrl: string) {
  return `${appUrl()}/auth/callback?next=${encodeURIComponent(safeNextPath(callbackUrl))}`;
}

function loginError(message: string, callbackUrl: string) {
  redirect(
    `/login?error=${encodeURIComponent(message)}&callbackUrl=${encodeURIComponent(safeNextPath(callbackUrl))}`,
  );
}

async function startOAuth(
  provider: "google" | "apple",
  callbackUrl: string,
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: oauthRedirect(callbackUrl),
    },
  });
  if (error || !data.url) {
    loginError(error?.message ?? `${provider} sign-in is not enabled yet`, callbackUrl);
  }
  redirect(data.url);
}

export async function passwordSignInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = safeNextPath(formData.get("callbackUrl"));
  if (!email || !password) {
    loginError("Enter your email and password", callbackUrl);
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    loginError(error.message, callbackUrl);
  }
  if (data.user) {
    await ensurePublicUser(data.user);
  }
  redirect(callbackUrl);
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = safeNextPath(formData.get("callbackUrl"));
  if (!email || !password) {
    loginError("Enter your email and password", callbackUrl);
  }
  if (password.length < 6) {
    loginError("Password must be at least 6 characters", callbackUrl);
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: oauthRedirect(callbackUrl),
    },
  });
  if (error) {
    loginError(error.message, callbackUrl);
  }
  if (data.session && data.user) {
    await ensurePublicUser(data.user);
    redirect(callbackUrl);
  }
  redirect(`/login?sent=1&callbackUrl=${encodeURIComponent(callbackUrl)}`);
}

export async function googleSignInAction(formData: FormData) {
  await startOAuth("google", String(formData.get("callbackUrl") ?? "/"));
}

export async function appleSignInAction(formData: FormData) {
  await startOAuth("apple", String(formData.get("callbackUrl") ?? "/"));
}

export async function sendMagicLinkAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const callbackUrl = safeNextPath(formData.get("callbackUrl"));
  if (!email) {
    loginError("Enter your email", callbackUrl);
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: oauthRedirect(callbackUrl),
    },
  });
  if (error) {
    loginError(error.message, callbackUrl);
  }
  redirect(`/login?sent=1&callbackUrl=${encodeURIComponent(callbackUrl)}`);
}

export async function devSignInAction(email: string, callbackUrl: string) {
  if (!isDevLoginEnabled()) {
    throw new Error("Dev login is disabled.");
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: devLoginPassword(),
  });
  if (error) {
    loginError(error.message, callbackUrl);
  }
  if (data.user) {
    await ensurePublicUser(data.user);
  }
  redirect(safeNextPath(callbackUrl));
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function redirectToLogin(callbackUrl: string) {
  redirect(`/login?callbackUrl=${encodeURIComponent(safeNextPath(callbackUrl))}`);
}
