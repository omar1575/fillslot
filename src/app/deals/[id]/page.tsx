import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { ActivityGraphic } from "@/components/activity-graphic";
import { BookForm } from "@/components/book-form";
import { DealTicket, toDealTicket } from "@/components/deal-ticket";
import { isTicketCategory, leftoverDescription, resourceLabel } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/env";
import { formatEuro, discountPercent } from "@/lib/money";
import { getDealById, isDealBookable } from "@/lib/queries";
import { formatDateTime } from "@/lib/time";
import { SetupNeeded } from "@/components/setup-needed";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isSupabaseConfigured()) return { title: "Deal" };
  const deal = await getDealById(id);
  if (!deal) return { title: "Deal" };
  return { title: `${deal.venue.name} · ${deal.court.name}` };
}

export default async function DealPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  if (!isSupabaseConfigured()) return <SetupNeeded />;
  const deal = await getDealById(id);
  if (!deal) notFound();

  const session = await auth();
  const bookable = isDealBookable(deal);
  const error = typeof query.error === "string" ? query.error : null;
  const cancelled = query.cancelled === "1";
  const off = discountPercent(deal.slot.originalPriceCents, deal.slot.dealPriceCents);
  const ticketed = isTicketCategory(deal.venue.category);

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr] sm:px-6">
      <div>
        <Link href="/deals" className="font-mono text-xs tracking-[0.16em] uppercase text-[var(--ink)]/50">
          ← All leftovers
        </Link>
        <h1 className="mt-4 font-display text-5xl">{deal.venue.name}</h1>
        <p className="mt-2 text-lg text-[var(--ink)]/70">
          {deal.venue.address}, {deal.venue.postalCode} {deal.venue.city}
        </p>
        <div className="mt-8">
          <DealTicket deal={toDealTicket(deal)} />
        </div>
        <p className="mt-8 max-w-xl text-[var(--ink)]/75">{deal.venue.description}</p>
      </div>

      <aside className="h-fit bg-[var(--ink)] p-6 text-[var(--ticket)]">
        <ActivityGraphic category={deal.venue.category} className="mb-6 w-full opacity-90" />
        <p className="font-mono text-[11px] tracking-[0.2em] text-[var(--ball)] uppercase">
          Pay before you go
        </p>
        <h2 className="mt-2 font-display text-3xl">{formatDateTime(deal.slot.startsAt)}</h2>
        <p className="mt-4 text-sm text-white/70">
          {deal.court.name} · −{off}% vs the usual {formatEuro(deal.slot.originalPriceCents)}
          {ticketed ? ` per ${resourceLabel(deal.venue.category)}` : ""}
        </p>
        <p className="mt-2 font-display text-4xl">{formatEuro(deal.slot.dealPriceCents)}</p>
        <p className="mt-2 text-sm text-white/55">
          Fillslot keeps 15% as commission. {leftoverDescription(deal.venue.category)} unless the
          venue cancels.
        </p>
        {error ? <p className="mt-4 bg-[#c7342b] px-3 py-2 text-sm text-white">{error}</p> : null}
        {cancelled ? (
          <p className="mt-4 bg-white/10 px-3 py-2 text-sm">
            Checkout cancelled. The leftover is still available.
          </p>
        ) : null}
        <div className="mt-6">
          {!session ? (
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(`/deals/${deal.slot.id}`)}`}
              className="flex h-12 items-center justify-center bg-[var(--ball)] font-display text-lg text-[var(--ink)]"
            >
              Sign in to book
            </Link>
          ) : (
            <BookForm
              slotId={deal.slot.id}
              category={deal.venue.category}
              unitPriceCents={deal.slot.dealPriceCents}
              remaining={deal.remaining}
              disabled={!bookable}
            />
          )}
        </div>
      </aside>
    </main>
  );
}
