const PLACEHOLDER = "—";

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86400;
const SECONDS_PER_WEEK = 604800;
const SECONDS_PER_MONTH = 2629800;
const SECONDS_PER_YEAR = 31557600;

const JUST_NOW_THRESHOLD_SECONDS = 45;
const COMPACT_COUNT_THRESHOLD = 10000;

const dateFormat = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const relativeFormat = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

const countFormat = new Intl.NumberFormat(undefined);

const compactCountFormat = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

function parseDate(iso: string | null | undefined): Date | null {
  if (iso === null || iso === undefined) return null;
  const trimmed = iso.trim();
  if (trimmed === "") return null;
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(iso: string | null | undefined): string {
  const date = parseDate(iso);
  return date === null ? PLACEHOLDER : dateFormat.format(date);
}

export function formatDateTime(iso: string | null | undefined): string {
  const date = parseDate(iso);
  return date === null ? PLACEHOLDER : dateTimeFormat.format(date);
}

export function relativeTime(iso: string | null | undefined): string {
  const date = parseDate(iso);
  if (date === null) return PLACEHOLDER;

  const seconds = (date.getTime() - Date.now()) / 1000;
  if (Math.abs(seconds) < JUST_NOW_THRESHOLD_SECONDS) return "just now";

  const minutes = Math.round(seconds / SECONDS_PER_MINUTE);
  if (Math.abs(minutes) < 60) return relativeFormat.format(minutes, "minute");

  const hours = Math.round(seconds / SECONDS_PER_HOUR);
  if (Math.abs(hours) < 24) return relativeFormat.format(hours, "hour");

  const days = Math.round(seconds / SECONDS_PER_DAY);
  if (Math.abs(days) < 7) return relativeFormat.format(days, "day");

  const weeks = Math.round(seconds / SECONDS_PER_WEEK);
  if (Math.abs(weeks) < 5) return relativeFormat.format(weeks, "week");

  const months = Math.round(seconds / SECONDS_PER_MONTH);
  if (Math.abs(months) < 12) return relativeFormat.format(months, "month");

  return relativeFormat.format(Math.round(seconds / SECONDS_PER_YEAR), "year");
}

export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return PLACEHOLDER;
  return Math.abs(value) < COMPACT_COUNT_THRESHOLD
    ? countFormat.format(value)
    : compactCountFormat.format(value);
}
