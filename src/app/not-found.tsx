import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--ink)]/50">
        404
      </p>
      <h1 className="mt-2 font-display text-5xl">That slot is gone</h1>
      <p className="mt-3 text-[var(--ink)]/70">The page or leftover you wanted is not here.</p>
      <Link href="/deals" className="mt-6 inline-block bg-[var(--ink)] px-4 py-2 text-[var(--ball)]">
        Browse leftovers
      </Link>
    </main>
  );
}
