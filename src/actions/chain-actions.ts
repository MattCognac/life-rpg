"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import { getAuthUser } from "@/lib/auth";
import { reconcileAchievements } from "@/lib/achievements";
import { reconcileChainLocks } from "@/actions/quest-actions";
import { cleanupOrphanedSkill } from "@/actions/skill-actions";
import { revalidateApp } from "@/lib/revalidate";
import { refundCharacterXp, refundSkillXp } from "@/lib/xp-operations";
import { CHAIN_TIERS, type ChainTier } from "@/lib/disciplines";

const VALID_TIERS = new Set<string>(CHAIN_TIERS.map((t) => t.slug));

export async function createChain(input: {
  name: string;
  description?: string;
  tier?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await getAuthUser();
    if (!input.name.trim()) return { success: false, error: "Name is required" };
    const tier = input.tier && VALID_TIERS.has(input.tier) ? input.tier : "common";
    const chain = await db.questChain.create({
      data: {
        userId,
        name: input.name.trim(),
        description: input.description ?? "",
        tier,
      },
    });
    revalidatePath("/chains");
    return { success: true, data: { id: chain.id } };
  } catch (err) {
    console.error("createChain failed:", err);
    return {
      success: false,
      error: "Failed to create chain",
    };
  }
}

export async function updateChain(
  id: string,
  input: { name?: string; description?: string; tier?: string }
): Promise<ActionResult> {
  try {
    const userId = await getAuthUser();
    const existing = await db.questChain.findFirst({ where: { id, userId } });
    if (!existing) return { success: false, error: "Chain not found" };
    const validTier = input.tier !== undefined && VALID_TIERS.has(input.tier) ? input.tier : undefined;
    await db.questChain.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.description !== undefined && { description: input.description }),
        ...(validTier !== undefined && { tier: validTier }),
      },
    });
    revalidatePath("/chains");
    revalidatePath(`/chains/${id}`);
    return { success: true };
  } catch (err) {
    console.error("updateChain failed:", err);
    return { success: false, error: "Failed to update chain" };
  }
}

export async function toggleChainStar(chainId: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUser();
    const chain = await db.questChain.findFirst({
      where: { id: chainId, userId },
    });
    if (!chain) return { success: false, error: "Chain not found" };
    const next = !chain.starred;
    await db.questChain.update({
      where: { id: chainId },
      data: {
        starred: next,
        starredAt: next ? new Date() : null,
      },
    });
    revalidatePath("/");
    revalidatePath("/chains");
    revalidatePath(`/chains/${chainId}`);
    return { success: true };
  } catch (err) {
    console.error("toggleChainStar failed:", err);
    return { success: false, error: "Failed to update chain" };
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

    await refundCharacterXp(userId, characterXpRefund);
    for (const [skillId, xp] of skillXpRefund) {
      await refundSkillXp(skillId, xp);
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
      await cleanupOrphanedSkill(skillId, userId);
    }

    await reconcileAchievements(userId);

    revalidateApp();

    return { success: true };
  } catch (err) {
    console.error("deleteChain failed:", err);
    return {
      success: false,
      error: "Failed to delete chain",
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

    await refundCharacterXp(userId, characterXpRefund);
    for (const [skillId, xp] of skillXpRefund) {
      await refundSkillXp(skillId, xp);
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
      await cleanupOrphanedSkill(skillId, userId);
    }

    await reconcileAchievements(userId);

    revalidateApp(`/chains/${chainId}`);

    return { success: true };
  } catch (err) {
    console.error("removeQuestsFromChain failed:", err);
    return {
      success: false,
      error: "Failed to remove quests",
    };
  }
}
