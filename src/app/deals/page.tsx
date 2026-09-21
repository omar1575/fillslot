import { CategoryFilters } from "@/components/category-filters";
import { DealTicket, EmptyDeals, toDealTicket } from "@/components/deal-ticket";
import { parseCategory } from "@/lib/constants";
import { getOpenDeals } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = { title: "Deals" };

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const category = parseCategory(query.category);
  const deals = await getOpenDeals(undefined, category);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--ink)]/50">
        Maastricht only
      </p>
      <h1 className="mt-2 font-display text-5xl">Leftover hours and tickets</h1>
      <p className="mt-3 max-w-xl text-[var(--ink)]/70">
        One ticket is one leftover window — a court, chair, room, or lane — or leftover cinema and
        stadium seats. Pay now. Non-refundable unless the venue cancels.
      </p>
      <div className="mt-8">
        <CategoryFilters active={category} />
      </div>
      <div className="mt-10 grid gap-6">
        {deals.length === 0 ? (
          <EmptyDeals
            title="Nothing on the board"
            body="When a venue has hours or tickets that are not filling, they land here at a cut price."
          />
        ) : (
          deals.map((deal) => (
            <DealTicket
              key={deal.slot.id}
              href={`/deals/${deal.slot.id}`}
              deal={toDealTicket(deal)}
            />
          ))
        )}
      </div>
    </main>
  );
}
