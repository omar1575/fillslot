import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  devSignInAction,
  passwordSignInAction,
  signUpAction,
} from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEV_ACCOUNTS } from "@/lib/constants";
import { isDevLoginEnabled, isSupabaseConfigured } from "@/lib/env";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const query = await searchParams;
  const callbackUrl =
    typeof query.callbackUrl === "string" ? query.callbackUrl : "/";
  if (session) redirect(callbackUrl);

  const error = typeof query.error === "string" ? query.error : null;
  const sent = query.sent === "1";
  const configured = isSupabaseConfigured();

  return (
    <main className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
      <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--ink)]/50">
        Account
      </p>
      <h1 className="mt-2 font-display text-5xl">Sign in</h1>
      <p className="mt-3 text-[var(--ink)]/70">
        Use your email and password. Google and Apple sign-in come later.
      </p>

      {!configured ? (
        <p className="mt-4 bg-[#c7342b] px-3 py-2 text-sm text-white">
          Supabase is not configured. Copy `.env.example` to `.env.local` and add your project
          keys.
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 bg-[#c7342b] px-3 py-2 text-sm text-white">{error}</p>
      ) : null}

      {sent ? (
        <p className="mt-4 bg-[var(--ball)] px-3 py-2 text-sm text-[var(--ink)]">
          Check your inbox to confirm your email, then sign in.
        </p>
      ) : null}

      <form className="mt-8 space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required placeholder="you@club.nl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required minLength={6} />
        </div>
        <Button
          formAction={passwordSignInAction}
          type="submit"
          disabled={!configured}
          className="h-11 w-full rounded-none bg-[var(--ink)] text-[var(--ball)]"
        >
          Sign in
        </Button>
        <Button
          formAction={signUpAction}
          type="submit"
          variant="outline"
          disabled={!configured}
          className="h-11 w-full rounded-none"
        >
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--ink)]/60">
        Venue leftover hours?{" "}
        <Link href="/club/onboarding" className="text-[var(--turf)] underline">
          Dump them here
        </Link>
        .
      </p>

      {isDevLoginEnabled() ? (
        <div className="mt-10 border border-dashed border-[var(--ink)]/20 p-4">
          <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--ink)]/50">
            Local demo
          </p>
          <p className="mt-2 text-sm text-[var(--ink)]/60">
            Seeded accounts use the local demo password from `.env.example`.
          </p>
          <div className="mt-3 grid gap-4">
            {(
              [
                { label: "Player", accounts: DEV_ACCOUNTS.filter((account) => account.role === "consumer") },
                { label: "Partners", accounts: DEV_ACCOUNTS.filter((account) => account.role === "club") },
                { label: "Admin", accounts: DEV_ACCOUNTS.filter((account) => account.role === "admin") },
              ] as const
            ).map((group) => (
              <div key={group.label}>
                <p className="mb-2 font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--ink)]/40">
                  {group.label}
                </p>
                <div className="grid gap-2">
                  {group.accounts.map((account) => (
                    <form
                      action={devSignInAction.bind(null, account.email, callbackUrl)}
                      key={account.email}
                    >
                      <button
                        type="submit"
                        disabled={!configured}
                        className="h-10 w-full bg-[#d5e4f2] px-3 text-left text-sm hover:bg-[#c5d8ea] disabled:opacity-50"
                      >
                        Continue as {account.name}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </main>
  );
}
