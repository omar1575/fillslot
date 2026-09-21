import { fromZonedTime } from "date-fns-tz";
import { TIMEZONE } from "@/lib/constants";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIMEZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
});

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIMEZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatDate(date: Date) {
  return dateFmt.format(date);
}

export function formatTime(date: Date) {
  return timeFmt.format(date);
}

export function formatTimeRange(startsAt: Date, endsAt: Date) {
  return `${formatTime(startsAt)}–${formatTime(endsAt)}`;
}

export function formatDateTime(date: Date) {
  return dateTimeFmt.format(date);
}

export function amsterdamInputToUtc(localValue: string) {
  const normalized = localValue.trim().replace("T", " ");
  const withSeconds = normalized.length === 16 ? `${normalized}:00` : normalized;
  return fromZonedTime(withSeconds, TIMEZONE);
}

export function utcToAmsterdamInput(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
