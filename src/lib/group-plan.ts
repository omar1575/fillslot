import type { ActivityCategory } from "@/db/schema";
import { ACTIVITY_CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";

export const GROUP_PLAN_STORAGE_KEY = "fillslot.group-plan.v1";

export type PlanPhase =
  | "open"
  | "holding"
  | "rescue"
  | "collecting"
  | "result"
  | "confirmed"
  | "released"
  | "expired";

export type RescueChoice = "switch" | "invite" | "refund" | "split";

export type PartnerVenue = {
  id: string;
  name: string;
  category: ActivityCategory;
  address: string;
  city: string;
  postalCode: string;
  description: string;
};

export type PartnerActivity = {
  id: string;
  venueId: string;
  venueName: string;
  category: ActivityCategory;
  title: string;
  address: string;
  city: string;
  postalCode: string;
  startsAt: string;
  endsAt: string;
  originalPriceCents: number;
  dealPriceCents: number;
  minCapacity: number;
  fullCapacity: number;
  evenOnly: boolean;
  flexible: boolean;
  listedByYou?: boolean;
};

export type PlanResult = {
  switched: number;
  dropped: number;
  split: number;
  invited: number;
  headline: string;
};

export type PlanRuntime = {
  held: number;
  youHolding: boolean;
  phase: PlanPhase;
  cutoffAt: string;
  yourChoice: RescueChoice | null;
  switchedToId: string | null;
  result: PlanResult | null;
};

export type GroupSnapshot = {
  venue: PartnerVenue | null;
  activities: PartnerActivity[];
  runtime: Record<string, PlanRuntime>;
};

export type PlanView = PartnerActivity &
  PlanRuntime & {
    startsAtDate: Date;
    endsAtDate: Date;
    cutoffDate: Date;
    spotsNeeded: number;
    splitSurchargeCents: number;
  };

function laterToday(hour: number, minute: number, dayOffsetOrEnd?: number | Date) {
  if (dayOffsetOrEnd instanceof Date) {
    const date = new Date(dayOffsetOrEnd);
    date.setHours(hour, minute, 0, 0);
    return date;
  }
  const date = new Date();
  date.setDate(date.getDate() + (dayOffsetOrEnd ?? 0));
  date.setHours(hour, minute, 0, 0);
  if (date.getTime() <= Date.now() + 20 * 60 * 1000) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

export const SEED_VENUE_IDS = {
  bowling: "venue_strike",
  padel: "venue_plaza",
  spa: "venue_badhuys",
} as const;

let seedCache: PartnerActivity[] | null = null;

export function seedActivities(): PartnerActivity[] {
  if (seedCache) return seedCache;
  const bowlStart = laterToday(19, 0);
  const bowlEnd = laterToday(20, 30, bowlStart);
  const padelStart = laterToday(18, 0, 1);
  const padelEnd = laterToday(19, 30, padelStart);
  const spaStart = laterToday(20, 0);
  const spaEnd = laterToday(21, 30, spaStart);
  const hairStart = laterToday(17, 30);
  const hairEnd = laterToday(18, 30, hairStart);

  seedCache = [
    {
      id: "plan_bowl",
      venueId: SEED_VENUE_IDS.bowling,
      venueName: "Strike Boschstraat",
      category: "bowling",
      title: "Lane 3",
      address: "Boschstraat 69",
      city: "Maastricht",
      postalCode: "6211 AV",
      startsAt: bowlStart.toISOString(),
      endsAt: bowlEnd.toISOString(),
      originalPriceCents: 2800,
      dealPriceCents: 1800,
      minCapacity: 4,
      fullCapacity: 6,
      evenOnly: true,
      flexible: true,
    },
    {
      id: "plan_padel",
      venueId: SEED_VENUE_IDS.padel,
      venueName: "Plaza Padel Maastricht",
      category: "padel",
      title: "Court 2",
      address: "Franciscus Romanusweg 2",
      city: "Maastricht",
      postalCode: "6221 AC",
      startsAt: padelStart.toISOString(),
      endsAt: padelEnd.toISOString(),
      originalPriceCents: 3600,
      dealPriceCents: 1800,
      minCapacity: 4,
      fullCapacity: 4,
      evenOnly: true,
      flexible: false,
    },
    {
      id: "plan_spa",
      venueId: SEED_VENUE_IDS.spa,
      venueName: "Badhuys Wyck",
      category: "spa",
      title: "Steam room hour",
      address: "Rechtstraat 64",
      city: "Maastricht",
      postalCode: "6221 EN",
      startsAt: spaStart.toISOString(),
      endsAt: spaEnd.toISOString(),
      originalPriceCents: 4500,
      dealPriceCents: 2200,
      minCapacity: 2,
      fullCapacity: 2,
      evenOnly: true,
      flexible: false,
    },
    {
      id: "plan_hair",
      venueId: "venue_salon",
      venueName: "Salon Stokstraat",
      category: "hair",
      title: "Chair 1",
      address: "Stokstraat 14",
      city: "Maastricht",
      postalCode: "6211 GD",
      startsAt: hairStart.toISOString(),
      endsAt: hairEnd.toISOString(),
      originalPriceCents: 4500,
      dealPriceCents: 2200,
      minCapacity: 1,
      fullCapacity: 1,
      evenOnly: false,
      flexible: false,
    },
  ];
  return seedCache;
}

export function defaultRuntime(): Record<string, PlanRuntime> {
  const activities = seedActivities();
  const bowl = activities[0];
  const padel = activities[1];
  const hair = activities[3];
  if (!bowl || !padel || !hair) {
    return {};
  }
  const bowlStart = new Date(bowl.startsAt);
  const padelStart = new Date(padel.startsAt);
  const hairStart = new Date(hair.startsAt);
  return {
    plan_bowl: {
      held: 3,
      youHolding: true,
      phase: "rescue",
      cutoffAt: new Date(bowlStart.getTime() - 90 * 60 * 1000).toISOString(),
      yourChoice: null,
      switchedToId: null,
      result: null,
    },
    plan_padel: {
      held: 2,
      youHolding: false,
      phase: "open",
      cutoffAt: new Date(padelStart.getTime() - 90 * 60 * 1000).toISOString(),
      yourChoice: null,
      switchedToId: null,
      result: null,
    },
    plan_spa: {
      held: 2,
      youHolding: true,
      phase: "confirmed",
      cutoffAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      yourChoice: null,
      switchedToId: null,
      result: { switched: 0, dropped: 0, split: 0, invited: 0, headline: "Group filled" },
    },
    plan_hair: {
      held: 0,
      youHolding: false,
      phase: "open",
      cutoffAt: new Date(hairStart.getTime() - 90 * 60 * 1000).toISOString(),
      yourChoice: null,
      switchedToId: null,
      result: null,
    },
  };
}

export const EMPTY_SNAPSHOT: GroupSnapshot = {
  venue: null,
  activities: [],
  runtime: {},
};

export function emptySnapshot(): GroupSnapshot {
  return {
    venue: null,
    activities: [],
    runtime: defaultRuntime(),
  };
}

export function parseSnapshot(raw: string | null): GroupSnapshot {
  if (!raw) return emptySnapshot();
  try {
    const parsed = JSON.parse(raw) as Partial<GroupSnapshot>;
    return {
      venue: parsed.venue ?? null,
      activities: Array.isArray(parsed.activities) ? parsed.activities : [],
      runtime: { ...defaultRuntime(), ...(parsed.runtime ?? {}) },
    };
  } catch {
    return emptySnapshot();
  }
}

export function allActivities(snapshot: GroupSnapshot) {
  const extras = snapshot.activities.filter(
    (activity) => !seedActivities().some((seed) => seed.id === activity.id),
  );
  return [...seedActivities(), ...extras];
}

export function splitSurchargeCents(activity: Pick<PartnerActivity, "dealPriceCents" | "flexible">) {
  if (!activity.flexible) return 0;
  return 200;
}

export function toPlanView(activity: PartnerActivity, runtime: PlanRuntime): PlanView {
  const startsAtDate = new Date(activity.startsAt);
  const endsAtDate = new Date(activity.endsAt);
  return {
    ...activity,
    ...runtime,
    startsAtDate,
    endsAtDate,
    cutoffDate: new Date(runtime.cutoffAt),
    spotsNeeded: Math.max(0, activity.minCapacity - runtime.held),
    splitSurchargeCents: splitSurchargeCents(activity),
  };
}

export function planRuntimeFor(activity: PartnerActivity, snapshot: GroupSnapshot): PlanRuntime {
  const existing = snapshot.runtime[activity.id];
  if (existing) return existing;
  const start = new Date(activity.startsAt);
  return {
    held: activity.listedByYou ? 0 : 1,
    youHolding: false,
    phase: "open",
    cutoffAt: new Date(start.getTime() - 90 * 60 * 1000).toISOString(),
    yourChoice: null,
    switchedToId: null,
    result: null,
  };
}

export function listPlans(snapshot: GroupSnapshot): PlanView[] {
  return allActivities(snapshot)
    .map((activity) => toPlanView(activity, planRuntimeFor(activity, snapshot)))
    .sort((a, b) => a.startsAtDate.getTime() - b.startsAtDate.getTime());
}

export function getPlan(snapshot: GroupSnapshot, id: string) {
  return listPlans(snapshot).find((plan) => plan.id === id) ?? null;
}

export function closestAlternatives(snapshot: GroupSnapshot, planId: string) {
  const current = getPlan(snapshot, planId);
  if (!current) return [];
  return listPlans(snapshot)
    .filter(
      (plan) =>
        plan.id !== planId &&
        plan.phase !== "released" &&
        plan.phase !== "expired" &&
        plan.phase !== "confirmed",
    )
    .sort((a, b) => {
      const sameCity = Number(b.city === current.city) - Number(a.city === current.city);
      if (sameCity) return sameCity;
      return (
        Math.abs(a.startsAtDate.getTime() - current.startsAtDate.getTime()) -
        Math.abs(b.startsAtDate.getTime() - current.startsAtDate.getTime())
      );
    })
    .slice(0, 2);
}

export function categoryOptions() {
  return ACTIVITY_CATEGORIES.map((category) => ({
    value: category,
    label: CATEGORY_LABELS[category],
  }));
}

export function tallyFor(choice: RescueChoice, plan: PlanView): PlanResult {
  if (choice === "invite") {
    return {
      switched: 0,
      dropped: 0,
      split: 0,
      invited: 1,
      headline: "1 friend joined. The group filled.",
    };
  }
  if (choice === "split") {
    return {
      switched: 0,
      dropped: 0,
      split: plan.held,
      invited: 0,
      headline: `Going with ${plan.held} at €${(plan.splitSurchargeCents / 100).toFixed(0)} more each`,
    };
  }
  return {
    switched: 2,
    dropped: 1,
    split: 0,
    invited: 0,
    headline: "2 switched, 1 dropped out",
  };
}

export function nextPhaseFor(choice: RescueChoice): PlanPhase {
  if (choice === "refund") return "released";
  if (choice === "switch") return "released";
  return "result";
}

export function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function holdPlan(snapshot: GroupSnapshot, planId: string): GroupSnapshot {
  const plan = getPlan(snapshot, planId);
  if (!plan || plan.youHolding) return snapshot;
  const held = Math.min(plan.fullCapacity, plan.held + 1);
  const filled = held >= plan.minCapacity;
  return patchRuntime(snapshot, planId, {
    held,
    youHolding: true,
    phase: filled ? "confirmed" : "holding",
  });
}

export function openRescue(snapshot: GroupSnapshot, planId: string): GroupSnapshot {
  const plan = getPlan(snapshot, planId);
  if (!plan) return snapshot;
  return patchRuntime(snapshot, planId, { phase: "rescue", youHolding: true });
}

export function markCollecting(
  snapshot: GroupSnapshot,
  planId: string,
  choice: RescueChoice,
  switchedToId?: string,
): GroupSnapshot {
  return patchRuntime(snapshot, planId, {
    phase: "collecting",
    yourChoice: choice,
    switchedToId: switchedToId ?? snapshot.runtime[planId]?.switchedToId ?? null,
  });
}

export function settleChoice(snapshot: GroupSnapshot, planId: string): GroupSnapshot {
  const plan = getPlan(snapshot, planId);
  if (!plan?.yourChoice) return snapshot;
  const result = tallyFor(plan.yourChoice, plan);
  const phase = nextPhaseFor(plan.yourChoice);

  let next = patchRuntime(snapshot, planId, { phase, result });

  if (plan.yourChoice === "refund") {
    next = patchRuntime(next, planId, {
      youHolding: false,
      held: Math.max(0, plan.held - 1),
      phase: "released",
    });
  }

  if (plan.yourChoice === "invite") {
    next = patchRuntime(next, planId, {
      held: plan.minCapacity,
      phase: "result",
    });
  }

  if (plan.yourChoice === "split") {
    next = patchRuntime(next, planId, {
      phase: "result",
    });
  }

  if (plan.yourChoice === "switch" && plan.switchedToId) {
    const target = getPlan(next, plan.switchedToId);
    if (target) {
      const held = Math.min(target.fullCapacity, target.held + (target.youHolding ? 0 : 1));
      next = patchRuntime(next, plan.switchedToId, {
        held,
        youHolding: true,
        phase: held >= target.minCapacity ? "confirmed" : "holding",
      });
      next = patchRuntime(next, planId, {
        youHolding: false,
        held: Math.max(0, plan.held - 1),
        phase: "released",
        result,
      });
    }
  }

  return next;
}

export function patchRuntime(
  snapshot: GroupSnapshot,
  planId: string,
  patch: Partial<PlanRuntime>,
): GroupSnapshot {
  const current = planRuntimeFor(
    allActivities(snapshot).find((activity) => activity.id === planId) ?? seedActivities()[0],
    snapshot,
  );
  return {
    ...snapshot,
    runtime: {
      ...snapshot.runtime,
      [planId]: { ...current, ...patch },
    },
  };
}

export function saveVenue(snapshot: GroupSnapshot, venue: PartnerVenue): GroupSnapshot {
  return { ...snapshot, venue };
}

export function saveActivity(snapshot: GroupSnapshot, activity: PartnerActivity): GroupSnapshot {
  const activities = snapshot.activities.filter((row) => row.id !== activity.id).concat(activity);
  const start = new Date(activity.startsAt);
  return {
    ...snapshot,
    activities,
    runtime: {
      ...snapshot.runtime,
      [activity.id]: {
        held: 0,
        youHolding: false,
        phase: "open",
        cutoffAt: new Date(start.getTime() - 90 * 60 * 1000).toISOString(),
        yourChoice: null,
        switchedToId: null,
        result: null,
      },
    },
  };
}

export function confirmPlan(snapshot: GroupSnapshot, planId: string): GroupSnapshot {
  const plan = getPlan(snapshot, planId);
  if (!plan) return snapshot;
  return patchRuntime(snapshot, planId, {
    phase: "confirmed",
    held: Math.max(plan.held, plan.minCapacity),
  });
}

export function resetSnapshot(): GroupSnapshot {
  return emptySnapshot();
}
