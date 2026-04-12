import { startOfToday, startOfYesterday } from "./utils";

/**
 * Is this completion timestamp within today's window?
 */
export function isCompletedToday(completedAt: Date | null | undefined): boolean {
  if (!completedAt) return false;
  const completed = new Date(completedAt);
  completed.setHours(0, 0, 0, 0);
  return completed.getTime() === startOfToday().getTime();
}

/**
 * Is the streak broken? True if last completion was before yesterday.
 * When graceDays > 0 (Monk perk), allows that many extra missed days.
 */
export function isStreakBroken(
  lastCompleted: Date | null | undefined,
  graceDays = 0,
): boolean {
  if (!lastCompleted) return false; // never started != broken
  const last = new Date(lastCompleted);
  last.setHours(0, 0, 0, 0);
  const cutoff = startOfYesterday().getTime() - graceDays * 86_400_000;
  return last.getTime() < cutoff;
}

/**
 * Should this daily quest be available today based on its schedule?
 */
export function isDailyActiveToday(dailyCron: string | null | undefined): boolean {
  if (!dailyCron || dailyCron === "daily") return true;
  const day = new Date().getDay(); // 0=Sun, 6=Sat
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
