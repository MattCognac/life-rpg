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
 * Start of today in local time.
 */
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Start of yesterday in local time.
 */
export function startOfYesterday(): Date {
  const d = startOfToday();
  d.setDate(d.getDate() - 1);
  return d;
}
