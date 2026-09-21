"use client";

import Link from "next/link";
import { PlanTicket } from "@/components/group/plan-ticket";
import { useGroupPlan } from "@/components/group/use-group-plan";

export function PlansBoard() {
  const { ready, plans, reset } = useGroupPlan();

  if (!ready) {
    return (
      <main className="page">
        <p className="text-[var(--ink)]/60">Loading plans…</p>
      </main>
    );
  }

  return (
    <main className="page">
      <p className="kicker text-[var(--ink)]/50">Maastricht groups</p>
      <h1 className="mt-2 font-display text-5xl">Hold a plan. Pay when it fills.</h1>
      <p className="mt-3 max-w-xl text-[var(--ink)]/70">
        Your hold is free until the group hits the minimum. If it stays short, you can switch, invite
        a friend, split the gap, or drop out. Silence means refund.
      </p>
      <div className="mt-10 grid gap-6">
        {plans.map((plan) => (
          <PlanTicket key={plan.id} href={`/plans/${plan.id}`} plan={plan} />
        ))}
      </div>
      <div className="mt-10 flex flex-wrap gap-4 text-sm">
        <Link href="/partner" className="underline">
          List your venue
        </Link>
        <button type="button" onClick={reset} className="text-[var(--ink)]/45 underline">
          Reset demo on this device
        </button>
      </div>
    </main>
  );
}
