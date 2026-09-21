import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "cn";
import { discountPercent, formatEuro } from "@/lib/money";
import { formatDate, formatTime, formatTimeRange } from "@/lib/time";

export type DealTicketData = {
  id: string;
  venueName: string;
  venueCity: string;
  courtName: string;
  startsAt: Date;
  endsAt: Date;
  originalPriceCents: number;
  dealPriceCents: number;
  status: string;
};

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
      <div className="relative flex flex-col justify-between bg-[var(--turf)] py-3 pr-3 pl-2.5 text-[var(--ball)] sm:px-4 sm:py-4 sm:pr-5">
        <p className="kicker text-[9px] text-white/70 sm:text-[10px]">Court</p>
        <p className="font-display text-xl leading-none sm:text-3xl md:text-4xl">
          {formatTime(deal.startsAt)}
        </p>
        <p className="font-mono text-[10px] leading-tight whitespace-nowrap text-white/80 sm:text-[11px]">
          {formatDate(deal.startsAt)}
        </p>
        <span className="pointer-events-none absolute top-3 -right-2 size-3.5 rounded-full bg-[var(--wall)] sm:size-4" />
        <span className="pointer-events-none absolute bottom-3 -right-2 size-3.5 rounded-full bg-[var(--wall)] sm:size-4" />
        <span className="pointer-events-none absolute inset-y-3 right-0 w-px border-r border-dashed border-white/35" />
      </div>
      <div className="relative flex flex-col gap-2 px-3 py-3 sm:gap-3 sm:px-5 sm:py-4">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0">
            <p className="kicker text-[var(--ink)]/50">{deal.venueCity} surplus</p>
            <h3 className="font-display text-lg leading-tight sm:text-xl md:text-2xl">
              {deal.venueName}
            </h3>
            <p className="mt-0.5 truncate text-sm text-[var(--ink)]/70">{deal.courtName}</p>
          </div>
          <span className="shrink-0 rotate-6 bg-[var(--ball)] px-2 py-1 font-display text-xs text-[var(--ink)] shadow-[2px_2px_0_var(--ink)] sm:text-sm">
            −{off}%
          </span>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3">
          <p className="font-mono text-[10px] tracking-wide text-[var(--ink)]/55 uppercase sm:text-xs">
            {formatTimeRange(deal.startsAt, deal.endsAt)} · 1 court
          </p>
          <div className="text-right">
            <p className="font-mono text-xs text-[var(--ink)]/45 line-through">
              {formatEuro(deal.originalPriceCents)}
            </p>
            <p className="font-display text-xl leading-none sm:text-2xl">
              {formatEuro(deal.dealPriceCents)}
            </p>
          </div>
        </div>
      </div>
    </article>
  );

  if (!href) return inner;
  return (
    <Link
      href={href}
      className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ball)]"
    >
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
      <p className="kicker text-[var(--ink)]/50">No leftover hours</p>
      <h2 className="mt-2 font-display text-3xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-[var(--ink)]/70">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
