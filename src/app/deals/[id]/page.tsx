import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { ActivityGraphic } from "@/components/activity-graphic";
import { BookForm } from "@/components/book-form";
import { DealTicket, toDealTicket } from "@/components/deal-ticket";
import { isTicketCategory, leftoverDescription, resourceLabel } from "@/lib/constants";
import { formatEuro, discountPercent } from "@/lib/money";
import { getDealById, isDealBookable } from "@/lib/queries";
import { formatDateTime } from "@/lib/time";
import { bounceVendorToDesk } from "@/lib/audience";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = await getDealById(id);
  if (!deal) return { title: "Deal" };
  return { title: `${deal.venue.name} · ${deal.court.name}` };
}

function availabilityCopy(
  slot: { status: string; startsAt: Date; holdExpiresAt: Date | null },
  bookable: boolean,
) {
  const now = new Date();
  if (slot.startsAt <= now) {
    return {
      title: "This leftover already started",
      body: "Grab another one before the next window goes.",
    };
  }
  if (slot.status === "cancelled") {
    return {
      title: "The venue pulled this leftover",
      body: "It is no longer for sale on Fillslot.",
    };
  }
  if (slot.status === "booked" || (!bookable && slot.status !== "held")) {
    return {
      title: "Someone else just took this slot",
      body: "Pay-before-play means the first completed checkout keeps it.",
    };
  }
  if (slot.status === "held" && slot.holdExpiresAt && slot.holdExpiresAt > now) {
    return {
      title: "Someone is paying for this leftover",
      body: "If they do not finish checkout, it comes back on the board.",
    };
  }
  return null;
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
  await bounceVendorToDesk();
  const deal = await getDealById(id);
  if (!deal) notFound();

  const session = await auth();
  const bookable = isDealBookable(deal);
  const error = typeof query.error === "string" ? query.error : null;
  const cancelled = query.cancelled === "1";
  const off = discountPercent(deal.slot.originalPriceCents, deal.slot.dealPriceCents);
  const ticketed = isTicketCategory(deal.venue.category);
  const availability = availabilityCopy(deal.slot, bookable);

  const bookControls = (
    <>
      {error ? <p className="notice-error mb-4">{error}</p> : null}
      {cancelled ? (
        <p className="notice-warn mb-4">Checkout cancelled. The leftover is still available.</p>
      ) : null}
      {availability && !bookable ? (
        <p className="notice-error mb-4">
          {availability.title}. {availability.body}
        </p>
      ) : null}
      {!session ? (
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(`/deals/${deal.slot.id}`)}`}
          className="btn-ball h-12 w-full text-lg"
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
    </>
  );

  return (
    <main className="page grid gap-8 pb-28 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:pb-16">
      <div>
        <Link href="/deals" className="font-mono text-xs tracking-[0.16em] uppercase text-[var(--ink)]/50">
          ← All leftovers
        </Link>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl">{deal.venue.name}</h1>
        <p className="mt-2 text-base text-[var(--ink)]/70 sm:text-lg">
          {deal.venue.address}, {deal.venue.postalCode} {deal.venue.city}
        </p>
        <div className="mt-8">
          <DealTicket deal={toDealTicket(deal)} />
        </div>
        <p className="mt-8 max-w-xl text-[var(--ink)]/75">{deal.venue.description}</p>
      </div>

      <aside className="night h-fit p-5 sm:p-6 lg:sticky lg:top-20">
        <ActivityGraphic category={deal.venue.category} className="mb-6 w-full opacity-90" />
        <p className="font-mono text-[11px] tracking-[0.2em] text-[var(--ball)] uppercase">
          Pay before you go
        </p>
        <h2 className="mt-2 font-display text-2xl sm:text-3xl">{formatDateTime(deal.slot.startsAt)}</h2>
        <p className="mt-4 text-sm text-[var(--cream)]/70">
          {deal.court.name} · −{off}% vs the usual {formatEuro(deal.slot.originalPriceCents)}
          {ticketed ? ` per ${resourceLabel(deal.venue.category)}` : ""}
        </p>
        <p className="mt-2 font-display text-4xl">{formatEuro(deal.slot.dealPriceCents)}</p>
        <p className="mt-2 text-sm text-[var(--cream)]/60">
          Fillslot keeps 15% as commission. {leftoverDescription(deal.venue.category)} unless the
          venue cancels.
        </p>
        <div className="mt-6 hidden lg:block">{bookControls}</div>
      </aside>

      <div className="book-dock lg:hidden">{bookControls}</div>
    </main>
  );
}
