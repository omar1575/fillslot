import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "cn";
import { discountPercent, formatEuro } from "@/lib/money";
import { formatDate, formatTimeRange } from "@/lib/time";

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
        "ticket group relative grid overflow-hidden bg-[var(--ticket)] text-[var(--ink)] shadow-[6px_8px_0_var(--ink)] transition-transform",
        href && "hover:-translate-y-0.5",
        compact ? "grid-cols-[88px_1fr]" : "grid-cols-[108px_1fr] md:grid-cols-[124px_1fr]",
      )}
    >
      <div className="relative flex flex-col justify-between border-r border-dashed border-[var(--ink)]/25 bg-[var(--turf)] px-4 py-4 text-[var(--ball)]">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase">Court</p>
        <p className="font-display text-3xl leading-none md:text-4xl">
          {formatTimeRange(deal.startsAt, deal.endsAt).slice(0, 5)}
        </p>
        <p className="font-mono text-[11px] text-white/80">{formatDate(deal.startsAt)}</p>
        <span className="pointer-events-none absolute top-1/2 -right-2 size-4 -translate-y-1/2 rounded-full bg-[var(--wall)]" />
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
            {formatTimeRange(deal.startsAt, deal.endsAt)} · 1 court
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
    <div className="border border-dashed border-[var(--ink)]/20 bg-white/50 px-6 py-14 text-center">
      <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--ink)]/50">
        No leftover hours
      </p>
      <h2 className="mt-2 font-display text-3xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-[var(--ink)]/70">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
