import Link from "next/link";
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
import { isTicketCategory, resourceLabel } from "@/lib/constants";

export const metadata = { title: "New leftover" };

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
  const ticketed = isTicketCategory(venue.category);
  const unit = resourceLabel(venue.category);
  const units = resourceLabel(venue.category, 2);

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-12 sm:px-6">
      <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--ink)]/50">
        {venue.name}
      </p>
      <h1 className="mt-2 font-display text-5xl">
        List leftover {ticketed ? units : "hours"}
      </h1>
      <p className="mt-3 text-[var(--ink)]/70">
        {ticketed
          ? `Dump leftover ${units} that are not filling. Guests pay the deal price in advance.`
          : `Dump a ${unit} window that is not filling. Guests pay the deal price in advance.`}
      </p>
      <p className="mt-3 text-sm text-[var(--ink)]/65">
        Listing a group with min/full capacity, even numbers, or a flexible split?{" "}
        <Link href="/partner/activity" className="underline">
          Add a group activity
        </Link>
        .
      </p>
      {error ? <p className="notice-error mt-4">{error}</p> : null}
      <form action={createSlotAction} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="courtId" className="capitalize">
            {unit}
          </Label>
          <select
            id="courtId"
            name="courtId"
            required
            className="h-10 w-full border border-input bg-[var(--ticket)] px-3 text-sm"
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
        {ticketed ? (
          <div className="space-y-2">
            <Label htmlFor="capacity">Leftover {units}</Label>
            <Input
              id="capacity"
              name="capacity"
              type="number"
              min="1"
              step="1"
              defaultValue={venue.category === "cinema" ? "24" : "8"}
              required
            />
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="originalPrice">
              Usual price (€){ticketed ? " each" : ""}
            </Label>
            <Input
              id="originalPrice"
              name="originalPrice"
              type="number"
              min="1"
              step="0.01"
              defaultValue={ticketed ? "14" : "36"}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dealPrice">
              Fillslot price (€){ticketed ? " each" : ""}
            </Label>
            <Input
              id="dealPrice"
              name="dealPrice"
              type="number"
              min="1"
              step="0.01"
              defaultValue={ticketed ? "7" : "18"}
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
