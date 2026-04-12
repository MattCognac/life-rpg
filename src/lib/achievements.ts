import { db } from "./db";

export interface AchievementDef {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: "general" | "quests" | "levels" | "skills" | "streaks" | "difficulty" | "realms";
  sortOrder: number;
  check: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  totalCompletions: number;
  completionsByDifficulty: Record<number, number>;
  chainsCompleted: number;
  characterLevel: number;
  skillCount: number;
  skillLevels: number[];
  longestStreak: number;
  realmsActive: number;
  crossRealmChains: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "FIRST_STEPS", name: "First Steps", description: "Complete your first quest", icon: "footprints", category: "quests", sortOrder: 1, check: (s) => s.totalCompletions >= 1 },
  { key: "GETTING_STARTED", name: "Getting Started", description: "Complete 10 quests", icon: "swords", category: "quests", sortOrder: 2, check: (s) => s.totalCompletions >= 10 },
  { key: "DEDICATED", name: "Dedicated", description: "Complete 50 quests", icon: "medal", category: "quests", sortOrder: 3, check: (s) => s.totalCompletions >= 50 },
  { key: "CENTURION", name: "Centurion", description: "Complete 100 quests", icon: "award", category: "quests", sortOrder: 4, check: (s) => s.totalCompletions >= 100 },
  { key: "QUEST_MASTER", name: "Quest Master", description: "Complete 500 quests", icon: "crown", category: "quests", sortOrder: 5, check: (s) => s.totalCompletions >= 500 },
  { key: "CHAIN_BREAKER", name: "Chain Breaker", description: "Complete a quest chain", icon: "link", category: "general", sortOrder: 6, check: (s) => s.chainsCompleted >= 1 },
  { key: "CHAIN_LORD", name: "Chain Lord", description: "Complete 5 quest chains", icon: "link-2", category: "general", sortOrder: 7, check: (s) => s.chainsCompleted >= 5 },

  { key: "LEVEL_5", name: "Rising Star", description: "Reach character level 5", icon: "star", category: "levels", sortOrder: 10, check: (s) => s.characterLevel >= 5 },
  { key: "LEVEL_10", name: "Seasoned Adventurer", description: "Reach character level 10", icon: "shield", category: "levels", sortOrder: 11, check: (s) => s.characterLevel >= 10 },
  { key: "LEVEL_20", name: "Knight of the Realm", description: "Reach character level 20", icon: "shield-check", category: "levels", sortOrder: 12, check: (s) => s.characterLevel >= 20 },
  { key: "LEVEL_30", name: "Champion", description: "Reach character level 30", icon: "trophy", category: "levels", sortOrder: 13, check: (s) => s.characterLevel >= 30 },
  { key: "LEVEL_50", name: "Living Legend", description: "Reach character level 50", icon: "sparkles", category: "levels", sortOrder: 14, check: (s) => s.characterLevel >= 50 },

  { key: "FIRST_SKILL", name: "Apprentice", description: "Create your first discipline", icon: "sparkles", category: "skills", sortOrder: 20, check: (s) => s.skillCount >= 1 },
  { key: "FIVE_SKILLS", name: "Well Rounded", description: "Have 5 different disciplines", icon: "layers", category: "skills", sortOrder: 21, check: (s) => s.skillCount >= 5 },
  { key: "SKILL_LEVEL_5", name: "Specialist", description: "Reach level 5 in any discipline", icon: "zap", category: "skills", sortOrder: 22, check: (s) => s.skillLevels.some((l) => l >= 5) },
  { key: "SKILL_LEVEL_10", name: "Expert", description: "Reach level 10 in any discipline", icon: "flame", category: "skills", sortOrder: 23, check: (s) => s.skillLevels.some((l) => l >= 10) },
  { key: "ALL_SKILLS_5", name: "Jack of All Trades", description: "Reach level 5 in at least 3 disciplines", icon: "gem", category: "skills", sortOrder: 24, check: (s) => s.skillLevels.filter((l) => l >= 5).length >= 3 },

  { key: "REALM_EXPLORER", name: "Realm Explorer", description: "Have active disciplines in all 6 realms", icon: "compass", category: "realms", sortOrder: 25, check: (s) => s.realmsActive >= 6 },
  { key: "CROSS_REALM_CHAIN", name: "Realm Walker", description: "Complete a quest chain spanning 2+ realms", icon: "map", category: "realms", sortOrder: 26, check: (s) => s.crossRealmChains >= 1 },

  { key: "STREAK_3", name: "Consistent", description: "Maintain a 3-day streak", icon: "flame", category: "streaks", sortOrder: 30, check: (s) => s.longestStreak >= 3 },
  { key: "STREAK_7", name: "Weekly Warrior", description: "Maintain a 7-day streak", icon: "flame", category: "streaks", sortOrder: 31, check: (s) => s.longestStreak >= 7 },
  { key: "STREAK_14", name: "Fortnight Fighter", description: "Maintain a 14-day streak", icon: "flame", category: "streaks", sortOrder: 32, check: (s) => s.longestStreak >= 14 },
  { key: "STREAK_30", name: "Monthly Master", description: "Maintain a 30-day streak", icon: "flame", category: "streaks", sortOrder: 33, check: (s) => s.longestStreak >= 30 },
  { key: "STREAK_100", name: "Unstoppable", description: "Maintain a 100-day streak", icon: "flame", category: "streaks", sortOrder: 34, check: (s) => s.longestStreak >= 100 },

  { key: "DRAGON_SLAYER", name: "Dragon Slayer", description: "Complete a Legendary quest", icon: "skull", category: "difficulty", sortOrder: 40, check: (s) => (s.completionsByDifficulty[5] ?? 0) >= 1 },
  { key: "LEGEND_KILLER", name: "Legend Killer", description: "Complete 10 Legendary quests", icon: "swords", category: "difficulty", sortOrder: 41, check: (s) => (s.completionsByDifficulty[5] ?? 0) >= 10 },
  { key: "VERSATILE", name: "Versatile", description: "Complete quests of every difficulty", icon: "layers", category: "difficulty", sortOrder: 42, check: (s) => [1, 2, 3, 4, 5].every((d) => (s.completionsByDifficulty[d] ?? 0) >= 1) },
];

export async function gatherAchievementStats(userId: string): Promise<AchievementStats> {
  const [
    totalCompletions,
    completionsByDiff,
    character,
    disciplines,
    streaks,
    chainsWithQuests,
  ] = await Promise.all([
    db.questCompletion.count({ where: { userId } }),
    db.$queryRaw<Array<{ difficulty: number; count: bigint }>>`
      SELECT q."difficulty", COUNT(qc."id") as count
      FROM "QuestCompletion" qc
      JOIN "Quest" q ON q."id" = qc."questId"
      WHERE qc."userId" = ${userId}
      GROUP BY q."difficulty"
    `.then((rows) => {
      const map: Record<number, number> = {};
      for (const r of rows) map[Number(r.difficulty)] = Number(r.count);
      return map;
    }),
    db.character.findUnique({ where: { userId } }),
    db.skill.findMany({
      where: { userId, parentId: null },
      select: { level: true, realm: true },
    }),
    db.dailyStreak.findMany({ where: { userId }, select: { longestStreak: true } }),
    db.questChain.findMany({
      where: { userId },
      include: {
        quests: {
          select: { status: true, skill: { select: { realm: true, parent: { select: { realm: true } } } } },
        },
      },
    }),
  ]);

  const chainsCompleted = chainsWithQuests.filter(
    (c) => c.quests.length > 0 && c.quests.every((q) => q.status === "completed")
  ).length;

  const activeRealms = new Set(disciplines.map((d) => d.realm).filter(Boolean));

  const crossRealmChains = chainsWithQuests.filter((c) => {
    if (c.quests.length === 0 || !c.quests.every((q) => q.status === "completed")) return false;
    const realms = new Set<string>();
    for (const q of c.quests) {
      const r = q.skill?.realm ?? q.skill?.parent?.realm;
      if (r) realms.add(r);
    }
    return realms.size >= 2;
  }).length;

  return {
    totalCompletions,
    completionsByDifficulty: completionsByDiff,
    chainsCompleted,
    characterLevel: character?.level ?? 1,
    skillCount: disciplines.length,
    skillLevels: disciplines.map((s) => s.level),
    longestStreak: streaks.reduce((max, s) => Math.max(max, s.longestStreak), 0),
    realmsActive: activeRealms.size,
    crossRealmChains,
  };
}

export async function checkAchievements(userId: string): Promise<
  Array<{ key: string; name: string; description: string; icon: string }>
> {
  const stats = await gatherAchievementStats(userId);
  const existing = await db.achievement.findMany({ where: { userId } });
  const existingByKey = new Map(existing.map((a) => [a.key, a]));

  const newlyUnlocked: Array<{
    key: string;
    name: string;
    description: string;
    icon: string;
  }> = [];

  for (const def of ACHIEVEMENTS) {
    const current = existingByKey.get(def.key);
    if (!current || current.unlockedAt) continue;
    if (def.check(stats)) {
      await db.achievement.update({
        where: { userId_key: { userId, key: def.key } },
        data: { unlockedAt: new Date() },
      });
      await db.activityLog.create({
        data: {
          userId,
          type: "achievement_unlock",
          message: `Achievement unlocked: ${def.name}`,
          metadata: JSON.stringify({ key: def.key, icon: def.icon }),
        },
      });
      newlyUnlocked.push({
        key: def.key,
        name: def.name,
        description: def.description,
        icon: def.icon,
      });
    }
  }

  return newlyUnlocked;
}

export async function reconcileAchievements(userId: string): Promise<void> {
  const stats = await gatherAchievementStats(userId);
  const existing = await db.achievement.findMany({ where: { userId } });
  const existingByKey = new Map(existing.map((a) => [a.key, a]));

  for (const def of ACHIEVEMENTS) {
    const current = existingByKey.get(def.key);
    if (!current) continue;

    const shouldBeUnlocked = def.check(stats);
    const isUnlocked = !!current.unlockedAt;

    if (shouldBeUnlocked && !isUnlocked) {
      await db.achievement.update({
        where: { userId_key: { userId, key: def.key } },
        data: { unlockedAt: new Date() },
      });
    } else if (!shouldBeUnlocked && isUnlocked) {
      await db.achievement.update({
        where: { userId_key: { userId, key: def.key } },
        data: { unlockedAt: null },
      });
    }
  }
}
