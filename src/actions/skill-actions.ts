"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import { checkAchievements } from "@/lib/achievements";
import { getAuthUser } from "@/lib/auth";
import { isValidRealm } from "@/lib/realms";
import { computeLevel } from "@/lib/xp";

export async function createSkill(input: {
  realm: string;
  disciplineName: string;
  subSkillName?: string;
  icon?: string;
  color?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await getAuthUser();
    if (!input.disciplineName.trim()) {
      return { success: false, error: "Discipline name is required" };
    }
    if (!isValidRealm(input.realm)) {
      return { success: false, error: "Invalid realm" };
    }

    let discipline = await db.skill.findFirst({
      where: {
        userId,
        name: { equals: input.disciplineName.trim(), mode: "insensitive" },
        parentId: null,
      },
    });

    if (!discipline) {
      discipline = await db.skill.create({
        data: {
          userId,
          name: input.disciplineName.trim(),
          realm: input.realm,
          icon: input.icon ?? "Sword",
          color: input.color ?? "#dd6119",
        },
      });
    }

    if (!input.subSkillName?.trim()) {
      const achievementsUnlocked = await checkAchievements(userId);
      revalidatePath("/skills");
      revalidatePath("/character");
      revalidatePath("/");
      return {
        success: true,
        data: { id: discipline.id },
        events: { achievementsUnlocked },
      };
    }

    const existingSub = await db.skill.findFirst({
      where: {
        userId,
        name: { equals: input.subSkillName.trim(), mode: "insensitive" },
        parentId: discipline.id,
      },
    });

    if (existingSub) {
      return { success: false, error: "A sub-skill with that name already exists under this discipline" };
    }

    const subSkill = await db.skill.create({
      data: {
        userId,
        name: input.subSkillName.trim(),
        parentId: discipline.id,
        icon: input.icon ?? discipline.icon,
        color: input.color ?? discipline.color,
      },
    });

    const achievementsUnlocked = await checkAchievements(userId);
    revalidatePath("/skills");
    revalidatePath("/character");
    revalidatePath("/");
    return {
      success: true,
      data: { id: subSkill.id },
      events: { achievementsUnlocked },
    };
  } catch (err) {
    console.error("createSkill failed:", err);
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique constraint")) {
      return { success: false, error: "A skill with that name already exists" };
    }
    return { success: false, error: "Failed to create skill" };
  }
}

export async function updateSkill(
  id: string,
  input: { name?: string; icon?: string; color?: string; realm?: string }
): Promise<ActionResult> {
  try {
    const userId = await getAuthUser();
    const existing = await db.skill.findFirst({ where: { id, userId } });
    if (!existing) return { success: false, error: "Skill not found" };

    if (input.realm !== undefined && !isValidRealm(input.realm)) {
      return { success: false, error: "Invalid realm" };
    }

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.icon !== undefined) data.icon = input.icon;
    if (input.color !== undefined) data.color = input.color;
    if (input.realm !== undefined && !existing.parentId) data.realm = input.realm;

    await db.skill.update({ where: { id }, data });
    revalidatePath("/skills");
    revalidatePath(`/skills/${id}`);
    revalidatePath("/character");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("updateSkill failed:", err);
    return {
      success: false,
      error: "Failed to update skill",
    };
  }
}

export async function deleteSkill(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUser();
    const existing = await db.skill.findFirst({
      where: { id, userId },
      include: { children: true },
    });
    if (!existing) return { success: false, error: "Skill not found" };

    if (!existing.parentId && existing.children.length > 0) {
      for (const child of existing.children) {
        await db.quest.updateMany({
          where: { skillId: child.id },
          data: { skillId: null },
        });
        await db.skill.delete({ where: { id: child.id } });
      }
    }

    await db.quest.updateMany({
      where: { skillId: id },
      data: { skillId: null },
    });
    await db.skill.delete({ where: { id } });

    revalidatePath("/skills");
    revalidatePath("/character");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("deleteSkill failed:", err);
    return {
      success: false,
      error: "Failed to delete skill",
    };
  }
}

/**
 * After a quest/chain is deleted, clean up orphaned skills:
 * - Sub-skills with zero remaining quests get deleted
 * - Disciplines with zero quests AND zero children get deleted
 * Also refunds XP from parent discipline when a sub-skill's XP changes.
 */
export async function cleanupOrphanedSkill(
  skillId: string,
  userId: string
): Promise<void> {
  const skill = await db.skill.findFirst({
    where: { id: skillId, userId },
    include: { children: true },
  });
  if (!skill) return;

  const questCount = await db.quest.count({
    where: { skillId: skill.id, userId },
  });

  if (skill.parentId) {
    if (questCount === 0) {
      await db.skill.delete({ where: { id: skill.id } });
      await cleanupOrphanedSkill(skill.parentId, userId);
    }
  } else {
    const childCount = await db.skill.count({
      where: { parentId: skill.id },
    });
    if (questCount === 0 && childCount === 0) {
      await db.skill.delete({ where: { id: skill.id } });
    }
  }
}

/**
 * Propagate XP change to parent discipline (denormalized).
 * Call after awarding or refunding XP on a sub-skill.
 */
export async function propagateXpToParent(
  skillId: string,
  xpDelta: number
): Promise<void> {
  const skill = await db.skill.findUnique({
    where: { id: skillId },
    select: { parentId: true },
  });
  if (!skill?.parentId) return;

  const parent = await db.skill.findUnique({
    where: { id: skill.parentId },
  });
  if (!parent) return;

  const newTotal = Math.max(0, parent.totalXp + xpDelta);
  const { level: newLevel } = computeLevel(newTotal);
  await db.skill.update({
    where: { id: parent.id },
    data: { totalXp: newTotal, level: newLevel },
  });
}
