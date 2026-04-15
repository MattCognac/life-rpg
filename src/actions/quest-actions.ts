"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { ActionResult, ActionEvents } from "@/types";
import {
  XP_BY_DIFFICULTY,
  computeLevel,
  streakMultiplier,
  titleForLevel,
} from "@/lib/xp";
import { checkAchievements, reconcileAchievements } from "@/lib/achievements";
import { getCharacterForUser } from "@/lib/character";
import { getAuthUser } from "@/lib/auth";
import { isStreakBroken } from "@/lib/daily";
import { startOfToday } from "@/lib/utils";
import { getUserTimezone } from "@/lib/timezone";
import { cleanupOrphanedSkill, propagateXpToParent } from "@/actions/skill-actions";
import { CHAIN_TIER_BONUS, type ChainTier } from "@/lib/disciplines";
import { revalidateApp } from "@/lib/revalidate";
import {
  refundCharacterXp,
  refundSkillXp,
  awardSecondarySkillXp,
  refundSecondarySkillXp,
} from "@/lib/xp-operations";
import {
  CHARACTER_CLASSES,
  resolveClass,
  applyClassXpModifiers,
} from "@/lib/classes";

export async function createQuest(input: {
  title: string;
  description?: string;
  difficulty: number;
  xpReward?: number;
  skillId?: string | null;
  chainId?: string | null;
  chainOrder?: number | null;
  isDaily?: boolean;
  dailyCron?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await getAuthUser();
    if (!input.title.trim()) {
      return { success: false, error: "Title is required" };
    }
    const difficulty = Math.max(1, Math.min(5, input.difficulty || 2));
    const xpReward = XP_BY_DIFFICULTY[difficulty];

    if (input.chainId) {
      const chain = await db.questChain.findFirst({ where: { id: input.chainId, userId } });
      if (!chain) return { success: false, error: "Chain not found" };
    }
    if (input.skillId) {
      const skill = await db.skill.findFirst({
        where: { id: input.skillId, userId },
        include: { parent: { select: { discipline: true } } },
      });
      if (!skill) return { success: false, error: "Skill not found" };
    }

    if (input.chainId && input.chainOrder != null) {
      const existing = await db.quest.findMany({
        where: { chainId: input.chainId, chainOrder: { gte: input.chainOrder }, userId },
        orderBy: { chainOrder: "desc" },
      });
      for (const q of existing) {
        await db.quest.update({
          where: { id: q.id },
          data: { chainOrder: (q.chainOrder ?? 0) + 1 },
        });
      }
    }

    let status = "active";
    if (input.chainId && input.chainOrder != null && input.chainOrder > 0) {
      status = "locked";
    }

    const quest = await db.quest.create({
      data: {
        userId,
        title: input.title.trim(),
        description: input.description ?? "",
        difficulty,
        xpReward,
        status,
        skillId: input.skillId ?? null,
        chainId: input.chainId ?? null,
        chainOrder: input.chainOrder ?? null,
        isDaily: input.isDaily ?? false,
        dailyCron: input.dailyCron ?? null,
      },
    });

    if (input.isDaily) {
      await db.dailyStreak.create({
        data: { userId, questId: quest.id },
      });
    }

    if (input.chainId) {
      await reconcileChainLocks(input.chainId, userId);
      revalidatePath(`/chains/${input.chainId}`);
    }
    revalidatePath("/quests");
    revalidatePath("/daily");
    return { success: true, data: { id: quest.id } };
  } catch (err) {
    console.error("createQuest failed:", err);
    return {
      success: false,
      error: "Failed to create quest",
    };
  }
}

export async function updateQuest(
  id: string,
  input: Partial<{
    title: string;
    description: string;
    difficulty: number;
    xpReward: number;
    skillId: string | null;
  }>
): Promise<ActionResult> {
  try {
    const userId = await getAuthUser();
    const data = { ...input };
    if (data.difficulty != null) {
      data.xpReward = XP_BY_DIFFICULTY[data.difficulty];
    }
    const existing = await db.quest.findFirst({ where: { id, userId } });
    if (!existing) return { success: false, error: "Quest not found" };
    if (data.skillId) {
      const skill = await db.skill.findFirst({ where: { id: data.skillId, userId } });
      if (!skill) return { success: false, error: "Skill not found" };
    }
    await db.quest.update({
      where: { id },
      data,
    });
    revalidatePath("/");
    revalidatePath("/quests");
    revalidatePath(`/quests/${id}`);
    revalidatePath("/daily");
    return { success: true };
  } catch (err) {
    console.error("updateQuest failed:", err);
    return {
      success: false,
      error: "Failed to update quest",
    };
  }
}

async function deleteActivityForQuest(questId: string, userId: string): Promise<void> {
  const metadataKey = `"questId":"${questId}"`;
  const completionEntry = await db.activityLog.findFirst({
    where: {
      userId,
      type: "quest_complete",
      metadata: { contains: metadataKey },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!completionEntry) return;

  const windowEnd = new Date(completionEntry.createdAt.getTime() + 2000);

  await db.activityLog.deleteMany({
    where: {
      userId,
      createdAt: { gte: completionEntry.createdAt, lte: windowEnd },
      type: {
        in: [
          "quest_complete",
          "level_up",
          "skill_level_up",
          "achievement_unlock",
          "chain_complete",
        ],
      },
    },
  });
}

export async function updateQuestSecondarySkills(
  questId: string,
  skillIds: string[],
): Promise<ActionResult> {
  try {
    const userId = await getAuthUser();
    const quest = await db.quest.findFirst({ where: { id: questId, userId } });
    if (!quest) return { success: false, error: "Quest not found" };

    if (skillIds.length > 2) {
      return { success: false, error: "Maximum 2 secondary skills" };
    }

    const primaryId = quest.skillId;
    const filtered = skillIds.filter((id) => id !== primaryId);

    for (const sid of filtered) {
      const skill = await db.skill.findFirst({ where: { id: sid, userId } });
      if (!skill) return { success: false, error: "Skill not found" };
    }

    await db.questSkill.deleteMany({ where: { questId } });
    for (const sid of filtered) {
      await db.questSkill.create({ data: { questId, skillId: sid } });
    }

    revalidateApp(`/quests/${questId}`);
    return { success: true };
  } catch (err) {
    console.error("updateQuestSecondarySkills failed:", err);
    return { success: false, error: "Failed to update secondary skills" };
  }
}

export async function reconcileChainLocks(chainId: string, userId: string): Promise<void> {
  const quests = await db.quest.findMany({
    where: { chainId, userId },
    orderBy: { chainOrder: "asc" },
  });
  let foundFirstIncomplete = false;
  for (const q of quests) {
    if (q.status === "completed") continue;
    if (!foundFirstIncomplete) {
      if (q.status !== "active") {
        await db.quest.update({ where: { id: q.id }, data: { status: "active" } });
      }
      foundFirstIncomplete = true;
    } else {
      if (q.status !== "locked") {
        await db.quest.update({ where: { id: q.id }, data: { status: "locked" } });
      }
    }
  }
}

export async function deleteQuest(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUser();
    const quest = await db.quest.findFirst({
      where: { id, userId },
      include: { completions: true, skill: true },
    });
    if (!quest) return { success: false, error: "Quest not found" };

    const totalXpRefund = quest.completions.reduce(
      (sum, c) => sum + c.xpAwarded,
      0,
    );

    if (totalXpRefund > 0) {
      await refundCharacterXp(userId, totalXpRefund);
      if (quest.skill) {
        const character = await getCharacterForUser(userId);
        const charClass = character ? resolveClass(character.class) : "warrior";
        const pMult = CHARACTER_CLASSES[charClass].perk === "deep_craft" ? 2 : 1;
        await refundSkillXp(quest.skill.id, totalXpRefund, pMult);
        await refundSecondarySkillXp(id, totalXpRefund, pMult);
      }
    }

    await db.dailyStreak.deleteMany({ where: { questId: id, userId } });
    await db.quest.delete({ where: { id } });

    if (quest.chainId) {
      await reconcileChainLocks(quest.chainId, userId);
    }

    if (quest.skill) {
      await cleanupOrphanedSkill(quest.skill.id, userId);
    }

    await reconcileAchievements(userId);

    revalidateApp(
      ...(quest.chainId ? [`/chains/${quest.chainId}`] : []),
    );
    return { success: true };
  } catch (err) {
    console.error("deleteQuest failed:", err);
    return {
      success: false,
      error: "Failed to delete quest",
    };
  }
}

export async function completeQuest(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUser();
    const tz = await getUserTimezone();
    const quest = await db.quest.findFirst({
      where: { id, userId },
      include: {
        skill: { include: { parent: { select: { discipline: true } } } },
        chain: true,
      },
    });
    if (!quest) return { success: false, error: "Quest not found" };
    if (quest.status === "locked") return { success: false, error: "Quest is locked" };

    const character = await getCharacterForUser(userId);
    const characterClass = character ? resolveClass(character.class) : "warrior";
    const classDef = CHARACTER_CLASSES[characterClass];
    const questDiscipline = quest.skill?.discipline ?? quest.skill?.parent?.discipline ?? null;

    const events: ActionEvents = {};
    let xpToAward = quest.xpReward;

    if (quest.isDaily) {
      const existingToday = await db.questCompletion.findFirst({
        where: {
          questId: id,
          userId,
          completedAt: { gte: startOfToday(tz) },
        },
      });
      if (existingToday) {
        return { success: false, error: "Already completed today" };
      }

      const streak = await db.dailyStreak.findUnique({
        where: { userId_questId: { userId, questId: id } },
      });
      if (streak) {
        let newStreak: number;
        const graceDays = classDef.perk === "streak_grace" ? 1 : 0;
        if (isStreakBroken(streak.lastCompleted, tz, graceDays)) {
          newStreak = 1;
        } else {
          newStreak = streak.currentStreak + 1;
        }
        const earlyStreak = classDef.perk === "early_streak";
        const bonus = streakMultiplier(newStreak, earlyStreak);
        xpToAward = Math.round(quest.xpReward * bonus);

        await db.dailyStreak.update({
          where: { userId_questId: { userId, questId: id } },
          data: {
            currentStreak: newStreak,
            longestStreak: Math.max(streak.longestStreak, newStreak),
            lastCompleted: new Date(),
          },
        });
        events.streakUpdate = { questId: id, newStreak };
      }
    }

    xpToAward = applyClassXpModifiers({
      baseXp: xpToAward,
      characterClass,
      discipline: questDiscipline,
      difficulty: quest.difficulty,
      isDaily: quest.isDaily,
      isChainQuest: !!quest.chainId,
    });

    events.xpAwarded = xpToAward;

    await db.questCompletion.create({
      data: { userId, questId: id, xpAwarded: xpToAward },
    });

    if (!quest.isDaily) {
      await db.quest.update({
        where: { id },
        data: { status: "completed", completedAt: new Date() },
      });
    }

    if (character) {
      const newTotalXp = character.totalXp + xpToAward;
      const { level: newLevel } = computeLevel(newTotalXp);
      const newTitle = titleForLevel(newLevel);
      if (newLevel > character.level) {
        events.leveledUp = { newLevel, newTitle };
      }
      await db.character.update({
        where: { userId },
        data: { totalXp: newTotalXp, level: newLevel, title: newTitle },
      });
    }

    if (quest.skill) {
      const newSkillXp = quest.skill.totalXp + xpToAward;
      const { level: newSkillLevel } = computeLevel(newSkillXp);
      if (newSkillLevel > quest.skill.level) {
        events.skillLeveledUp = {
          skillId: quest.skill.id,
          skillName: quest.skill.name,
          newLevel: newSkillLevel,
        };
      }
      await db.skill.update({
        where: { id: quest.skill.id },
        data: { totalXp: newSkillXp, level: newSkillLevel },
      });
      const propagationMultiplier = classDef.perk === "deep_craft" ? 2 : 1;
      await propagateXpToParent(quest.skill.id, xpToAward * propagationMultiplier);
      await awardSecondarySkillXp(id, xpToAward, propagationMultiplier);
    }

    if (quest.chainId && quest.chainOrder != null) {
      const next = await db.quest.findFirst({
        where: {
          chainId: quest.chainId,
          chainOrder: quest.chainOrder + 1,
          status: "locked",
          userId,
        },
      });
      if (next) {
        await db.quest.update({
          where: { id: next.id },
          data: { status: "active" },
        });
      }
      const chainQuests = await db.quest.findMany({
        where: { chainId: quest.chainId, userId },
        include: { completions: { take: 1 } },
      });
      const allDone = chainQuests.length > 0 && chainQuests.every((q) =>
        q.status === "completed" || (q.isDaily && q.completions.length > 0)
      );
      if (allDone) {
        events.chainCompleted = {
          chainId: quest.chainId,
          chainName: quest.chain?.name ?? "Chain",
        };

        const tier = (quest.chain?.tier ?? "common") as ChainTier;
        let bonusMultiplier = CHAIN_TIER_BONUS[tier] ?? 0;
        if (classDef.perk === "chain_bonus") bonusMultiplier += 0.15;
        if (bonusMultiplier > 0) {
          const chainTotalXp = chainQuests.reduce((sum, q) => sum + q.xpReward, 0);
          const bonusXp = Math.round(chainTotalXp * bonusMultiplier);
          if (bonusXp > 0) {
            const charAfter = await getCharacterForUser(userId);
            if (charAfter) {
              const newBonusTotal = charAfter.totalXp + bonusXp;
              const { level: bonusLevel } = computeLevel(newBonusTotal);
              await db.character.update({
                where: { userId },
                data: {
                  totalXp: newBonusTotal,
                  level: bonusLevel,
                  title: titleForLevel(bonusLevel),
                },
              });
            }
            events.xpAwarded = (events.xpAwarded ?? 0) + bonusXp;
          }
        }

        await db.activityLog.create({
          data: {
            userId,
            type: "chain_complete",
            message: `Chain completed: ${quest.chain?.name}`,
            metadata: JSON.stringify({ chainId: quest.chainId, tier }),
          },
        });
      }
    }

    await db.activityLog.create({
      data: {
        userId,
        type: "quest_complete",
        message: `Completed: ${quest.title}`,
        metadata: JSON.stringify({
          questId: id,
          xp: xpToAward,
          difficulty: quest.difficulty,
        }),
      },
    });
    if (events.leveledUp) {
      await db.activityLog.create({
        data: {
          userId,
          type: "level_up",
          message: `Reached level ${events.leveledUp.newLevel} — ${events.leveledUp.newTitle}`,
          metadata: JSON.stringify(events.leveledUp),
        },
      });
    }
    if (events.skillLeveledUp) {
      await db.activityLog.create({
        data: {
          userId,
          type: "skill_level_up",
          message: `${events.skillLeveledUp.skillName} reached level ${events.skillLeveledUp.newLevel}`,
          metadata: JSON.stringify(events.skillLeveledUp),
        },
      });
    }

    events.achievementsUnlocked = await checkAchievements(userId);

    revalidateApp(
      ...(quest.chainId ? [`/chains/${quest.chainId}`] : []),
    );

    return { success: true, events };
  } catch (err) {
    console.error("completeQuest failed:", err);
    return {
      success: false,
      error: "Failed to complete quest",
    };
  }
}

export async function undoDailyCompletion(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUser();
    const tz = await getUserTimezone();
    const quest = await db.quest.findFirst({
      where: { id, userId },
      include: { skill: true },
    });
    if (!quest || !quest.isDaily) {
      return { success: false, error: "Not a daily quest" };
    }

    const todayCompletion = await db.questCompletion.findFirst({
      where: {
        questId: id,
        userId,
        completedAt: { gte: startOfToday(tz) },
      },
      orderBy: { completedAt: "desc" },
    });
    if (!todayCompletion) {
      return { success: false, error: "No completion to undo today" };
    }

    await db.questCompletion.delete({ where: { id: todayCompletion.id } });

    const character = await getCharacterForUser(userId);
    if (character) {
      const newTotalXp = Math.max(0, character.totalXp - todayCompletion.xpAwarded);
      const { level: newLevel } = computeLevel(newTotalXp);
      await db.character.update({
        where: { userId },
        data: {
          totalXp: newTotalXp,
          level: newLevel,
          title: titleForLevel(newLevel),
        },
      });
    }

    if (quest.skill) {
      const charClass = character ? resolveClass(character.class) : "warrior";
      const pMult = CHARACTER_CLASSES[charClass].perk === "deep_craft" ? 2 : 1;
      const newSkillXp = Math.max(0, quest.skill.totalXp - todayCompletion.xpAwarded);
      const { level: newSkillLevel } = computeLevel(newSkillXp);
      await db.skill.update({
        where: { id: quest.skill.id },
        data: { totalXp: newSkillXp, level: newSkillLevel },
      });
      await propagateXpToParent(quest.skill.id, -todayCompletion.xpAwarded * pMult);
      await refundSecondarySkillXp(id, todayCompletion.xpAwarded, pMult);
    }

    const streak = await db.dailyStreak.findUnique({
      where: { userId_questId: { userId, questId: id } },
    });
    if (streak && streak.currentStreak > 0) {
      await db.dailyStreak.update({
        where: { userId_questId: { userId, questId: id } },
        data: { currentStreak: streak.currentStreak - 1 },
      });
    }

    await deleteActivityForQuest(id, userId);
    await reconcileAchievements(userId);

    revalidateApp();
    return { success: true };
  } catch (err) {
    console.error("undoDailyCompletion failed:", err);
    return {
      success: false,
      error: "Failed to undo completion",
    };
  }
}

export async function uncompleteQuest(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUser();
    const quest = await db.quest.findFirst({
      where: { id, userId },
      include: { skill: true },
    });
    if (!quest || quest.status !== "completed") {
      return { success: false, error: "Quest is not completed" };
    }

    const lastCompletion = await db.questCompletion.findFirst({
      where: { questId: id, userId },
      orderBy: { completedAt: "desc" },
    });
    if (lastCompletion) {
      await db.questCompletion.delete({ where: { id: lastCompletion.id } });

      const character = await getCharacterForUser(userId);
      if (character) {
        const newTotalXp = Math.max(0, character.totalXp - lastCompletion.xpAwarded);
        const { level: newLevel } = computeLevel(newTotalXp);
        await db.character.update({
          where: { userId },
          data: {
            totalXp: newTotalXp,
            level: newLevel,
            title: titleForLevel(newLevel),
          },
        });
      }

      if (quest.skill) {
        const charClass = character ? resolveClass(character.class) : "warrior";
        const pMult = CHARACTER_CLASSES[charClass].perk === "deep_craft" ? 2 : 1;
        const newSkillXp = Math.max(0, quest.skill.totalXp - lastCompletion.xpAwarded);
        const { level: newSkillLevel } = computeLevel(newSkillXp);
        await db.skill.update({
          where: { id: quest.skill.id },
          data: { totalXp: newSkillXp, level: newSkillLevel },
        });
        await propagateXpToParent(quest.skill.id, -lastCompletion.xpAwarded * pMult);
        await refundSecondarySkillXp(id, lastCompletion.xpAwarded, pMult);
      }
    }

    await db.quest.update({
      where: { id },
      data: { status: "active", completedAt: null },
    });

    await deleteActivityForQuest(id, userId);

    if (quest.chainId) {
      await reconcileChainLocks(quest.chainId, userId);
      revalidatePath(`/chains/${quest.chainId}`);
    }

    await reconcileAchievements(userId);

    revalidateApp();
    return { success: true };
  } catch (err) {
    console.error("uncompleteQuest failed:", err);
    return {
      success: false,
      error: "Failed to undo completion",
    };
  }
}
