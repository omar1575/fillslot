import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CategoryCollage } from "@/components/activity-graphic";
import { CategoryFilters } from "@/components/category-filters";
import { DealTicket, EmptyDeals, toDealTicket } from "@/components/deal-ticket";
import { parseCategory } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/env";
import { getOpenDeals } from "@/lib/queries";
import { SetupNeeded } from "@/components/setup-needed";
import { isVendorRole } from "@/lib/audience";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (isVendorRole(session?.user?.role)) redirect("/club");

  const query = await searchParams;
  const category = parseCategory(query.category);
  if (!isSupabaseConfigured()) return <SetupNeeded />;
  const deals = await getOpenDeals(undefined, category);
  const featured = deals.slice(0, 3);

  return (
    <main>
      <section className="night relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <p className="font-mono text-[11px] tracking-[0.28em] text-[var(--ball)] uppercase">
              Maastricht · leftover hours and tickets
            </p>
            <h1 className="mt-4 max-w-xl font-display text-5xl leading-[0.92] text-[var(--cream)] sm:text-7xl">
              Empty slots.
              <span className="block text-[var(--ball)]">Cheaper hours.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-[var(--cream)]/75">
              Venues dump leftover padel courts, chairs, rooms, lanes, cinema seats, and stadium
              tickets onto Fillslot. You pay before you go. They take a smaller fee than an empty hour.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {session ? (
                <Link href="/plans" className="btn-ball">
                  Join a plan
                </Link>
              ) : (
                <Link href="/login" className="btn-ball">
                  Sign in
                </Link>
              )}
              <Link href="/deals" className="btn-ghost">
                See leftovers
              </Link>
            </div>
          </div>
          <CategoryCollage className="w-full shadow-ball" />
        </div>
      </section>

      <section className="page !py-12 sm:!py-16">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
        <CategoryFilters active={category} basePath="/" />
        <div className="mt-8">
          {featured.length === 0 ? (
            <EmptyDeals
              title="No leftovers right now"
              body="Venues usually dump weekday afternoons and unsold tickets. Check back, or ask yours to list the hours that never fill."
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-1">
              {featured.map((deal) => (
                <DealTicket
                  key={deal.slot.id}
                  href={`/deals/${deal.slot.id}`}
                  deal={toDealTicket(deal)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
