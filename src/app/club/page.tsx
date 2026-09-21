import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { startConnectOnboarding } from "@/app/actions/connect";
import { cancelSlotAction, refundBookingAction } from "@/app/actions/slots";
import { EmptyDeals } from "@/components/deal-ticket";
import { formatEuro } from "@/lib/money";
import { getClubDashboard, getVenueForOwner } from "@/lib/queries";
import { isStripeConfigured } from "@/lib/env";
import { isConnectReady, syncConnectAccount } from "@/lib/connect";
import { formatDate, formatTimeRange } from "@/lib/time";

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
      <main className="page max-w-3xl">
        <h1 className="font-display text-4xl">No club attached</h1>
        <p className="mt-3 text-[var(--ink)]/70">
          This account is a club role without a venue. Seed Plaza Padel or ask an admin to attach one.
        </p>
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

  return (
    <main className="page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="kicker text-[var(--ink)]/50">Club desk</p>
          <h1 className="font-display text-4xl sm:text-5xl">{venue.name}</h1>
          <p className="mt-2 text-[var(--ink)]/70">
            Commission {venue.commissionBps / 100}% · {venue.city}
          </p>
        </div>
        <Link href="/club/slots/new" className="btn-ball w-fit">
          List a leftover hour
        </Link>
      </div>

      {error ? <p className="notice-error mt-6">{error}</p> : null}

      <section className="ticket mt-8 bg-[var(--ticket)] p-5 shadow-ticket">
        <h2 className="font-display text-2xl">Payouts</h2>
        {payoutReady ? (
          <p className="mt-2 text-sm text-[var(--ink)]/70">
            Stripe Connect is live. New bookings split the 15% commission automatically.
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-sm text-[var(--ink)]/70">
              Until Connect is finished, Fillslot collects the full amount and marks club payout as pending.
            </p>
            {isStripeConfigured() ? (
              <form action={startConnectOnboarding}>
                <button type="submit" className="btn-ink">
                  Set up Stripe Connect
                </button>
              </form>
            ) : (
              <p className="kicker text-[var(--ink)]/45">Stripe keys not set · local demo</p>
            )}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-3xl">Slots</h2>
        {dashboard.slots.length === 0 ? (
          <div className="mt-4">
            <EmptyDeals
              title="No surplus listed"
              body="Dump the hours that never fill — weekday afternoons are the usual leftovers."
              action={
                <Link href="/club/slots/new" className="btn-ink">
                  New slot
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-3 md:hidden">
              {dashboard.slots.map(({ slot, court, booking, player }) => {
                const status =
                  slot.startsAt < now && slot.status === "open" ? "expired" : slot.status;
                return (
                  <article key={slot.id} className="ticket bg-[var(--ticket)] p-4">
                    <p className="kicker text-[var(--ink)]/45">{status}</p>
                    <p className="font-display text-lg">{court.name}</p>
                    <p className="text-sm text-[var(--ink)]/70">
                      {formatDate(slot.startsAt)} · {formatTimeRange(slot.startsAt, slot.endsAt)}
                    </p>
                    <p className="mt-2 font-mono text-sm">
                      <span className="line-through opacity-45">{formatEuro(slot.originalPriceCents)}</span>{" "}
                      {formatEuro(slot.dealPriceCents)}
                    </p>
                    <p className="mt-2 text-sm">
                      {booking
                        ? `${player?.name ?? player?.email} · ${booking.code}${booking.payoutPending ? " · payout pending" : ""} · fee ${formatEuro(booking.commissionCents)}`
                        : "No player yet"}
                    </p>
                    <div className="mt-3">
                      {booking && booking.status === "paid" ? (
                        <form action={refundBookingAction}>
                          <input type="hidden" name="bookingId" value={booking.id} />
                          <button className="text-sm text-[var(--turf)] underline">Refund player</button>
                        </form>
                      ) : (slot.status === "open" || slot.status === "held") && slot.startsAt > now ? (
                        <form action={cancelSlotAction}>
                          <input type="hidden" name="slotId" value={slot.id} />
                          <button className="text-sm text-[var(--turf)] underline">Cancel slot</button>
                        </form>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="kicker text-[var(--ink)]/50">
                  <tr>
                    <th className="py-2 pr-3">When</th>
                    <th className="pr-3">Court</th>
                    <th className="pr-3">Price</th>
                    <th className="pr-3">Status</th>
                    <th className="pr-3">Player</th>
                    <th className="pr-3">Fee</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {dashboard.slots.map(({ slot, court, booking, player }) => (
                    <tr key={slot.id} className="border-t border-[var(--ink)]/10 bg-[var(--ticket)]/70">
                      <td className="py-3 pr-3 whitespace-nowrap">
                        {formatDate(slot.startsAt)} · {formatTimeRange(slot.startsAt, slot.endsAt)}
                      </td>
                      <td className="pr-3">{court.name}</td>
                      <td className="pr-3 whitespace-nowrap">
                        <span className="line-through opacity-45">{formatEuro(slot.originalPriceCents)}</span>{" "}
                        {formatEuro(slot.dealPriceCents)}
                      </td>
                      <td className="pr-3 uppercase">
                        {slot.startsAt < now && slot.status === "open" ? "expired" : slot.status}
                      </td>
                      <td className="pr-3">
                        {booking ? (
                          <span>
                            {player?.name ?? player?.email} · {booking.code}
                            {booking.payoutPending ? " · payout pending" : ""}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="pr-3">
                        {booking ? formatEuro(booking.commissionCents) : "—"}
                      </td>
                      <td className="text-right">
                        {booking && booking.status === "paid" ? (
                          <form action={refundBookingAction}>
                            <input type="hidden" name="bookingId" value={booking.id} />
                            <button className="text-[var(--turf)] underline">Refund</button>
                          </form>
                        ) : (slot.status === "open" || slot.status === "held") &&
                          slot.startsAt > now ? (
                          <form action={cancelSlotAction}>
                            <input type="hidden" name="slotId" value={slot.id} />
                            <button className="text-[var(--turf)] underline">Cancel</button>
                          </form>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
