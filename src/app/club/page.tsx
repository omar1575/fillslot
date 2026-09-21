import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { startConnectOnboarding } from "@/app/actions/connect";
import { cancelSlotAction, refundBookingAction } from "@/app/actions/slots";
import { EmptyDeals } from "@/components/deal-ticket";
import { ClubGroupSection } from "@/components/group/club-group-section";
import { formatEuro } from "@/lib/money";
import { getClubDashboard, getVenueForOwner, getWeeklyWindowsForVenue } from "@/lib/queries";
import {
  CATEGORY_LABELS,
  isTicketCategory,
  resourceLabel,
  WEEKDAYS,
} from "@/lib/constants";
import { fillRuleCopy } from "@/lib/fill-rules";
import { isStripeConfigured } from "@/lib/env";
import { isConnectReady, syncConnectAccount } from "@/lib/connect";
import { formatClock, formatDate, formatTimeRange } from "@/lib/time";

export const metadata = { title: "Club" };

export default async function ClubPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/club");
  if (session.user.role !== "club" && session.user.role !== "admin") {
    redirect("/club/onboarding");
  }

  const query = await searchParams;
  const venue = await getVenueForOwner(session.user.id);
  if (!venue) {
    redirect("/club/onboarding");
  }

  if (query.connect === "return" && venue.stripeAccountId) {
    await syncConnectAccount(venue.stripeAccountId);
  }

  const dashboard = await getClubDashboard(venue.id);
  const schedule = await getWeeklyWindowsForVenue(venue.id);
  const error = typeof query.error === "string" ? query.error : null;
  const payoutReady = isConnectReady(venue);
  const now = new Date();
  const ticketed = isTicketCategory(venue.category);
  const unit = resourceLabel(venue.category);

  return (
    <main className="page">
      <div id="locations" className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--ink)]/50">
            {CATEGORY_LABELS[venue.category]} desk
          </p>
          <h1 className="font-display text-5xl">{venue.name}</h1>
          <p className="mt-2 text-[var(--ink)]/70">
            Commission {venue.commissionBps / 100}% · {venue.city}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/club/onboarding"
            className="w-fit border border-[var(--ink)]/20 px-4 py-2 text-sm"
          >
            Edit leftover week
          </Link>
          <Link href="/club/slots/new" className="btn-ball w-fit">
            List a leftover {ticketed ? resourceLabel(venue.category, 2) : "hour"}
          </Link>
          <Link href="/partner/activity" className="btn-ghost w-fit">
            Add group activity
          </Link>
        </div>
      </div>

      {error ? <p className="notice-error mt-6">{error}</p> : null}

      {venue.status === "pending" ? (
        <p className="mt-6 bg-[var(--ball)] px-3 py-2 text-sm text-[var(--ink)]">
          This venue is waiting on Fillslot approval. The leftover week is saved; it goes public once
          an admin approves it.
        </p>
      ) : null}

      <section className="mt-8 bg-white p-5 ring-1 ring-[var(--ink)]/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Leftover week</h2>
            <p className="mt-1 max-w-xl text-sm text-[var(--ink)]/65">{venue.description}</p>
          </div>
        </div>
        {schedule.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--ink)]/60">
            No weekly leftover windows yet.{" "}
            <Link href="/club/onboarding" className="underline">
              Set the week
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--ink)]/10">
            {schedule.map((window) => {
              const day = WEEKDAYS.find((item) => item.id === window.weekday)?.label ?? "Day";
              return (
                <li key={window.id} className="py-3 text-sm">
                  <p className="font-medium">
                    {day} {formatClock(window.startMinute)}–{formatClock(window.endMinute)} ·{" "}
                    {window.sessionMinutes} min sessions
                  </p>
                  <p className="mt-1 text-[var(--ink)]/60">
                    <span className="line-through opacity-50">
                      {formatEuro(window.originalPriceCents)}
                    </span>{" "}
                    {formatEuro(window.dealPriceCents)} · {fillRuleCopy(window)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="ticket mt-8 bg-[var(--ticket)] p-5 shadow-ticket">
        <h2 className="font-display text-2xl">Payouts</h2>
        {payoutReady ? (
          <p className="mt-2 text-sm text-[var(--ink)]/70">
            Stripe Connect is live. New bookings split commission automatically.
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-sm text-[var(--ink)]/70">
              Until Connect is finished, Fillslot collects the full amount and marks venue payout as
              pending.
            </p>
            {isStripeConfigured() ? (
              <form action={startConnectOnboarding}>
                <button type="submit" className="btn-ink">
                  Set up Stripe Connect
                </button>
              </form>
            ) : (
              <p className="font-mono text-xs uppercase">Stripe keys not set · local demo</p>
            )}
          </div>
        )}
      </section>

      <section id="availabilities" className="mt-10">
        <h2 className="font-display text-3xl">Availabilities</h2>
        {dashboard.slots.length === 0 ? (
          <div className="mt-4">
            <EmptyDeals
              title="No surplus listed"
              body="Dump the hours or tickets that never fill — weekday afternoons are the usual leftovers."
              action={
                <Link href="/club/slots/new" className="bg-[var(--ink)] px-4 py-2 text-[var(--ball)]">
                  New slot
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--ink)]/50">
                <tr>
                  <th className="py-2">When</th>
                  <th className="capitalize">{unit}</th>
                  <th>Price</th>
                  <th>People</th>
                  <th>Guests</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {dashboard.slots.map(({ slot, court, bookings, remaining, sold }) => {
                  const paid = bookings.filter(
                    (row) => row.booking.status === "paid" || row.booking.status === "completed",
                  );
                  const expired = slot.startsAt < now && slot.status === "open";
                  const fillNote =
                    slot.fillState !== "collecting" ? ` · ${slot.fillState}` : "";
                  return (
                    <tr key={slot.id} className="border-t border-[var(--ink)]/10 align-top">
                      <td className="py-3">
                        {formatDate(slot.startsAt)} · {formatTimeRange(slot.startsAt, slot.endsAt)}
                      </td>
                      <td>{court.name}</td>
                      <td>
                        <span className="line-through opacity-45">
                          {formatEuro(slot.originalPriceCents)}
                        </span>{" "}
                        {formatEuro(slot.dealPriceCents)}
                        {ticketed ? " each" : ""}
                      </td>
                      <td>
                        <span className="font-mono text-xs tracking-wide uppercase">
                          {sold} signed in · max {slot.capacity}
                        </span>
                        <span className="mt-1 block text-[var(--ink)]/55">
                          {ticketed || slot.capacity > 1
                            ? `${remaining} left${expired ? " · expired" : slot.status === "cancelled" ? " · closed" : ""}${fillNote}`
                            : expired
                              ? "expired"
                              : slot.fillState !== "collecting"
                                ? `${slot.status} · ${slot.fillState}`
                                : slot.status}
                        </span>
                      </td>
                      <td>
                        {paid.length === 0 ? (
                          "—"
                        ) : (
                          <ul className="space-y-1">
                            {paid.map(({ booking, player }) => (
                              <li key={booking.id}>
                                {player?.name ?? player?.email} · {booking.code}
                                {booking.quantity > 1 ? ` · ×${booking.quantity}` : ""}
                                {booking.payoutPending ? " · payout pending" : ""}
                                <form action={refundBookingAction} className="inline">
                                  <input type="hidden" name="bookingId" value={booking.id} />
                                  <button className="ml-2 text-[var(--turf)] underline">Refund</button>
                                </form>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="text-right">
                        {(slot.status === "open" || slot.status === "held") && slot.startsAt > now ? (
                          <form action={cancelSlotAction}>
                            <input type="hidden" name="slotId" value={slot.id} />
                            <button className="text-[var(--turf)] underline">
                              {ticketed ? "Close leftovers" : "Cancel"}
                            </button>
                          </form>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <ClubGroupSection venueName={venue.name} />
    </main>
  );
}
