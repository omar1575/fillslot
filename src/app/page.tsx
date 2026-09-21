import Link from "next/link";
import { CourtGraphic } from "@/components/court-graphic";
import { DealTicket, EmptyDeals } from "@/components/deal-ticket";
import { getOpenDeals } from "@/lib/queries";

export default async function HomePage() {
  const deals = await getOpenDeals();
  const featured = deals.slice(0, 3);

  return (
    <main>
      <section className="relative overflow-hidden bg-[var(--ink)] text-[var(--ticket)]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <p className="font-mono text-[11px] tracking-[0.28em] text-[var(--ball)] uppercase">
              Maastricht · padel first
            </p>
            <h1 className="mt-4 max-w-xl font-display text-5xl leading-[0.92] text-white sm:text-7xl">
              Empty courts.
              <span className="block text-[var(--ball)]">Cheaper hours.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-white/75">
              Clubs dump leftover padel time onto Fillslot instead of letting it sit.
              You book and pay before you play. They take a smaller fee than an empty court.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/deals"
                className="bg-[var(--ball)] px-5 py-3 font-display text-[var(--ink)] shadow-[4px_4px_0_#d4f34a]/0"
              >
                See today&apos;s leftovers
              </Link>
              <Link href="/club" className="border border-white/30 px-5 py-3 text-white">
                List empty hours
              </Link>
            </div>
          </div>
          <CourtGraphic className="w-full drop-shadow-[12px_16px_0_#d4f34a]" />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--ink)]/50">
              Open now
            </p>
            <h2 className="font-display text-4xl">Maastricht surplus</h2>
          </div>
          <Link href="/deals" className="text-sm font-medium text-[var(--turf)]">
            All deals
          </Link>
        </div>
        {featured.length === 0 ? (
          <EmptyDeals
            title="No leftover courts right now"
            body="Clubs usually dump weekday afternoons. Check back, or ask your club to list the hours that never fill."
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-1">
            {featured.map(({ slot, court, venue }) => (
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
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
