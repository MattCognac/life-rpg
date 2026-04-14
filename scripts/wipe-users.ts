/**
 * Wipe all user data EXCEPT for the specified keep user.
 *
 * Usage:
 *   npx tsx scripts/wipe-users.ts
 *
 * Finds the user whose character is named "Halt" and preserves all their data.
 * Deletes everything for all other users.
 */

import { PrismaClient } from "@prisma/client";

const KEEP_CHARACTER_NAME = "Halt";

async function main() {
  const db = new PrismaClient({ log: ["error", "warn"] });

  try {
    const keepChar = await db.character.findFirst({
      where: { name: KEEP_CHARACTER_NAME },
    });

    if (!keepChar) {
      console.error(`No character named "${KEEP_CHARACTER_NAME}" found. Aborting.`);
      process.exit(1);
    }

    const keepUserId = keepChar.userId;
    console.log(`Keeping userId: ${keepUserId} (character: ${keepChar.name})`);

    const allCharacters = await db.character.findMany({
      select: { userId: true, name: true },
    });

    const toDelete = allCharacters.filter((c) => c.userId !== keepUserId);

    if (toDelete.length === 0) {
      console.log("No other users to delete. Done.");
      return;
    }

    console.log(`\nWill delete data for ${toDelete.length} user(s):`);
    for (const c of toDelete) {
      console.log(`  - ${c.name} (${c.userId})`);
    }

    const deleteUserIds = toDelete.map((c) => c.userId);
    const notKeep = { userId: { in: deleteUserIds } };

    // Also find quest IDs for these users to clean up QuestSkill
    const questIds = (
      await db.quest.findMany({
        where: notKeep,
        select: { id: true },
      })
    ).map((q) => q.id);

    const skillIds = (
      await db.skill.findMany({
        where: notKeep,
        select: { id: true },
      })
    ).map((s) => s.id);

    // Delete in FK-safe order
    const questCompletions = await db.questCompletion.deleteMany({ where: notKeep });
    console.log(`  QuestCompletion: ${questCompletions.count} deleted`);

    const questSkillsByQuest = await db.questSkill.deleteMany({
      where: { questId: { in: questIds } },
    });
    const questSkillsBySkill = await db.questSkill.deleteMany({
      where: { skillId: { in: skillIds } },
    });
    console.log(`  QuestSkill: ${questSkillsByQuest.count + questSkillsBySkill.count} deleted`);

    const dailyStreaks = await db.dailyStreak.deleteMany({ where: notKeep });
    console.log(`  DailyStreak: ${dailyStreaks.count} deleted`);

    const quests = await db.quest.deleteMany({ where: notKeep });
    console.log(`  Quest: ${quests.count} deleted`);

    // Null out parent refs first to avoid self-FK issues, then delete
    await db.skill.updateMany({
      where: { userId: { in: deleteUserIds }, parentId: { not: null } },
      data: { parentId: null },
    });
    const skills = await db.skill.deleteMany({ where: notKeep });
    console.log(`  Skill: ${skills.count} deleted`);

    const questChains = await db.questChain.deleteMany({ where: notKeep });
    console.log(`  QuestChain: ${questChains.count} deleted`);

    const achievements = await db.achievement.deleteMany({ where: notKeep });
    console.log(`  Achievement: ${achievements.count} deleted`);

    const activityLogs = await db.activityLog.deleteMany({ where: notKeep });
    console.log(`  ActivityLog: ${activityLogs.count} deleted`);

    const characters = await db.character.deleteMany({
      where: { userId: { in: deleteUserIds } },
    });
    console.log(`  Character: ${characters.count} deleted`);

    console.log(`\nDone! Kept all data for "${KEEP_CHARACTER_NAME}" (${keepUserId}).`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error("Wipe script failed:", err);
  process.exit(1);
});
