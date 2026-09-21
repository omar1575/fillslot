import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createSlotAction } from "@/app/actions/slots";
import { getVenueForOwner } from "@/lib/queries";
import { getDb } from "@/db";
import { courts } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export const metadata = { title: "New leftover hour" };

export default async function NewSlotPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/club/slots/new");
  if (session.user.role !== "club" && session.user.role !== "admin") redirect("/");

  const venue = await getVenueForOwner(session.user.id);
  if (!venue) redirect("/club");
  const db = await getDb();
  const venueCourts = await db
    .select()
    .from(courts)
    .where(eq(courts.venueId, venue.id))
    .orderBy(asc(courts.sortOrder));
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : null;

  return (
    <main className="page max-w-lg">
      <p className="kicker text-[var(--ink)]/50">{venue.name}</p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">List a leftover hour</h1>
      <p className="mt-3 text-[var(--ink)]/70">
        Dump a court window that is not filling. Players pay the deal price in advance.
      </p>
      {error ? <p className="notice-error mt-4">{error}</p> : null}
      <form action={createSlotAction} className="mt-8 space-y-5">
        <div className="space-y-2">
          <label htmlFor="courtId" className="kicker text-[var(--ink)]/60">
            Court
          </label>
          <select id="courtId" name="courtId" required className="field">
            {venueCourts.map((court) => (
              <option key={court.id} value={court.id}>
                {court.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="startsAt" className="kicker text-[var(--ink)]/60">
              Starts (Amsterdam)
            </label>
            <input id="startsAt" name="startsAt" type="datetime-local" required className="field" />
          </div>
          <div className="space-y-2">
            <label htmlFor="endsAt" className="kicker text-[var(--ink)]/60">
              Ends
            </label>
            <input id="endsAt" name="endsAt" type="datetime-local" required className="field" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="originalPrice" className="kicker text-[var(--ink)]/60">
              Usual price (€)
            </label>
            <input
              id="originalPrice"
              name="originalPrice"
              type="number"
              min="1"
              step="0.01"
              defaultValue="36"
              required
              className="field"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="dealPrice" className="kicker text-[var(--ink)]/60">
              Fillslot price (€)
            </label>
            <input
              id="dealPrice"
              name="dealPrice"
              type="number"
              min="1"
              step="0.01"
              defaultValue="18"
              required
              className="field"
            />
          </div>
        </div>
        <button type="submit" className="btn-ball w-full">
          Publish leftover
        </button>
      </form>
    </main>
  );
}
