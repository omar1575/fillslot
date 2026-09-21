import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  devSignInAction,
  googleSignInAction,
  sendMagicLinkAction,
} from "@/app/actions/auth";
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
    <main className="page max-w-md">
      <p className="kicker text-[var(--ink)]/50">Account</p>
      <h1 className="mt-2 font-display text-5xl">Sign in</h1>
      <p className="mt-3 text-[var(--ink)]/70">
        Magic link to your email. No password. Book leftover courts or list empty hours.
      </p>

      {typeof query.error === "string" ? (
        <p className="notice-error mt-4">Sign-in failed. Try a demo account or another email.</p>
      ) : null}

      <form action={sendMagicLinkAction} className="mt-8 space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div className="space-y-2">
          <label htmlFor="email" className="kicker text-[var(--ink)]/60">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@club.nl"
            className="field"
          />
        </div>
        <button type="submit" className="btn-ink w-full">
          Email me a link
        </button>
      </form>

      {isGoogleAuthConfigured() ? (
        <form action={googleSignInAction} className="mt-3">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <button type="submit" className="h-12 w-full border border-[var(--ink)] bg-[var(--ticket)] font-display">
            Continue with Google
          </button>
        </form>
      ) : null}

      {isDevLoginEnabled() ? (
        <div className="ticket mt-10 border border-dashed border-[var(--ink)]/25 bg-[var(--ticket)] p-4">
          <p className="kicker text-[var(--ink)]/50">Local demo</p>
          <div className="mt-3 grid gap-2">
            {DEV_ACCOUNTS.map((account) => (
              <form
                action={devSignInAction.bind(null, account.email, callbackUrl)}
                key={account.email}
              >
                <button
                  type="submit"
                  className="flex h-12 w-full items-center justify-between bg-[var(--glass)] px-3 text-left text-sm hover:bg-[#b7cce0]"
                >
                  <span>Continue as {account.name}</span>
                  <span className="font-mono text-[10px] text-[var(--ink)]/50">{account.email}</span>
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
