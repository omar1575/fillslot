import Link from "next/link";
import { auth } from "@/auth";
import { signOutAction } from "@/app/actions/auth";
import { APP_NAME } from "@/lib/constants";

export async function SiteHeader() {
  const session = await auth();
  const role = session?.user?.role;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--ink)]/10 bg-[var(--wall)]/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-2xl tracking-tight">{APP_NAME}</span>
          <span className="hidden font-mono text-[10px] tracking-[0.18em] text-[var(--ink)]/50 uppercase sm:inline">
            Maastricht
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/deals" className="hover:text-[var(--turf)]">
            Deals
          </Link>
          {session ? (
            <>
              <Link href="/bookings" className="hover:text-[var(--turf)]">
                Bookings
              </Link>
              {role === "club" || role === "admin" ? (
                <Link href="/club" className="hover:text-[var(--turf)]">
                  Club
                </Link>
              ) : session ? (
                <Link href="/club/onboarding" className="hover:text-[var(--turf)]">
                  For venues
                </Link>
              ) : null}
              {role === "admin" ? (
                <Link href="/admin/venues" className="hover:text-[var(--turf)]">
                  Admin
                </Link>
              ) : null}
              <form action={signOutAction}>
                <button type="submit" className="font-medium hover:text-[var(--turf)]">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-[var(--ink)] px-3 py-1.5 font-medium text-[var(--ball)]"
            >
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
    <footer className="mt-auto border-t border-[var(--ink)]/10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-[var(--ink)]/60 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Leftover hours and tickets, paid in advance. Netherlands-first.</p>
        <div className="flex gap-4">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
