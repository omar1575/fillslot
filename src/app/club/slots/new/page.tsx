import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createSlotAction } from "@/app/actions/slots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <main className="mx-auto w-full max-w-lg px-4 py-12 sm:px-6">
      <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--ink)]/50">
        {venue.name}
      </p>
      <h1 className="mt-2 font-display text-5xl">List a leftover hour</h1>
      <p className="mt-3 text-[var(--ink)]/70">
        Dump a court window that is not filling. Players pay the deal price in advance.
      </p>
      {error ? <p className="mt-4 bg-[#c7342b] px-3 py-2 text-sm text-white">{error}</p> : null}
      <form action={createSlotAction} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="courtId">Court</Label>
          <select
            id="courtId"
            name="courtId"
            required
            className="h-10 w-full border border-input bg-white px-3 text-sm"
          >
            {venueCourts.map((court) => (
              <option key={court.id} value={court.id}>
                {court.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startsAt">Starts (Amsterdam)</Label>
            <Input id="startsAt" name="startsAt" type="datetime-local" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endsAt">Ends</Label>
            <Input id="endsAt" name="endsAt" type="datetime-local" required />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="originalPrice">Usual price (€)</Label>
            <Input
              id="originalPrice"
              name="originalPrice"
              type="number"
              min="1"
              step="0.01"
              defaultValue="36"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dealPrice">Fillslot price (€)</Label>
            <Input
              id="dealPrice"
              name="dealPrice"
              type="number"
              min="1"
              step="0.01"
              defaultValue="18"
              required
            />
          </div>
        </div>
        <Button type="submit" className="h-11 w-full rounded-none bg-[var(--ball)] font-display text-[var(--ink)]">
          Publish leftover
        </Button>
      </form>
    </main>
  );
}
