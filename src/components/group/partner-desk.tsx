"use client";

import Link from "next/link";
import { occupancyLine, PlanTicket } from "@/components/group/plan-ticket";
import { useGroupPlan } from "@/components/group/use-group-plan";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatEuro } from "@/lib/money";
import { formatDate, formatTimeRange } from "@/lib/time";

export function PartnerDesk() {
  const { ready, venue, plans, listedActivities, reset } = useGroupPlan();
  const yours = plans.filter((plan) => plan.listedByYou || (venue && plan.venueName === venue.name));
  const incoming = (yours.length > 0 ? yours : plans).filter(
    (plan) => plan.phase !== "released" && plan.phase !== "expired",
  );

  if (!ready) {
    return (
      <main className="page">
        <p className="text-[var(--ink)]/60">Loading desk…</p>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="kicker text-[var(--ink)]/50">Venue desk</p>
          <h1 className="mt-2 font-display text-5xl">{venue?.name ?? "Your venue"}</h1>
          <p className="mt-2 text-[var(--ink)]/70">
            {venue
              ? `${CATEGORY_LABELS[venue.category]} · ${venue.address}, ${venue.postalCode} ${venue.city}`
              : "Create a venue to attach listings to your name and address."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/partner/activity" className="btn-ball w-fit">
            Add activity
          </Link>
          {!venue ? (
            <Link href="/partner" className="btn-ghost w-fit">
              Create venue
            </Link>
          ) : (
            <Link href="/partner" className="btn-ghost w-fit">
              Edit venue
            </Link>
          )}
        </div>
      </div>

      <section className="ticket mt-8 bg-[var(--ticket)] p-5 shadow-ticket">
        <h2 className="font-display text-2xl">90 minutes ahead</h2>
        <p className="mt-2 text-sm text-[var(--ink)]/70">
          You only get a firm booking when the group fills. If it stays short, holds are released and
          nobody is charged.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-3xl">Groups</h2>
        {incoming.length === 0 ? (
          <p className="mt-4 text-[var(--ink)]/65">No live plans. List an activity to start taking holds.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--ink)]/50">
                <tr>
                  <th className="py-2">When</th>
                  <th>Activity</th>
                  <th>Price</th>
                  <th>Group</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {incoming.map((plan) => (
                  <tr key={plan.id} className="border-t border-[var(--ink)]/10">
                    <td className="py-3">
                      {formatDate(plan.startsAtDate)} · {formatTimeRange(plan.startsAtDate, plan.endsAtDate)}
                    </td>
                    <td>
                      {plan.title}
                      <span className="block text-xs text-[var(--ink)]/55">{plan.venueName}</span>
                    </td>
                    <td>
                      <span className="line-through opacity-45">{formatEuro(plan.originalPriceCents)}</span>{" "}
                      {formatEuro(plan.dealPriceCents)} each
                    </td>
                    <td>{occupancyLine(plan)}</td>
                    <td>
                      {plan.phase === "confirmed" ? (
                        <span>
                          Firm booking · {formatEuro(plan.dealPriceCents * plan.held)}
                        </span>
                      ) : plan.phase === "rescue" || plan.phase === "collecting" ? (
                        "Waiting on guest choices"
                      ) : plan.phase === "result" ? (
                        plan.result?.headline
                      ) : (
                        "Holds open"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {listedActivities.length > 0 ? (
        <section className="mt-10 space-y-4">
          <h2 className="font-display text-3xl">Your listings</h2>
          {plans
            .filter((plan) => plan.listedByYou)
            .map((plan) => (
              <PlanTicket key={plan.id} plan={plan} href={`/plans/${plan.id}`} />
            ))}
        </section>
      ) : null}

      <button type="button" onClick={reset} className="mt-10 text-sm text-[var(--ink)]/45 underline">
        Reset demo plans on this device
      </button>
    </main>
  );
}
