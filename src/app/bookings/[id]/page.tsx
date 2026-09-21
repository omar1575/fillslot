import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { formatEuro } from "@/lib/money";
import { getBookingWithDetails } from "@/lib/queries";
import { formatDateTime, formatTimeRange } from "@/lib/time";

export const dynamic = "force-dynamic";

export const metadata = { title: "Booking" };

export default async function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/bookings");
  const { id } = await params;
  const row = await getBookingWithDetails(id);
  if (!row) notFound();
  if (row.booking.userId !== session.user.id && session.user.role !== "admin") {
    redirect("/bookings");
  }

  return (
    <main className="page max-w-xl">
      <Link href="/bookings" className="kicker text-[var(--ink)]/50">
        ← Bookings
      </Link>
      <div className="ticket mt-6 overflow-hidden bg-[var(--ticket)] text-center shadow-ticket">
        <div className="bg-[var(--turf)] px-6 py-4 text-[var(--ball)]">
          <p className="kicker text-white/70">Check-in ticket</p>
          <p className="mt-2 font-display text-5xl tracking-[0.18em] sm:text-6xl">
            {row.booking.code}
          </p>
        </div>
        <div className="px-6 py-8">
          <h1 className="font-display text-3xl">{row.venue.name}</h1>
          <p className="mt-2 text-[var(--ink)]/70">{row.court.name}</p>
          <p className="mt-4 font-mono">
            {formatDateTime(row.slot.startsAt)} · {formatTimeRange(row.slot.startsAt, row.slot.endsAt)}
          </p>
          <p className="mt-6 text-sm">
            Paid {formatEuro(row.booking.grossCents)} · {row.booking.status}
          </p>
          <p className="mt-2 text-sm text-[var(--ink)]/60">
            {row.venue.address}, {row.venue.postalCode} {row.venue.city}
          </p>
          <p className="mt-6 font-mono text-[10px] tracking-[0.2em] text-[var(--ink)]/40 uppercase">
            Show this code at the desk · 1 court
          </p>
        </div>
      </div>
    </main>
  );
}
