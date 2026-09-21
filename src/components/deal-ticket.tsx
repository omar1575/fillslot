import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "cn";
import type { ActivityCategory, FillMode } from "@/db/schema";
import { CATEGORY_LABELS, resourceLabel, usesSharedInventory } from "@/lib/constants";
import { discountPercent, formatEuro } from "@/lib/money";
import { formatDate, formatTime, formatTimeRange } from "@/lib/time";
import type { DealRow } from "@/lib/queries";

export type DealTicketData = {
  id: string;
  venueName: string;
  venueCity: string;
  courtName: string;
  category: ActivityCategory;
  remaining: number;
  capacity: number;
  minPartySize: number;
  fillMode: FillMode;
  startsAt: Date;
  endsAt: Date;
  originalPriceCents: number;
  dealPriceCents: number;
  status: string;
};

export function toDealTicket(deal: DealRow): DealTicketData {
  return {
    id: deal.slot.id,
    venueName: deal.venue.name,
    venueCity: deal.venue.city,
    courtName: deal.court.name,
    category: deal.venue.category,
    remaining: deal.remaining,
    capacity: deal.slot.capacity,
    minPartySize: deal.slot.minPartySize,
    fillMode: deal.slot.fillMode,
    startsAt: deal.slot.startsAt,
    endsAt: deal.slot.endsAt,
    originalPriceCents: deal.slot.originalPriceCents,
    dealPriceCents: deal.slot.dealPriceCents,
    status: deal.slot.status,
  };
}

export function DealTicket({
  deal,
  href,
  compact = false,
}: {
  deal: DealTicketData;
  href?: string;
  compact?: boolean;
}) {
  const off = discountPercent(deal.originalPriceCents, deal.dealPriceCents);
  const shared = usesSharedInventory(deal, deal.category);
  const joined = Math.max(0, deal.capacity - deal.remaining);
  const unitLine = shared
    ? deal.fillMode === "exact"
      ? `${joined}/${deal.capacity} people · needs ${deal.capacity}`
      : deal.fillMode === "threshold"
        ? `${joined}/${deal.capacity} joined · min ${deal.minPartySize}`
        : `${deal.remaining} ${resourceLabel(deal.category, deal.remaining)} left`
    : `1 ${resourceLabel(deal.category)}`;
  const inner = (
    <article
      className={cn(
        "ticket group relative grid overflow-hidden bg-[var(--ticket)] text-[var(--ink)] shadow-ticket transition-transform",
        href && "hover:-translate-y-0.5",
        compact
          ? "grid-cols-[80px_1fr] sm:grid-cols-[88px_1fr]"
          : "grid-cols-[92px_1fr] sm:grid-cols-[112px_1fr] md:grid-cols-[128px_1fr]",
      )}
    >
      <div className="relative flex flex-col justify-between bg-[var(--turf)] py-3 pr-3 pl-2.5 text-[var(--cream)] sm:px-4 sm:py-4 sm:pr-5">
        <p className="font-mono text-[9px] tracking-[0.22em] text-[var(--cream)]/70 uppercase sm:text-[10px]">
          {CATEGORY_LABELS[deal.category]}
        </p>
        <p className="font-display text-xl leading-none sm:text-3xl md:text-4xl">
          {formatTime(deal.startsAt)}
        </p>
        <p className="font-mono text-[10px] leading-tight whitespace-nowrap text-[var(--cream)]/80 sm:text-[11px]">
          {formatDate(deal.startsAt)}
        </p>
        <span className="pointer-events-none absolute top-3 -right-2 size-3.5 rounded-full bg-[var(--wall)] sm:size-4" />
        <span className="pointer-events-none absolute bottom-3 -right-2 size-3.5 rounded-full bg-[var(--wall)] sm:size-4" />
        <span className="pointer-events-none absolute inset-y-3 right-0 w-px border-r border-dashed border-[var(--cream)]/35" />
      </div>
      <div className="relative flex flex-col gap-3 px-4 py-4 md:px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] text-[var(--ink)]/55 uppercase">
              {deal.venueCity} surplus
            </p>
            <h3 className="font-display text-xl leading-tight md:text-2xl">{deal.venueName}</h3>
            <p className="mt-1 text-sm text-[var(--ink)]/70">{deal.courtName}</p>
          </div>
          <span className="rotate-6 rounded-sm bg-[var(--ball)] px-2 py-1 font-display text-sm text-[var(--ink)] shadow-[2px_2px_0_var(--ink)]">
            −{off}%
          </span>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3">
          <p className="font-mono text-xs tracking-wide text-[var(--ink)]/55 uppercase">
            {formatTimeRange(deal.startsAt, deal.endsAt)} · {unitLine}
          </p>
          <div className="text-right">
            <p className="font-mono text-xs text-[var(--ink)]/45 line-through">
              {formatEuro(deal.originalPriceCents)}
            </p>
            <p className="font-display text-2xl leading-none">{formatEuro(deal.dealPriceCents)}</p>
          </div>
        </div>
      </div>
    </article>
  );

  if (!href) return inner;
  return (
    <Link href={href} className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ball)]">
      {inner}
    </Link>
  );
}

export function EmptyDeals({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="ticket border border-dashed border-[var(--ink)]/25 bg-[var(--ticket)] px-6 py-14 text-center">
      <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--ink)]/50">
        No leftover hours
      </p>
      <h2 className="mt-2 font-display text-3xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-[var(--ink)]/70">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
