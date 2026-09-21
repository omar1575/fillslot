"use client";

import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/constants";
import { discountPercent, formatEuro } from "@/lib/money";
import { formatDate, formatTime, formatTimeRange } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { PlanView } from "@/lib/group-plan";

export function occupancyLine(plan: PlanView) {
  if (plan.phase === "confirmed") return `${plan.held} going · group filled`;
  if (plan.phase === "released" || plan.phase === "expired") return "Hold released";
  if (plan.held === 0) return `Open · needs ${plan.minCapacity}`;
  if (plan.spotsNeeded > 0) {
    return `${plan.held} holding · ${plan.spotsNeeded} short of ${plan.minCapacity}`;
  }
  return `${plan.held}/${plan.fullCapacity} holding`;
}

export function PlanTicket({
  plan,
  href,
  compact = false,
}: {
  plan: PlanView;
  href?: string;
  compact?: boolean;
}) {
  const off = discountPercent(plan.originalPriceCents, plan.dealPriceCents);
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
      <div className="relative flex flex-col justify-between bg-[var(--turf)] py-3 pr-3 pl-2.5 text-[var(--ink)] sm:px-4 sm:py-4 sm:pr-5">
        <p className="font-mono text-[9px] tracking-[0.22em] text-[var(--ink)]/70 uppercase sm:text-[10px]">
          {CATEGORY_LABELS[plan.category]}
        </p>
        <p className="font-display text-xl leading-none sm:text-3xl md:text-4xl">
          {formatTime(plan.startsAtDate)}
        </p>
        <p className="font-mono text-[10px] leading-tight whitespace-nowrap text-[var(--ink)]/80 sm:text-[11px]">
          {formatDate(plan.startsAtDate)}
        </p>
        <span className="pointer-events-none absolute top-3 -right-2 size-3.5 rounded-full bg-[var(--wall)] sm:size-4" />
        <span className="pointer-events-none absolute bottom-3 -right-2 size-3.5 rounded-full bg-[var(--wall)] sm:size-4" />
        <span className="pointer-events-none absolute inset-y-3 right-0 w-px border-r border-dashed border-[var(--ink)]/25" />
      </div>
      <div className="relative flex flex-col gap-3 px-4 py-4 md:px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] text-[var(--ink)]/55 uppercase">
              {plan.city} · {plan.title}
            </p>
            <h3 className="font-display text-xl leading-tight md:text-2xl">{plan.venueName}</h3>
            <p className="mt-1 text-sm text-[var(--ink)]/70">{occupancyLine(plan)}</p>
          </div>
          <span className="rotate-6 rounded-sm bg-[var(--ball)] px-2 py-1 font-display text-sm text-[var(--ink)] shadow-[2px_2px_0_var(--ink)]">
            −{off}%
          </span>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3">
          <p className="font-mono text-xs tracking-wide text-[var(--ink)]/55 uppercase">
            {formatTimeRange(plan.startsAtDate, plan.endsAtDate)} · {plan.minCapacity}–{plan.fullCapacity}
            {plan.evenOnly ? " · even" : ""}
            {plan.flexible ? " · flexible" : ""}
          </p>
          <div className="text-right">
            <p className="font-mono text-xs text-[var(--ink)]/45 line-through">
              {formatEuro(plan.originalPriceCents)}
            </p>
            <p className="font-display text-2xl leading-none">{formatEuro(plan.dealPriceCents)}</p>
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
