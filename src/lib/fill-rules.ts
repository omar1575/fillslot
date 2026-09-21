import type { FillMode, Slot } from "@/db/schema";
import { FILL_INVITE_MINUTES, FILL_REFUND_MINUTES } from "@/lib/constants";
import { addMinutes } from "date-fns";

export function isFillMet(
  slot: Pick<Slot, "fillMode" | "minPartySize" | "capacity">,
  paidCount: number,
) {
  if (slot.fillMode === "exact") return paidCount >= slot.capacity;
  if (slot.fillMode === "threshold") return paidCount >= slot.minPartySize;
  return true;
}

export function fillRuleCopy(
  slot: Pick<Slot, "fillMode" | "minPartySize" | "capacity">,
) {
  if (slot.fillMode === "exact") {
    return `This session only goes ahead with exactly ${slot.capacity} ${slot.capacity === 1 ? "person" : "people"}.`;
  }
  if (slot.fillMode === "threshold") {
    return `This session only goes ahead if at least ${slot.minPartySize} ${slot.minPartySize === 1 ? "person joins" : "people join"} (up to ${slot.capacity}).`;
  }
  if (slot.capacity > 1) {
    return `Up to ${slot.capacity} leftover spots.`;
  }
  return "One leftover window. First guest to pay takes it.";
}

export function fillDeadlineCopy(
  slot: Pick<Slot, "fillMode">,
) {
  if (slot.fillMode === "cap") return null;
  return `If it is still short about ${FILL_INVITE_MINUTES} minutes before start, we invite more people and tell anyone already in about another leftover. Close to start, unpaid leftovers get their money back.`;
}

export function inviteAt(startsAt: Date) {
  return addMinutes(startsAt, -FILL_INVITE_MINUTES);
}

export function refundAt(startsAt: Date) {
  return addMinutes(startsAt, -FILL_REFUND_MINUTES);
}

export function parseFillMode(value: unknown): FillMode | undefined {
  if (value === "threshold" || value === "exact" || value === "cap") return value;
  return undefined;
}

export function resolveFillSizes(input: {
  fillMode: FillMode;
  minPartySize: number;
  capacity: number;
}):
  | { ok: true; minPartySize: number; capacity: number }
  | { ok: false; error: string } {
  const capacity = Math.floor(input.capacity);
  const minPartySize = Math.floor(input.minPartySize);

  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 80) {
    return { ok: false, error: "Capacity has to be between 1 and 80 people." };
  }

  if (input.fillMode === "exact") {
    return { ok: true, minPartySize: capacity, capacity };
  }
  if (input.fillMode === "cap") {
    return { ok: true, minPartySize: 1, capacity };
  }
  if (!Number.isInteger(minPartySize) || minPartySize < 1 || minPartySize > capacity) {
    return { ok: false, error: "The minimum has to be at least 1 and no higher than the maximum." };
  }
  return { ok: true, minPartySize, capacity };
}
