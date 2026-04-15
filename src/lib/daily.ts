import { startOfToday, startOfYesterday, weekdayInTimezone } from "./utils";

/**
 * Is this completion timestamp within today's window?
 */
export function isCompletedToday(completedAt: Date | null | undefined, tz: string): boolean {
  if (!completedAt) return false;
  return new Date(completedAt).getTime() >= startOfToday(tz).getTime();
}

/**
 * Is the streak broken? True if last completion was before yesterday.
 * When graceDays > 0 (Monk perk), allows that many extra missed days.
 */
export function isStreakBroken(
  lastCompleted: Date | null | undefined,
  tz: string,
  graceDays = 0,
): boolean {
  if (!lastCompleted) return false;
  const cutoff = startOfYesterday(tz).getTime() - graceDays * 86_400_000;
  return new Date(lastCompleted).getTime() < cutoff;
}

/**
 * Should this daily quest be available today based on its schedule?
 */
export function isDailyActiveToday(dailyCron: string | null | undefined, tz: string): boolean {
  if (!dailyCron || dailyCron === "daily") return true;
  const day = weekdayInTimezone(tz);
  if (dailyCron === "weekdays") return day >= 1 && day <= 5;
  if (dailyCron === "weekends") return day === 0 || day === 6;
  return true;
}

export function scheduleLabel(dailyCron: string | null | undefined): string {
  if (!dailyCron || dailyCron === "daily") return "Every day";
  if (dailyCron === "weekdays") return "Weekdays only";
  if (dailyCron === "weekends") return "Weekends only";
  return "Every day";
}

/**
 * Human-readable label for when a non-active schedule will next trigger.
 * Only meaningful when isDailyActiveToday returns false.
 */
export function nextActiveLabel(dailyCron: string | null | undefined): string {
  if (dailyCron === "weekdays") return "Monday";
  if (dailyCron === "weekends") return "Saturday";
  return "tomorrow";
}
