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

const WEEKDAY_IDS: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

export function amsterdamWeekday(date: Date) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
  }).format(date);
  return WEEKDAY_IDS[weekday] ?? 1;
}

export function amsterdamDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return { year: get("year"), month: get("month"), day: get("day") };
}

export function amsterdamAtMinutes(base: Date, minuteOfDay: number) {
  const { year, month, day } = amsterdamDateParts(base);
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  const local = `${year}-${month}-${day} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
  return fromZonedTime(local, TIMEZONE);
}

export function parseClock(value: string) {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatClock(minuteOfDay: number) {
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
