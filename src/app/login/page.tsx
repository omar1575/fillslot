import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  devSignInAction,
  googleSignInAction,
  sendMagicLinkAction,
} from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEV_ACCOUNTS } from "@/lib/constants";
import { isDevLoginEnabled, isGoogleAuthConfigured } from "@/lib/env";
import { readDevMailbox } from "@/lib/mail";

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

  const mailbox = isDevLoginEnabled() ? await readDevMailbox() : [];

  return (
    <main className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
      <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--ink)]/50">
        Account
      </p>
      <h1 className="mt-2 font-display text-5xl">Sign in</h1>
      <p className="mt-3 text-[var(--ink)]/70">
        Magic link to your email. No password. Book leftover courts or list empty hours.
      </p>

      {typeof query.error === "string" ? (
        <p className="mt-4 bg-[#c7342b] px-3 py-2 text-sm text-white">
          Sign-in failed. Try a demo account or another email.
        </p>
      ) : null}

      <form action={sendMagicLinkAction} className="mt-8 space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required placeholder="you@club.nl" />
        </div>
        <Button type="submit" className="h-11 w-full rounded-none bg-[var(--ink)] text-[var(--ball)]">
          Email me a link
        </Button>
      </form>

      {isGoogleAuthConfigured() ? (
        <form action={googleSignInAction} className="mt-3">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <Button type="submit" variant="outline" className="h-11 w-full rounded-none">
            Continue with Google
          </Button>
        </form>
      ) : null}

      {isDevLoginEnabled() ? (
        <div className="mt-10 border border-dashed border-[var(--ink)]/20 p-4">
          <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--ink)]/50">
            Local demo
          </p>
          <div className="mt-3 grid gap-2">
            {DEV_ACCOUNTS.map((account) => (
              <form
                action={devSignInAction.bind(null, account.email, callbackUrl)}
                key={account.email}
              >
                <button
                  type="submit"
                  className="h-10 w-full bg-[#d5e4f2] px-3 text-left text-sm hover:bg-[#c5d8ea]"
                >
                  Continue as {account.name}
                </button>
              </form>
            ))}
          </div>
          {mailbox[0] ? (
            <p className="mt-4 text-sm">
              Latest magic link:{" "}
              <a className="underline" href={mailbox[0].url}>
                {mailbox[0].to}
              </a>
            </p>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
