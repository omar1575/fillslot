import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { startConnectOnboarding } from "@/app/actions/connect";
import { cancelSlotAction, refundBookingAction } from "@/app/actions/slots";
import { EmptyDeals } from "@/components/deal-ticket";
import { formatEuro } from "@/lib/money";
import { getClubDashboard, getVenueForOwner } from "@/lib/queries";
import {
  CATEGORY_LABELS,
  isTicketCategory,
  resourceLabel,
} from "@/lib/constants";
import { isStripeConfigured } from "@/lib/env";
import { isConnectReady, syncConnectAccount } from "@/lib/connect";
import { formatDate, formatTimeRange } from "@/lib/time";
import { ClubGroupSection } from "@/components/group/club-group-section";
import { VenueApplyForm } from "@/components/group/venue-apply-form";

export const metadata = { title: "Club" };

export default async function ClubPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/club");
  if (session.user.role !== "club" && session.user.role !== "admin") {
    redirect("/");
  }

  const query = await searchParams;
  const venue = await getVenueForOwner(session.user.id);
  if (!venue) {
    return (
      <main className="page max-w-lg">
        <p className="kicker text-[var(--ink)]/50">Partner</p>
        <h1 className="mt-2 font-display text-5xl">Create your venue</h1>
        <p className="mt-3 text-[var(--ink)]/70">
          Add name, activity, and location. You can list leftover hours after that, with usual and
          discounted prices plus min and full capacity.
        </p>
        <div className="mt-8">
          <VenueApplyForm nextHref="/club" />
        </div>
      </main>
    );
  }

  if (query.connect === "return" && venue.stripeAccountId) {
    await syncConnectAccount(venue.stripeAccountId);
  }

  const dashboard = await getClubDashboard(venue.id);
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
          <Link href="/club/slots/new" className="btn-ball w-fit">
            List a leftover {ticketed ? resourceLabel(venue.category, 2) : "hour"}
          </Link>
          <Link href="/partner/activity" className="btn-ghost w-fit">
            Add group activity
          </Link>
        </div>
      </div>

      {error ? <p className="notice-error mt-6">{error}</p> : null}

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
                          {ticketed
                            ? `${remaining} left${expired ? " · expired" : slot.status === "cancelled" ? " · closed" : ""}`
                            : expired
                              ? "expired"
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
