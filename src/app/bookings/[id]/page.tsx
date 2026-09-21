import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { formatEuro } from "@/lib/money";
import { getBookingWithDetails } from "@/lib/queries";
import { formatDateTime, formatTimeRange } from "@/lib/time";
import { resourceLabel } from "@/lib/constants";

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
    <main className="mx-auto w-full max-w-xl px-4 py-16 sm:px-6">
      <Link href="/bookings" className="font-mono text-xs tracking-[0.16em] uppercase text-[var(--ink)]/50">
        ← Bookings
      </Link>
      <div className="ticket mt-6 bg-[var(--ticket)] p-8 text-center shadow-[8px_10px_0_var(--ink)]">
        <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--ink)]/50">
          Check-in code
        </p>
        <p className="mt-4 font-display text-6xl tracking-[0.18em]">{row.booking.code}</p>
        <h1 className="mt-6 font-display text-3xl">{row.venue.name}</h1>
        <p className="mt-2 text-[var(--ink)]/70">{row.court.name}</p>
        {row.booking.quantity > 1 ? (
          <p className="mt-1 text-sm text-[var(--ink)]/60">
            {row.booking.quantity} leftover {resourceLabel(row.venue.category, row.booking.quantity)}
          </p>
        ) : null}
        <p className="mt-4 font-mono">
          {formatDateTime(row.slot.startsAt)} · {formatTimeRange(row.slot.startsAt, row.slot.endsAt)}
        </p>
        <p className="mt-6 text-sm">
          Paid {formatEuro(row.booking.grossCents)} · {row.booking.status}
        </p>
        <p className="mt-2 text-sm text-[var(--ink)]/60">
          {row.venue.address}, {row.venue.postalCode} {row.venue.city}
        </p>
      </div>
    </main>
  );
}
