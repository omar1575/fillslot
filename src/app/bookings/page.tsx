import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { EmptyDeals } from "@/components/deal-ticket";
import { formatEuro } from "@/lib/money";
import { getUserBookings } from "@/lib/queries";
import { formatDate, formatTimeRange } from "@/lib/time";

export const metadata = { title: "Bookings" };

export default async function BookingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/bookings");

  const rows = await getUserBookings(session.user.id);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-5xl">Your bookings</h1>
      <p className="mt-3 text-[var(--ink)]/70">Show the check-in code at the desk.</p>
      <div className="mt-10 grid gap-4">
        {rows.length === 0 ? (
          <EmptyDeals
            title="No courts booked yet"
            body="Grab an off-peak leftover before someone else does."
            action={
              <Link href="/deals" className="bg-[var(--ink)] px-4 py-2 text-[var(--ball)]">
                Browse deals
              </Link>
            }
          />
        ) : (
          rows.map(({ booking, slot, court, venue }) => (
            <Link
              key={booking.id}
              href={`/bookings/${booking.id}`}
              className="flex flex-wrap items-center justify-between gap-4 bg-white px-5 py-4 ring-1 ring-[var(--ink)]/10"
            >
              <div>
                <p className="font-display text-xl">{venue.name}</p>
                <p className="text-sm text-[var(--ink)]/65">
                  {court.name} · {formatDate(slot.startsAt)} · {formatTimeRange(slot.startsAt, slot.endsAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-lg tracking-[0.2em]">{booking.code}</p>
                <p className="text-sm text-[var(--ink)]/60">
                  {booking.status} · {formatEuro(booking.grossCents)}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
