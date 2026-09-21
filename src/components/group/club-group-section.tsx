"use client";

import Link from "next/link";
import { occupancyLine } from "@/components/group/plan-ticket";
import { useGroupPlan } from "@/components/group/use-group-plan";
import { formatEuro } from "@/lib/money";
import { formatDate, formatTimeRange } from "@/lib/time";

export function ClubGroupSection({ venueName }: { venueName: string }) {
  const { ready, plans } = useGroupPlan();
  const rows = ready ? plans.filter((plan) => plan.venueName === venueName) : [];

  return (
    <section className="mt-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-3xl">Group plans</h2>
          <p className="mt-1 text-sm text-[var(--ink)]/65">
            Holds first. Charge together when the minimum is met. You know 90 minutes ahead.
          </p>
        </div>
        <Link href="/partner/activity" className="btn-ghost w-fit">
          Add group activity
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--ink)]/60">
          No group listings yet. Add min/full capacity, prices, and location.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--ink)]/50">
              <tr>
                <th className="py-2">When</th>
                <th>Activity</th>
                <th>Capacity</th>
                <th>Group</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((plan) => (
                <tr key={plan.id} className="border-t border-[var(--ink)]/10">
                  <td className="py-3">
                    {formatDate(plan.startsAtDate)} · {formatTimeRange(plan.startsAtDate, plan.endsAtDate)}
                  </td>
                  <td>
                    {plan.title}
                    <span className="block text-xs text-[var(--ink)]/50">
                      {formatEuro(plan.dealPriceCents)} each
                    </span>
                  </td>
                  <td>
                    {plan.minCapacity}–{plan.fullCapacity}
                    {plan.evenOnly ? " · even" : ""}
                    {plan.flexible ? " · flex" : ""}
                  </td>
                  <td>{occupancyLine(plan)}</td>
                  <td>{plan.phase === "confirmed" ? "Firm booking" : plan.phase}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
