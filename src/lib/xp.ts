// XP and leveling math. Pure functions, no DB dependency.

// XP reward per difficulty tier.
export const XP_BY_DIFFICULTY: Record<number, number> = {
  1: 25,   // Trivial
  2: 50,   // Easy
  3: 100,  // Medium
  4: 200,  // Hard
  5: 400,  // Legendary
};

/**
 * XP needed to advance FROM level N to level N+1.
 * Formula: 100 * N^1.5 — gentle early curve, steeper late game.
 */
export function xpRequiredForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5));
}

/**
 * Given total XP earned, compute current level and progress within it.
 */
export function computeLevel(totalXp: number): {
  level: number;
  currentLevelXp: number;
  xpForNextLevel: number;
  progress: number; // 0 to 1
} {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpRequiredForLevel(level)) {
    remaining -= xpRequiredForLevel(level);
    level++;
  }
  const xpForNextLevel = xpRequiredForLevel(level);
  return {
    level,
    currentLevelXp: remaining,
    xpForNextLevel,
    progress: xpForNextLevel > 0 ? remaining / xpForNextLevel : 0,
  };
}

/**
 * Streak multiplier for daily quest XP rewards.
 * When earlyStreak is true (Merchant perk), thresholds shift down by one tier.
 */
export function streakMultiplier(streak: number, earlyStreak = false): number {
  if (earlyStreak) {
    if (streak >= 14) return 2.0;
    if (streak >= 7) return 1.5;
    if (streak >= 3) return 1.25;
    if (streak >= 1) return 1.1;
    return 1.0;
  }
  if (streak >= 30) return 2.0;
  if (streak >= 14) return 1.5;
  if (streak >= 7) return 1.25;
  if (streak >= 3) return 1.1;
  return 1.0;
}

/**
 * Character title derived from level.
 */
export function titleForLevel(level: number): string {
  if (level >= 50) return "Legendary Hero";
  if (level >= 40) return "Grand Master";
  if (level >= 30) return "Champion";
  if (level >= 25) return "Veteran";
  if (level >= 20) return "Knight";
  if (level >= 15) return "Warrior";
  if (level >= 10) return "Adventurer";
  if (level >= 5) return "Apprentice";
  return "Novice";
}
