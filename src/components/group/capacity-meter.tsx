"use client";

import { cn } from "@/lib/utils";
import type { PlanView } from "@/lib/group-plan";

export function CapacityMeter({ plan }: { plan: PlanView }) {
  return (
    <div>
      <div className="flex gap-1.5">
        {Array.from({ length: plan.fullCapacity }, (_, index) => {
          const filled = index < plan.held;
          const needed = index >= plan.held && index < plan.minCapacity;
          return (
            <span
              key={index}
              className={cn(
                "h-3 flex-1",
                filled ? "bg-[var(--ink)]" : needed ? "bg-[var(--ball)]" : "bg-[var(--ink)]/15",
              )}
            />
          );
        })}
      </div>
      <p className="mt-2 font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--ink)]/55">
        Min {plan.minCapacity} · full {plan.fullCapacity}
        {plan.evenOnly ? " · even numbers" : ""}
      </p>
    </div>
  );
}
