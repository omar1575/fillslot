import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { BookButton } from "@/components/book-button";
import { CourtGraphic } from "@/components/court-graphic";
import { DealTicket } from "@/components/deal-ticket";
import { formatEuro, discountPercent } from "@/lib/money";
import { getDealById, isSlotBookable } from "@/lib/queries";
import { formatDateTime } from "@/lib/time";

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

function availabilityCopy(slot: {
  status: string;
  startsAt: Date;
  holdExpiresAt: Date | null;
}, bookable: boolean) {
  const now = new Date();
  if (slot.startsAt <= now) {
    return {
      state: "expired" as const,
      title: "This hour already started",
      body: "Grab another leftover before the next one goes.",
    };
  }
  if (slot.status === "cancelled") {
    return {
      state: "cancelled" as const,
      title: "The club pulled this hour",
      body: "It is no longer for sale on Fillslot.",
    };
  }
  if (slot.status === "booked" || (!bookable && slot.status !== "held")) {
    return {
      state: "taken" as const,
      title: "Someone else just took this slot",
      body: "Pay-before-play means the first completed checkout keeps the court.",
    };
  }
  if (slot.status === "held" && slot.holdExpiresAt && slot.holdExpiresAt > now) {
    return {
      state: "held" as const,
      title: "Someone is paying for this court",
      body: "If they do not finish checkout, this ticket comes back on the board.",
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
  const deal = await getDealById(id);
  if (!deal) notFound();

  const session = await auth();
  const bookable = isSlotBookable(deal.slot);
  const error = typeof query.error === "string" ? query.error : null;
  const cancelled = query.cancelled === "1";
  const off = discountPercent(deal.slot.originalPriceCents, deal.slot.dealPriceCents);
  const availability = availabilityCopy(deal.slot, bookable);
  const ctaLabel = bookable
    ? `Book for ${formatEuro(deal.slot.dealPriceCents)}`
    : availability?.title ?? "No longer available";

  const bookControls = (
    <>
      {error ? <p className="notice-error mb-4">{error}</p> : null}
      {cancelled ? (
        <p className="notice-warn mb-4">Checkout cancelled. The court is still available.</p>
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
        <BookButton slotId={deal.slot.id} label={ctaLabel} disabled={!bookable} />
      )}
    </>
  );

  return (
    <main className="page grid gap-8 pb-28 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:pb-16">
      <div>
        <Link href="/deals" className="kicker text-[var(--ink)]/50">
          ← All leftovers
        </Link>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl">{deal.venue.name}</h1>
        <p className="mt-2 text-base text-[var(--ink)]/70 sm:text-lg">
          {deal.venue.address}, {deal.venue.postalCode} {deal.venue.city}
        </p>
        <div className="mt-8">
          <DealTicket
            deal={{
              id: deal.slot.id,
              venueName: deal.venue.name,
              venueCity: deal.venue.city,
              courtName: deal.court.name,
              startsAt: deal.slot.startsAt,
              endsAt: deal.slot.endsAt,
              originalPriceCents: deal.slot.originalPriceCents,
              dealPriceCents: deal.slot.dealPriceCents,
              status: deal.slot.status,
            }}
          />
        </div>
        <p className="mt-8 max-w-xl text-[var(--ink)]/75">{deal.venue.description}</p>
      </div>

      <aside className="night h-fit p-5 sm:p-6 lg:sticky lg:top-20">
        <CourtGraphic className="mb-6 w-full opacity-90" />
        <p className="kicker text-[var(--ball)]">Pay before you play</p>
        <h2 className="mt-2 font-display text-2xl sm:text-3xl">{formatDateTime(deal.slot.startsAt)}</h2>
        <p className="mt-4 text-sm text-white/70">
          {deal.court.name} · −{off}% vs the usual {formatEuro(deal.slot.originalPriceCents)}
        </p>
        <p className="mt-2 font-display text-4xl">{formatEuro(deal.slot.dealPriceCents)}</p>
        <p className="mt-2 text-sm text-white/55">
          Fillslot keeps 15% as commission. Non-refundable unless the club cancels.
        </p>
        <div className="mt-6 hidden lg:block">{bookControls}</div>
      </aside>

      <div className="book-dock lg:hidden">{bookControls}</div>
    </main>
  );
}
