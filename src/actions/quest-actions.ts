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
import { isCompletedToday, isStreakBroken } from "@/lib/daily";
import { startOfToday } from "@/lib/utils";

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
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create quest",
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
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update",
    };
  }
}

async function deleteActivityForQuest(questId: string, userId: string): Promise<void> {
  const completionEntry = await db.activityLog.findFirst({
    where: {
      userId,
      type: "quest_complete",
      metadata: { contains: questId },
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
      const character = await getCharacterForUser(userId);
      if (character) {
        const newCharTotal = Math.max(0, character.totalXp - totalXpRefund);
        const { level: newCharLevel } = computeLevel(newCharTotal);
        await db.character.update({
          where: { userId },
          data: {
            totalXp: newCharTotal,
            level: newCharLevel,
            title: titleForLevel(newCharLevel),
          },
        });
      }

      if (quest.skill) {
        const newSkillTotal = Math.max(0, quest.skill.totalXp - totalXpRefund);
        const { level: newSkillLevel } = computeLevel(newSkillTotal);
        await db.skill.update({
          where: { id: quest.skill.id },
          data: { totalXp: newSkillTotal, level: newSkillLevel },
        });
      }
    }

    await db.dailyStreak.deleteMany({ where: { questId: id, userId } });
    await db.quest.delete({ where: { id } });

    if (quest.chainId) {
      await reconcileChainLocks(quest.chainId, userId);
    }

    if (quest.skill) {
      const remainingQuests = await db.quest.count({
        where: { skillId: quest.skill.id, userId },
      });
      if (remainingQuests === 0) {
        await db.skill.delete({ where: { id: quest.skill.id } });
      }
    }

    await reconcileAchievements(userId);

    revalidatePath("/");
    revalidatePath("/quests");
    revalidatePath("/daily");
    revalidatePath("/character");
    revalidatePath("/skills");
    revalidatePath("/achievements");
    if (quest.chainId) revalidatePath(`/chains/${quest.chainId}`);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete",
    };
  }
}

export async function completeQuest(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUser();
    const quest = await db.quest.findFirst({
      where: { id, userId },
      include: { skill: true, chain: true },
    });
    if (!quest) return { success: false, error: "Quest not found" };
    if (quest.status === "locked") return { success: false, error: "Quest is locked" };

    const events: ActionEvents = {};
    let xpToAward = quest.xpReward;

    if (quest.isDaily) {
      const existingToday = await db.questCompletion.findFirst({
        where: {
          questId: id,
          userId,
          completedAt: { gte: startOfToday() },
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
        if (isStreakBroken(streak.lastCompleted)) {
          newStreak = 1;
        } else {
          newStreak = streak.currentStreak + 1;
        }
        const bonus = streakMultiplier(newStreak);
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

    const character = await getCharacterForUser(userId);
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
      });
      if (chainQuests.length > 0 && chainQuests.every((q) => q.status === "completed")) {
        events.chainCompleted = {
          chainId: quest.chainId,
          chainName: quest.chain?.name ?? "Chain",
        };
        await db.activityLog.create({
          data: {
            userId,
            type: "chain_complete",
            message: `Chain completed: ${quest.chain?.name}`,
            metadata: JSON.stringify({ chainId: quest.chainId }),
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

    revalidatePath("/");
    revalidatePath("/quests");
    revalidatePath("/daily");
    revalidatePath("/character");
    revalidatePath("/skills");
    revalidatePath("/achievements");
    if (quest.chainId) revalidatePath(`/chains/${quest.chainId}`);

    return { success: true, events };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to complete quest",
    };
  }
}

export async function undoDailyCompletion(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUser();
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
        completedAt: { gte: startOfToday() },
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
      const newSkillXp = Math.max(0, quest.skill.totalXp - todayCompletion.xpAwarded);
      const { level: newSkillLevel } = computeLevel(newSkillXp);
      await db.skill.update({
        where: { id: quest.skill.id },
        data: { totalXp: newSkillXp, level: newSkillLevel },
      });
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

    revalidatePath("/");
    revalidatePath("/quests");
    revalidatePath("/daily");
    revalidatePath("/character");
    revalidatePath("/skills");
    revalidatePath("/achievements");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to undo",
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
        const newSkillXp = Math.max(0, quest.skill.totalXp - lastCompletion.xpAwarded);
        const { level: newSkillLevel } = computeLevel(newSkillXp);
        await db.skill.update({
          where: { id: quest.skill.id },
          data: { totalXp: newSkillXp, level: newSkillLevel },
        });
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

    revalidatePath("/");
    revalidatePath("/quests");
    revalidatePath("/character");
    revalidatePath("/skills");
    revalidatePath("/achievements");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to undo",
    };
  }
}
