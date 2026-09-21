"use client";

import Link from "next/link";
import { occupancyLine } from "@/components/group/plan-ticket";
import { useGroupPlan } from "@/components/group/use-group-plan";
import { formatDate, formatTimeRange } from "@/lib/time";

export function HeldPlanChats() {
  const { ready, plans } = useGroupPlan();
  if (!ready) return null;

  const mine = plans.filter(
    (plan) => plan.youHolding || plan.phase === "confirmed" || plan.phase === "result",
  );

  if (mine.length === 0) return null;

  return (
    <div className="grid gap-4">
      {mine.map((plan) => (
        <Link
          key={plan.id}
          href={`/chat/${plan.id}`}
          className="ticket flex flex-wrap items-center justify-between gap-4 bg-[var(--ticket)] px-5 py-4 shadow-ticket"
        >
          <div>
            <p className="kicker text-[var(--ink)]/45">Your plan</p>
            <p className="font-display text-xl">{plan.venueName}</p>
            <p className="text-sm text-[var(--ink)]/65">
              {plan.title} · {formatDate(plan.startsAtDate)} ·{" "}
              {formatTimeRange(plan.startsAtDate, plan.endsAtDate)}
            </p>
            <p className="mt-2 font-mono text-xs tracking-[0.16em] uppercase text-[var(--ink)]/50">
              {occupancyLine(plan)}
            </p>
          </div>
          <p className="font-display text-[var(--turf)]">Open chat</p>
        </Link>
      ))}
    </div>
  );
}
