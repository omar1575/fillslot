import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { EmptyDeals } from "@/components/deal-ticket";
import { formatEuro } from "@/lib/money";
import { getUserBookings, getUserNotices } from "@/lib/queries";
import { formatDate, formatTimeRange } from "@/lib/time";
import { resourceLabel } from "@/lib/constants";

export const metadata = { title: "Bookings" };

export default async function BookingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/bookings");

  const rows = await getUserBookings(session.user.id);
  const notices = await getUserNotices(session.user.id);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-5xl">Your bookings</h1>
      <p className="mt-3 text-[var(--ink)]/70">Show the check-in code at the desk.</p>
      {notices.length > 0 ? (
        <section className="mt-8 space-y-3">
          <h2 className="font-display text-2xl">Fill updates</h2>
          {notices.map(({ notice, venue }) => {
            const href = notice.relatedSlotId
              ? `/deals/${notice.relatedSlotId}`
              : notice.slotId
                ? `/deals/${notice.slotId}`
                : "/deals";
            return (
              <Link
                key={notice.id}
                href={href}
                className="block bg-[var(--ball)] px-4 py-3 text-sm text-[var(--ink)]"
              >
                <p className="font-medium">{notice.title}</p>
                <p className="mt-1 text-[var(--ink)]/70">
                  {notice.body}
                  {venue ? ` · ${venue.name}` : ""}
                </p>
              </Link>
            );
          })}
        </section>
      ) : null}
      <div className="mt-10 grid gap-4">
        {rows.length === 0 ? (
          <EmptyDeals
            title="Nothing booked yet"
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
                  {booking.quantity > 1
                    ? ` · ${booking.quantity} ${resourceLabel(venue.category, booking.quantity)}`
                    : ""}
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
