"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import { computeLevel, titleForLevel } from "@/lib/xp";
import { getCharacterForUser } from "@/lib/character";
import { getAuthUser } from "@/lib/auth";
import { reconcileAchievements } from "@/lib/achievements";
import { reconcileChainLocks } from "@/actions/quest-actions";

export async function createChain(input: {
  name: string;
  description?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await getAuthUser();
    if (!input.name.trim()) return { success: false, error: "Name is required" };
    const chain = await db.questChain.create({
      data: {
        userId,
        name: input.name.trim(),
        description: input.description ?? "",
      },
    });
    revalidatePath("/chains");
    return { success: true, data: { id: chain.id } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed",
    };
  }
}

export async function updateChain(
  id: string,
  input: { name?: string; description?: string }
): Promise<ActionResult> {
  try {
    const userId = await getAuthUser();
    const existing = await db.questChain.findFirst({ where: { id, userId } });
    if (!existing) return { success: false, error: "Chain not found" };
    await db.questChain.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.description !== undefined && { description: input.description }),
      },
    });
    revalidatePath("/chains");
    revalidatePath(`/chains/${id}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function deleteChain(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUser();
    const chain = await db.questChain.findFirst({
      where: { id, userId },
      include: {
        quests: {
          include: { completions: true },
        },
      },
    });
    if (!chain) return { success: false, error: "Chain not found" };

    let characterXpRefund = 0;
    const skillXpRefund = new Map<string, number>();

    for (const quest of chain.quests) {
      const questRefund = quest.completions.reduce(
        (sum, c) => sum + c.xpAwarded,
        0,
      );
      if (questRefund === 0) continue;
      characterXpRefund += questRefund;
      if (quest.skillId) {
        skillXpRefund.set(
          quest.skillId,
          (skillXpRefund.get(quest.skillId) ?? 0) + questRefund,
        );
      }
    }

    if (characterXpRefund > 0) {
      const character = await getCharacterForUser(userId);
      if (character) {
        const newTotal = Math.max(0, character.totalXp - characterXpRefund);
        const { level: newLevel } = computeLevel(newTotal);
        await db.character.update({
          where: { userId },
          data: {
            totalXp: newTotal,
            level: newLevel,
            title: titleForLevel(newLevel),
          },
        });
      }
    }

    for (const [skillId, xp] of skillXpRefund) {
      const skill = await db.skill.findUnique({ where: { id: skillId } });
      if (!skill) continue;
      const newTotal = Math.max(0, skill.totalXp - xp);
      const { level: newLevel } = computeLevel(newTotal);
      await db.skill.update({
        where: { id: skillId },
        data: { totalXp: newTotal, level: newLevel },
      });
    }

    for (const quest of chain.quests) {
      await db.dailyStreak.deleteMany({ where: { questId: quest.id, userId } });
    }

    const affectedSkillIds = [
      ...new Set(chain.quests.map((q) => q.skillId).filter(Boolean)),
    ] as string[];

    await db.quest.deleteMany({ where: { chainId: id, userId } });
    await db.questChain.delete({ where: { id } });

    for (const skillId of affectedSkillIds) {
      const remaining = await db.quest.count({ where: { skillId, userId } });
      if (remaining === 0) {
        await db.skill.delete({ where: { id: skillId } });
      }
    }

    await reconcileAchievements(userId);

    revalidatePath("/");
    revalidatePath("/chains");
    revalidatePath("/quests");
    revalidatePath("/character");
    revalidatePath("/skills");
    revalidatePath("/achievements");

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete chain",
    };
  }
}

export async function removeQuestsFromChain(
  chainId: string,
  questIds: string[]
): Promise<ActionResult> {
  try {
    const userId = await getAuthUser();
    if (questIds.length === 0) {
      return { success: false, error: "No quests selected" };
    }

    const quests = await db.quest.findMany({
      where: { id: { in: questIds }, chainId, userId },
      include: { completions: true, skill: true },
    });
    if (quests.length === 0) {
      return { success: false, error: "No matching quests found" };
    }

    let characterXpRefund = 0;
    const skillXpRefund = new Map<string, number>();

    for (const quest of quests) {
      const questRefund = quest.completions.reduce(
        (sum, c) => sum + c.xpAwarded,
        0
      );
      if (questRefund > 0) {
        characterXpRefund += questRefund;
        if (quest.skillId) {
          skillXpRefund.set(
            quest.skillId,
            (skillXpRefund.get(quest.skillId) ?? 0) + questRefund
          );
        }
      }
      await db.dailyStreak.deleteMany({ where: { questId: quest.id, userId } });
    }

    if (characterXpRefund > 0) {
      const character = await getCharacterForUser(userId);
      if (character) {
        const newTotal = Math.max(0, character.totalXp - characterXpRefund);
        const { level: newLevel } = computeLevel(newTotal);
        await db.character.update({
          where: { userId },
          data: {
            totalXp: newTotal,
            level: newLevel,
            title: titleForLevel(newLevel),
          },
        });
      }
    }

    for (const [skillId, xp] of skillXpRefund) {
      const skill = await db.skill.findUnique({ where: { id: skillId } });
      if (!skill) continue;
      const newTotal = Math.max(0, skill.totalXp - xp);
      const { level: newLevel } = computeLevel(newTotal);
      await db.skill.update({
        where: { id: skillId },
        data: { totalXp: newTotal, level: newLevel },
      });
    }

    const affectedSkillIds = [
      ...new Set(quests.map((q) => q.skillId).filter(Boolean)),
    ] as string[];

    await db.quest.deleteMany({ where: { id: { in: questIds } } });

    const remaining = await db.quest.findMany({
      where: { chainId, userId },
      orderBy: { chainOrder: "asc" },
    });
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].chainOrder !== i) {
        await db.quest.update({
          where: { id: remaining[i].id },
          data: { chainOrder: i },
        });
      }
    }

    await reconcileChainLocks(chainId, userId);

    for (const skillId of affectedSkillIds) {
      const count = await db.quest.count({ where: { skillId, userId } });
      if (count === 0) {
        await db.skill.delete({ where: { id: skillId } });
      }
    }

    await reconcileAchievements(userId);

    revalidatePath("/");
    revalidatePath("/chains");
    revalidatePath(`/chains/${chainId}`);
    revalidatePath("/quests");
    revalidatePath("/character");
    revalidatePath("/skills");
    revalidatePath("/achievements");

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to remove quests",
    };
  }
}
