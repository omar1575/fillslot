import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { EmptyDeals } from "@/components/deal-ticket";
import { formatEuro } from "@/lib/money";
import { getUserBookings } from "@/lib/queries";
import { formatDate, formatTimeRange } from "@/lib/time";
import { resourceLabel } from "@/lib/constants";

export const metadata = { title: "Bookings" };

export default async function BookingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/bookings");

  const rows = await getUserBookings(session.user.id);

  return (
    <main className="page">
      <p className="kicker text-[var(--ink)]/50">Player desk</p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">Your bookings</h1>
      <p className="mt-3 text-[var(--ink)]/70">Show the check-in code at the desk.</p>
      <div className="mt-8 grid gap-4 sm:mt-10">
        {rows.length === 0 ? (
          <EmptyDeals
            title="Nothing booked yet"
            body="Grab an off-peak leftover before someone else does."
            action={
              <Link href="/deals" className="btn-ink">
                Browse deals
              </Link>
            }
          />
        ) : (
          rows.map(({ booking, slot, court, venue }) => (
            <Link
              key={booking.id}
              href={`/bookings/${booking.id}`}
              className="ticket flex flex-wrap items-center justify-between gap-4 bg-[var(--ticket)] px-5 py-4 shadow-ticket"
            >
              <div>
                <p className="kicker text-[var(--ink)]/45">{booking.status}</p>
                <p className="font-display text-xl">{venue.name}</p>
                <p className="text-sm text-[var(--ink)]/65">
                  {court.name} · {formatDate(slot.startsAt)} · {formatTimeRange(slot.startsAt, slot.endsAt)}
                  {booking.quantity > 1
                    ? ` · ${booking.quantity} ${resourceLabel(venue.category, booking.quantity)}`
                    : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-lg tracking-[0.2em]">{booking.code}</p>
                <p className="text-sm text-[var(--ink)]/60">{formatEuro(booking.grossCents)}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
