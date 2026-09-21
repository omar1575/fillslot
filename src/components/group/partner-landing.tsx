"use client";

import Link from "next/link";
import { VenueApplyForm } from "@/components/group/venue-apply-form";
import { useGroupPlan } from "@/components/group/use-group-plan";

export function PartnerLanding() {
  const { ready, venue } = useGroupPlan();

  if (!ready) {
    return (
      <main className="page max-w-lg">
        <p className="text-[var(--ink)]/60">Loading…</p>
      </main>
    );
  }

  return (
    <main className="page max-w-lg">
      <p className="kicker text-[var(--ink)]/50">Venues</p>
      <h1 className="mt-2 font-display text-5xl">
        {venue ? "Your venue" : "Create a venue account"}
      </h1>
      <p className="mt-3 text-[var(--ink)]/70">
        List leftover time with a usual price and a discount. Set min and full capacity. You get a
        firm booking 90 minutes ahead — only if the group fills.
      </p>
      {venue ? (
        <p className="mt-4">
          <Link href="/partner/desk" className="btn-ink">
            Open desk
          </Link>
        </p>
      ) : null}
      <div className="mt-8">
        <VenueApplyForm />
      </div>
    </main>
  );
}
