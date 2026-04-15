import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Human-readable relative time. "2 hours ago", "yesterday", etc.
 */
export function relativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.round(diffDay / 7)}w ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Format a number with thousands separator.
 */
export function formatNumber(n: number): string {
  return n.toLocaleString();
}


/**
 * Get the current date parts (year, month, day, weekday) in a given timezone.
 */
function nowInTimezone(tz: string): { year: number; month: number; day: number; weekday: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(new Date()).map((p) => [p.type, p.value]),
  );
  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: weekdayMap[parts.weekday] ?? 0,
  };
}

/**
 * Compute the UTC offset (in ms) for a given timezone at a specific instant.
 */
function tzOffsetMs(tz: string, at: Date): number {
  const utcStr = at.toLocaleString("en-US", { timeZone: "UTC" });
  const tzStr = at.toLocaleString("en-US", { timeZone: tz });
  return new Date(tzStr).getTime() - new Date(utcStr).getTime();
}

/**
 * Start of today (midnight) in the user's timezone, returned as a UTC Date.
 */
export function startOfToday(tz: string): Date {
  const { year, month, day } = nowInTimezone(tz);
  const midnightUtcGuess = Date.UTC(year, month - 1, day);
  const offset = tzOffsetMs(tz, new Date(midnightUtcGuess));
  return new Date(midnightUtcGuess - offset);
}

/**
 * Start of yesterday (midnight) in the user's timezone, returned as a UTC Date.
 */
export function startOfYesterday(tz: string): Date {
  return new Date(startOfToday(tz).getTime() - 86_400_000);
}

/**
 * Get the weekday number (0=Sun, 6=Sat) in the user's timezone.
 */
export function weekdayInTimezone(tz: string): number {
  return nowInTimezone(tz).weekday;
}

/**
 * Format a Date as a short date label (e.g. "Apr 14") in the user's timezone.
 */
export function formatDateLabel(date: Date, tz: string): string {
  return date.toLocaleDateString("en-US", {
    timeZone: tz,
    month: "short",
    day: "numeric",
  });
}
