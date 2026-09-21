export default function NotFound() {
  return (
    <main className="page max-w-xl text-center">
      <p className="kicker text-[var(--ink)]/50">404</p>
      <h1 className="mt-2 font-display text-5xl">That slot is gone</h1>
      <p className="mt-3 text-[var(--ink)]/70">The page or court time you wanted is not here.</p>
      <a href="/deals" className="btn-ink mt-8">
        Browse leftovers
      </a>
    </main>
  );
}
