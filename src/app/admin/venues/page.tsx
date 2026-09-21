import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { approveVenueAction } from "@/app/actions/venues";
import { Button } from "@/components/ui/button";
import { getAllVenues } from "@/lib/queries";

export const metadata = { title: "Venues" };

export default async function AdminVenuesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/admin/venues");
  if (session.user.role !== "admin") redirect("/");

  const venueRows = await getAllVenues();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-5xl">Venues</h1>
      <p className="mt-3 text-[var(--ink)]/70">Approve a venue before its leftover hours go public.</p>
      <div className="mt-8 divide-y divide-[var(--ink)]/10 bg-white ring-1 ring-[var(--ink)]/10">
        {venueRows.map((venue) => (
          <div key={venue.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
            <div>
              <p className="font-display text-xl">{venue.name}</p>
              <p className="text-sm text-[var(--ink)]/60">
                {venue.city} · {venue.category} · {venue.status} · {venue.commissionBps / 100}%
              </p>
            </div>
            {venue.status === "pending" ? (
              <form action={approveVenueAction}>
                <input type="hidden" name="venueId" value={venue.id} />
                <Button type="submit" className="rounded-none">
                  Approve
                </Button>
              </form>
            ) : (
              <span className="font-mono text-xs uppercase">{venue.status}</span>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
