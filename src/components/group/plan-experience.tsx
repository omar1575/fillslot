"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CapacityMeter } from "@/components/group/capacity-meter";
import { occupancyLine, PlanTicket } from "@/components/group/plan-ticket";
import { useGroupPlan } from "@/components/group/use-group-plan";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatEuro } from "@/lib/money";
import { formatDateTime } from "@/lib/time";
import type { PlanView, RescueChoice } from "@/lib/group-plan";

function choiceLabel(choice: RescueChoice) {
  if (choice === "switch") return "Switch";
  if (choice === "invite") return "Invite a friend";
  if (choice === "refund") return "Refund";
  return "Go anyway";
}

function Countdown({ to }: { to: Date }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const ms = to.getTime() - now;
  if (ms <= 0) {
    return <span>Cutoff passed. Silence means refund.</span>;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return (
    <span>
      {minutes}m {String(seconds).padStart(2, "0")}s left to reply
    </span>
  );
}

export function PlanExperience({ planId, invited = false }: { planId: string; invited?: boolean }) {
  const router = useRouter();
  const store = useGroupPlan();
  const plan = store.planById(planId);
  const alternatives = store.alternativesFor(planId);
  const [step, setStep] = useState<"menu" | "switch" | "invite">("menu");
  const [copied, setCopied] = useState(false);
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/plans/${planId}?invite=1`;
  }, [planId]);

  const settle = store.settle;
  useEffect(() => {
    if (!store.ready || !plan || plan.phase !== "collecting") return;
    const timer = window.setTimeout(() => settle(planId), 1300);
    return () => window.clearTimeout(timer);
  }, [plan, planId, settle, store.ready]);

  if (!store.ready) {
    return (
      <main className="page">
        <p className="text-[var(--ink)]/60">Loading plan…</p>
      </main>
    );
  }

  if (!plan) {
    return (
      <main className="page max-w-xl">
        <p className="kicker text-[var(--ink)]/50">Plan</p>
        <h1 className="mt-2 font-display text-5xl">That plan is gone</h1>
        <p className="mt-3 text-[var(--ink)]/70">It was cancelled or never listed on this device.</p>
        <Link href="/plans" className="btn-ink mt-8">
          Browse plans
        </Link>
      </main>
    );
  }

  const switchedPlan = plan.switchedToId ? store.planById(plan.switchedToId) : null;

  return (
    <main className="page grid gap-8 pb-28 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:pb-16">
      <div>
        <Link href="/plans" className="font-mono text-xs tracking-[0.16em] uppercase text-[var(--ink)]/50">
          ← All plans
        </Link>
        {invited ? (
          <p className="notice-warn mt-4 !bg-[var(--glass)] !text-[var(--ink)]">
            A friend sent the last share link to fill the gap. Hold a spot if you can make it.
          </p>
        ) : null}
        <h1 className="mt-4 font-display text-4xl sm:text-5xl">{plan.venueName}</h1>
        <p className="mt-2 text-base text-[var(--ink)]/70 sm:text-lg">
          {plan.address}, {plan.postalCode} {plan.city}
        </p>
        <div className="mt-8">
          <PlanTicket plan={plan} />
        </div>
        <div className="mt-8 max-w-xl space-y-3 text-[var(--ink)]/75">
          <p>
            Usual {formatEuro(plan.originalPriceCents)} · Fillslot {formatEuro(plan.dealPriceCents)} each. You
            are not charged until the group fills.
          </p>
          <p>
            {CATEGORY_LABELS[plan.category]} · {plan.title} · min {plan.minCapacity}, full {plan.fullCapacity}
            {plan.evenOnly ? ", even numbers only" : ""}
            {plan.flexible ? ", flexible if short" : ""}.
          </p>
        </div>
      </div>

      <aside className="h-fit bg-[var(--ticket)] p-5 shadow-ticket sm:p-6 lg:sticky lg:top-20">
        {plan.phase === "open" || plan.phase === "holding" ? (
          <HoldPanel
            plan={plan}
            onHold={() => store.hold(planId)}
            onRescue={() => store.startRescue(planId)}
          />
        ) : null}
        {plan.phase === "rescue" || plan.phase === "collecting" ? (
          <RescuePanel
            plan={plan}
            step={step}
            alternatives={alternatives}
            copied={copied}
            shareUrl={shareUrl}
            onStep={setStep}
            onCopy={async () => {
              try {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
            onChoose={(choice, switchedToId) => {
              store.collectChoice(planId, choice, switchedToId);
              setStep("menu");
            }}
          />
        ) : null}
        {plan.phase === "result" || plan.phase === "released" || plan.phase === "expired" ? (
          <ResultPanel
            plan={plan}
            switchedPlan={switchedPlan}
            onOpenChat={() => {
              if (plan.switchedToId) {
                router.push(`/plans/${plan.switchedToId}`);
                return;
              }
              store.confirm(planId);
              router.push(`/chat/${planId}`);
            }}
          />
        ) : null}
        {plan.phase === "confirmed" ? <ChatPanel plan={plan} /> : null}
      </aside>
    </main>
  );
}

function HoldPanel({
  plan,
  onHold,
  onRescue,
}: {
  plan: PlanView;
  onHold: () => void;
  onRescue: () => void;
}) {
  const filled = plan.held >= plan.minCapacity;
  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.2em] text-[var(--ink)]/70 uppercase">
        {plan.youHolding ? "Your hold" : "Hold a spot"}
      </p>
      <h2 className="mt-2 font-display text-2xl sm:text-3xl">{formatDateTime(plan.startsAtDate)}</h2>
      <p className="mt-3 text-sm text-[var(--ink)]/70">{occupancyLine(plan)}</p>
      <div className="mt-5">
        <CapacityMeter plan={plan} />
      </div>
      {plan.youHolding ? (
        <p className="mt-5 text-sm text-[var(--ink)]/80">
          Your hold is in. Nobody is charged yet. If this is still short 90 minutes before start, you
          get two chances to rescue the plan. Silence means refund.
        </p>
      ) : (
        <p className="mt-5 text-sm text-[var(--ink)]/80">
          Pay only when the group fills. If you do not reply by the cutoff, the hold is released and
          you are not charged.
        </p>
      )}
      {plan.youHolding && !filled ? (
        <button type="button" className="btn-ball mt-6 h-12 w-full" onClick={onRescue}>
          The group is still short — choose now
        </button>
      ) : plan.youHolding ? (
        <>
          <p className="mt-6 bg-[var(--ticket)] px-3 py-2 text-sm text-[var(--ink)]">
            Min reached. Charging the group and opening chat.
          </p>
          <Link href={`/chat/${plan.id}`} className="btn-ball mt-4 h-12 w-full">
            Open group chat
          </Link>
        </>
      ) : (
        <button type="button" className="btn-ball mt-6 h-12 w-full" onClick={onHold}>
          Hold my spot · {formatEuro(plan.dealPriceCents)}
        </button>
      )}
    </div>
  );
}

function RescuePanel({
  plan,
  step,
  alternatives,
  copied,
  shareUrl,
  onStep,
  onCopy,
  onChoose,
}: {
  plan: PlanView;
  step: "menu" | "switch" | "invite";
  alternatives: PlanView[];
  copied: boolean;
  shareUrl: string;
  onStep: (step: "menu" | "switch" | "invite") => void;
  onCopy: () => void;
  onChoose: (choice: RescueChoice, switchedToId?: string) => void;
}) {
  if (plan.phase === "collecting" && plan.yourChoice) {
    return (
      <div>
        <p className="font-mono text-[11px] tracking-[0.2em] text-[var(--ink)]/70 uppercase">Collecting</p>
        <h2 className="mt-2 font-display text-3xl">Waiting on the others</h2>
        <p className="mt-3 text-sm text-[var(--ink)]/80">
          You chose {choiceLabel(plan.yourChoice)}. Choices land together so nobody is left guessing.
        </p>
      </div>
    );
  }

  if (step === "switch") {
    return (
      <div>
        <button type="button" className="font-mono text-xs tracking-[0.16em] uppercase" onClick={() => onStep("menu")}>
          ← Back
        </button>
        <h2 className="mt-3 font-display text-3xl">Switch</h2>
        <p className="mt-2 text-sm text-[var(--ink)]/80">
          One tap. Your hold moves with you to the closest alternative.
        </p>
        <div className="mt-5 space-y-4">
          {alternatives.length === 0 ? (
            <p className="text-sm">No nearby alternatives right now.</p>
          ) : (
            alternatives.map((option) => (
              <button
                key={option.id}
                type="button"
                className="block w-full text-left"
                onClick={() => onChoose("switch", option.id)}
              >
                <PlanTicket plan={option} compact />
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  if (step === "invite") {
    return (
      <div>
        <button type="button" className="font-mono text-xs tracking-[0.16em] uppercase" onClick={() => onStep("menu")}>
          ← Back
        </button>
        <h2 className="mt-3 font-display text-3xl">Invite a friend</h2>
        <p className="mt-2 text-sm text-[var(--ink)]/80">
          Last share link to fill the gap. If they join, the group charges together.
        </p>
        <p className="mt-4 break-all bg-[var(--ticket)] px-3 py-2 text-sm">{shareUrl}</p>
        <button type="button" className="btn-ghost mt-3 h-11 w-full" onClick={onCopy}>
          {copied ? "Link copied" : "Copy share link"}
        </button>
        <button type="button" className="btn-ball mt-3 h-12 w-full" onClick={() => onChoose("invite")}>
          Send it — I am waiting
        </button>
      </div>
    );
  }

  const splitCopy = `Go anyway, split the gap: ${plan.category} with ${plan.held} at ${formatEuro(plan.splitSurchargeCents)} more each.`;

  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.2em] text-[var(--ink)]/70 uppercase">Rescue</p>
      <h2 className="mt-2 font-display text-3xl">This plan is {plan.spotsNeeded} short</h2>
      <p className="mt-3 text-sm text-[var(--ink)]/80">
        <Countdown to={plan.cutoffDate} /> Reply now. If you stay silent, the hold is released and you
        are not charged.
      </p>
      <div className="mt-5">
        <CapacityMeter plan={plan} />
      </div>
      <div className="mt-6 grid gap-3">
        <button type="button" className="btn-ball h-12 w-full" onClick={() => onStep("switch")}>
          Switch · two closest alternatives
        </button>
        <button type="button" className="btn-ink h-12 w-full" onClick={() => onStep("invite")}>
          Invite a friend
        </button>
        {plan.flexible ? (
          <button
            type="button"
            className="btn-ghost h-auto min-h-12 w-full whitespace-normal py-3 text-left"
            onClick={() => onChoose("split")}
          >
            {splitCopy}
          </button>
        ) : null}
        <button type="button" className="text-sm underline" onClick={() => onChoose("refund")}>
          Refund — release my hold now
        </button>
      </div>
    </div>
  );
}

function ResultPanel({
  plan,
  switchedPlan,
  onOpenChat,
}: {
  plan: PlanView;
  switchedPlan: PlanView | null;
  onOpenChat: () => void;
}) {
  const result = plan.result;
  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.2em] text-[var(--ink)]/70 uppercase">Result</p>
      <h2 className="mt-2 font-display text-3xl">{result?.headline ?? "Holds updated"}</h2>
      {result ? (
        <p className="mt-3 text-sm text-[var(--ink)]/80">
          {result.switched} switched · {result.dropped} dropped out
          {result.invited ? ` · ${result.invited} joined from a link` : ""}
          {result.split ? ` · ${result.split} going anyway` : ""}. Nobody is left guessing.
        </p>
      ) : null}
      {plan.phase === "released" || plan.phase === "expired" ? (
        <p className="mt-4 text-sm text-[var(--ink)]/80">
          {switchedPlan
            ? "The original plan let people go. Your hold moved with you."
            : "Your hold is released. You were not charged."}
        </p>
      ) : null}
      {switchedPlan ? (
        <div className="mt-5">
          <PlanTicket plan={switchedPlan} href={`/plans/${switchedPlan.id}`} compact />
        </div>
      ) : null}
      {plan.yourChoice === "split" || plan.yourChoice === "invite" ? (
        <button type="button" className="btn-ball mt-6 h-12 w-full" onClick={onOpenChat}>
          Open group chat
        </button>
      ) : switchedPlan ? (
        <Link href={`/plans/${switchedPlan.id}`} className="btn-ball mt-6 h-12 w-full">
          Go to your new hold
        </Link>
      ) : (
        <Link href="/plans" className="btn-ghost mt-6 h-12 w-full">
          See other plans
        </Link>
      )}
    </div>
  );
}

function ChatPanel({ plan }: { plan: PlanView }) {
  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.2em] text-[var(--ink)]/70 uppercase">Confirmed</p>
      <h2 className="mt-2 font-display text-3xl">The group is on</h2>
      <p className="mt-3 text-sm text-[var(--ink)]/80">
        {plan.held} people signed up for this window. Chat is only this activity and this time.
      </p>
      <Link href={`/chat/${plan.id}`} className="btn-ball mt-6 h-12 w-full">
        Open group chat
      </Link>
    </div>
  );
}
