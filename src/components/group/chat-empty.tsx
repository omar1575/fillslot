"use client";

import Link from "next/link";
import { useGroupPlan } from "@/components/group/use-group-plan";

export function ChatEmpty({ hasBookingRooms }: { hasBookingRooms: boolean }) {
  const { ready, plans } = useGroupPlan();
  if (!ready) return null;

  const holding = plans.some(
    (plan) => plan.youHolding || plan.phase === "confirmed" || plan.phase === "result",
  );
  if (hasBookingRooms || holding) return null;

  return (
    <div className="ticket border border-dashed border-[var(--ink)]/25 bg-[var(--ticket)] px-6 py-14 text-center">
      <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--ink)]/50">
        Same window
      </p>
      <h2 className="mt-2 font-display text-3xl">No group chats yet</h2>
      <p className="mx-auto mt-3 max-w-md text-[var(--ink)]/70">
        Hold a plan or pay for a leftover. The people signed up for that exact window share one
        thread.
      </p>
      <Link href="/plans" className="btn-ink mt-6">
        Browse plans
      </Link>
    </div>
  );
}
