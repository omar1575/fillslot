"use client";

import { useCallback, useEffect, useState } from "react";
import {
  GROUP_PLAN_STORAGE_KEY,
  closestAlternatives,
  emptySnapshot,
  getPlan,
  holdPlan,
  listPlans,
  markCollecting,
  openRescue,
  parseSnapshot,
  resetSnapshot,
  saveActivity,
  saveVenue,
  settleChoice,
  confirmPlan,
  type GroupSnapshot,
  type PartnerActivity,
  type PartnerVenue,
  type RescueChoice,
} from "@/lib/group-plan";

function writeSnapshot(snapshot: GroupSnapshot) {
  window.localStorage.setItem(GROUP_PLAN_STORAGE_KEY, JSON.stringify(snapshot));
}

export function useGroupPlan() {
  const [snapshot, setSnapshot] = useState<GroupSnapshot>(emptySnapshot);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSnapshot(parseSnapshot(window.localStorage.getItem(GROUP_PLAN_STORAGE_KEY)));
    setReady(true);
  }, []);

  const update = useCallback((fn: (current: GroupSnapshot) => GroupSnapshot) => {
    setSnapshot((current) => {
      const next = fn(current);
      writeSnapshot(next);
      return next;
    });
  }, []);

  return {
    ready,
    snapshot,
    venue: snapshot.venue,
    plans: listPlans(snapshot),
    listedActivities: snapshot.activities,
    planById: (id: string) => getPlan(snapshot, id),
    alternativesFor: (id: string) => closestAlternatives(snapshot, id),
    saveVenue: (venue: PartnerVenue) => update((current) => saveVenue(current, venue)),
    saveActivity: (activity: PartnerActivity) =>
      update((current) => saveActivity(current, activity)),
    hold: (planId: string) => update((current) => holdPlan(current, planId)),
    startRescue: (planId: string) => update((current) => openRescue(current, planId)),
    collectChoice: (planId: string, choice: RescueChoice, switchedToId?: string) =>
      update((current) => markCollecting(current, planId, choice, switchedToId)),
    settle: (planId: string) => update((current) => settleChoice(current, planId)),
    confirm: (planId: string) => update((current) => confirmPlan(current, planId)),
    reset: () => {
      const next = resetSnapshot();
      writeSnapshot(next);
      setSnapshot(next);
    },
  };
}
