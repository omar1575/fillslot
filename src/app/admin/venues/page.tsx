import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { approveVenueAction } from "@/app/actions/venues";
import { getAllVenues } from "@/lib/queries";

export const metadata = { title: "Venues" };

export default async function AdminVenuesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/admin/venues");
  if (session.user.role !== "admin") redirect("/");

  const venueRows = await getAllVenues();

  return (
    <main className="page max-w-4xl">
      <p className="kicker text-[var(--ink)]/50">Admin</p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">Venues</h1>
      <p className="mt-3 text-[var(--ink)]/70">Approve a club before its leftover hours go public.</p>
      {venueRows.length === 0 ? (
        <p className="ticket mt-8 bg-[var(--ticket)] px-5 py-10 text-center text-[var(--ink)]/70">
          No venues yet.
        </p>
      ) : (
        <div className="mt-8 divide-y divide-[var(--ink)]/10 bg-[var(--ticket)] shadow-ticket">
          {venueRows.map((venue) => (
            <div key={venue.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
              <div>
                <p className="font-display text-xl">{venue.name}</p>
                <p className="text-sm text-[var(--ink)]/60">
                  {venue.city} · {venue.status} · {venue.commissionBps / 100}%
                </p>
              </div>
              {venue.status === "pending" ? (
                <form action={approveVenueAction}>
                  <input type="hidden" name="venueId" value={venue.id} />
                  <button type="submit" className="btn-ball min-h-10 px-4 py-2">
                    Approve
                  </button>
                </form>
              ) : (
                <span className="kicker text-[var(--ink)]/50">{venue.status}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
