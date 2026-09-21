"use client";

import Link from "next/link";
import { GroupChat } from "@/components/group/group-chat";
import { occupancyLine } from "@/components/group/plan-ticket";
import { useGroupPlan } from "@/components/group/use-group-plan";
import { formatDateTime, formatTimeRange } from "@/lib/time";
import type { ChatMessageView } from "@/lib/chat";

export function PlanChatRoom({
  planId,
  currentUserId,
  initialMessages,
  fallbackTitle,
  fallbackSubtitle,
  fallbackMembers,
}: {
  planId: string;
  currentUserId: string;
  initialMessages: ChatMessageView[];
  fallbackTitle: string;
  fallbackSubtitle: string;
  fallbackMembers: string[];
}) {
  const store = useGroupPlan();
  const plan = store.planById(planId);

  if (!store.ready) {
    return (
      <main className="page max-w-xl">
        <p className="kicker text-[var(--ink)]/50">Group chat</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">{fallbackTitle}</h1>
        <p className="mt-2 text-[var(--ink)]/70">{fallbackSubtitle}</p>
      </main>
    );
  }

  if (!plan) {
    return (
      <main className="page max-w-xl">
        <p className="kicker text-[var(--ink)]/50">Group chat</p>
        <h1 className="mt-2 font-display text-5xl">That group is gone</h1>
        <p className="mt-3 text-[var(--ink)]/70">
          This chat is for people signed up for the same activity and time window.
        </p>
        <Link href="/plans" className="btn-ink mt-8">
          Browse plans
        </Link>
      </main>
    );
  }

  const inGroup =
    plan.youHolding || plan.phase === "confirmed" || plan.phase === "result";

  if (!inGroup) {
    return (
      <main className="page max-w-xl">
        <Link
          href={`/plans/${planId}`}
          className="font-mono text-xs tracking-[0.16em] uppercase text-[var(--ink)]/50"
        >
          ← Plan
        </Link>
        <p className="kicker mt-4 text-[var(--ink)]/50">Group chat</p>
        <h1 className="mt-2 font-display text-5xl">Hold a spot first</h1>
        <p className="mt-3 text-[var(--ink)]/70">
          Chat opens for people signed up for {plan.venueName} at{" "}
          {formatTimeRange(plan.startsAtDate, plan.endsAtDate)}. Hold this window, then come back.
        </p>
        <Link href={`/plans/${planId}`} className="btn-ball mt-8">
          Open the plan
        </Link>
      </main>
    );
  }

  return (
    <GroupChat
      roomId={planId}
      currentUserId={currentUserId}
      initialMessages={initialMessages}
      title={plan.venueName}
      subtitle={`${plan.title} · ${formatDateTime(plan.startsAtDate)} · ${formatTimeRange(plan.startsAtDate, plan.endsAtDate)} · ${occupancyLine(plan)}`}
      members={fallbackMembers.filter((name) => name !== "You")}
      backHref={`/plans/${planId}`}
      backLabel="Plan"
    />
  );
}
