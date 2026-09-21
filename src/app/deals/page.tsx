import { DealTicket, EmptyDeals } from "@/components/deal-ticket";
import { getOpenDeals } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = { title: "Deals" };

export default async function DealsPage() {
  const deals = await getOpenDeals();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--ink)]/50">
        Maastricht only
      </p>
      <h1 className="mt-2 font-display text-5xl">Leftover court time</h1>
      <p className="mt-3 max-w-xl text-[var(--ink)]/70">
        One ticket is one court for the window printed on it. Pay now. Non-refundable unless the club cancels.
      </p>
      <div className="mt-10 grid gap-6">
        {deals.length === 0 ? (
          <EmptyDeals
            title="Nothing on the board"
            body="When a club has hours that are not filling, they land here at a cut price."
          />
        ) : (
          deals.map(({ slot, court, venue }) => (
            <DealTicket
              key={slot.id}
              href={`/deals/${slot.id}`}
              deal={{
                id: slot.id,
                venueName: venue.name,
                venueCity: venue.city,
                courtName: court.name,
                startsAt: slot.startsAt,
                endsAt: slot.endsAt,
                originalPriceCents: slot.originalPriceCents,
                dealPriceCents: slot.dealPriceCents,
                status: slot.status,
              }}
            />
          ))
        )}
      </div>
    </main>
  );
}
