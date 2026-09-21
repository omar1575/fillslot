import Link from "next/link";
import { auth } from "@/auth";
import { signOutAction } from "@/app/actions/auth";
import { APP_NAME } from "@/lib/constants";

export async function SiteHeader() {
  const session = await auth();
  const role = session?.user?.role;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[var(--ink)] text-[var(--cream)]">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <Link href="/" className="flex min-w-0 items-baseline gap-2">
          <span className="font-display text-xl tracking-tight text-[var(--ball)] sm:text-2xl">
            {APP_NAME}
          </span>
          <span className="hidden font-mono text-[10px] tracking-[0.18em] text-[var(--cream)]/45 uppercase sm:inline">
            Maastricht
          </span>
        </Link>
        <nav className="flex max-w-[62%] items-center gap-3 overflow-x-auto text-sm whitespace-nowrap sm:max-w-none sm:gap-5">
          <Link href="/deals" className="hover:text-[var(--ball)]">
            Deals
          </Link>
          <Link href="/plans" className="hover:text-[var(--ball)]">
            Plans
          </Link>
          <Link href="/partner" className="hover:text-[var(--ball)]">
            Partner
          </Link>
          {session ? (
            <>
              <Link href="/bookings" className="hover:text-[var(--ball)]">
                Bookings
              </Link>
              {role === "club" || role === "admin" ? (
                <Link href="/club" className="hover:text-[var(--ball)]">
                  Club
                </Link>
              ) : null}
              {role === "admin" ? (
                <Link href="/admin/venues" className="hover:text-[var(--ball)]">
                  Admin
                </Link>
              ) : null}
              <form action={signOutAction}>
                <button type="submit" className="font-medium hover:text-[var(--ball)]">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="!rounded-none bg-[var(--ball)] px-3 py-1.5 font-display text-[var(--ink)]">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[var(--ink)] text-[var(--cream)]/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          <span className="font-display text-[var(--ball)]">Fillslot</span>
          {" · "}
          Leftover hours and tickets, paid in advance. Netherlands-first.
        </p>
        <div className="flex gap-4">
          <Link href="/terms" className="hover:text-[var(--ball)]">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-[var(--ball)]">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
