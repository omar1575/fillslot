export function SetupNeeded() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--ink)]/50">
        Setup
      </p>
      <h1 className="mt-2 font-display text-5xl">Connect Supabase</h1>
      <p className="mt-4 text-[var(--ink)]/70">
        Fillslot now uses Supabase Auth and Postgres. Copy <code>.env.example</code> to{" "}
        <code>.env.local</code>, add your project URL, anon key, service role, and database
        URLs, then run <code>npm run db:migrate</code> and <code>npm run db:seed</code>.
      </p>
    </main>
  );
}
