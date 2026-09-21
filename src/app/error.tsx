"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="page max-w-xl text-center">
      <p className="kicker text-[var(--ink)]/50">Error</p>
      <h1 className="mt-2 font-display text-5xl">The court glitched</h1>
      <p className="mt-3 text-[var(--ink)]/70">
        Something broke while loading this page. Try again, or pick another leftover hour.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn-ball">
          Try again
        </button>
        <a href="/deals" className="btn-ink">
          Browse leftovers
        </a>
      </div>
    </main>
  );
}
