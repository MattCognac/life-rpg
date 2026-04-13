"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import { checkAchievements } from "@/lib/achievements";
import { getAuthUser } from "@/lib/auth";
import { isValidDiscipline } from "@/lib/disciplines";
import { propagateXpToParent } from "@/lib/xp-operations";

export { propagateXpToParent };

export async function createSkill(input: {
  discipline: string;
  skillName: string;
  specializationName?: string;
  icon?: string;
  color?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await getAuthUser();
    if (!input.skillName.trim()) {
      return { success: false, error: "Skill name is required" };
    }
    if (!isValidDiscipline(input.discipline)) {
      return { success: false, error: "Invalid discipline" };
    }

    let skill = await db.skill.findFirst({
      where: {
        userId,
        name: { equals: input.skillName.trim(), mode: "insensitive" },
        parentId: null,
      },
    });

    if (!skill) {
      try {
        skill = await db.skill.create({
          data: {
            userId,
            name: input.skillName.trim(),
            discipline: input.discipline,
            icon: input.icon ?? "Sword",
            color: input.color ?? "#dd6119",
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("Unique constraint")) {
          return { success: false, error: "A skill with that name already exists" };
        }
        throw err;
      }
    }

    if (!input.specializationName?.trim()) {
      const achievementsUnlocked = await checkAchievements(userId).catch(() => []);
      revalidatePath("/skills");
      revalidatePath("/character");
      revalidatePath("/");
      return {
        success: true,
        data: { id: skill.id },
        events: { achievementsUnlocked },
      };
    }

    const existingSub = await db.skill.findFirst({
      where: {
        userId,
        name: { equals: input.specializationName!.trim(), mode: "insensitive" },
        parentId: skill.id,
      },
    });

    if (existingSub) {
      return { success: false, error: "A specialization with that name already exists under this skill" };
    }

    try {
      const specialization = await db.skill.create({
        data: {
          userId,
          name: input.specializationName!.trim(),
          parentId: skill.id,
          icon: input.icon ?? skill.icon,
          color: input.color ?? skill.color,
        },
      });

      const achievementsUnlocked = await checkAchievements(userId).catch(() => []);
      revalidatePath("/skills");
      revalidatePath("/character");
      revalidatePath("/");
      return {
        success: true,
        data: { id: specialization.id },
        events: { achievementsUnlocked },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Unique constraint")) {
        return { success: false, error: "A specialization with that name already exists under this skill" };
      }
      throw err;
    }
  } catch (err) {
    console.error("createSkill failed:", err);
    return { success: false, error: "Failed to create skill" };
  }
}

export async function updateSkill(
  id: string,
  input: { name?: string; icon?: string; color?: string; discipline?: string }
): Promise<ActionResult> {
  try {
    const userId = await getAuthUser();
    const existing = await db.skill.findFirst({ where: { id, userId } });
    if (!existing) return { success: false, error: "Skill not found" };

    if (input.discipline !== undefined && !isValidDiscipline(input.discipline)) {
      return { success: false, error: "Invalid discipline" };
    }

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.icon !== undefined) data.icon = input.icon;
    if (input.color !== undefined) data.color = input.color;
    if (input.discipline !== undefined && !existing.parentId) data.discipline = input.discipline;

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
 * - Specializations with zero remaining quests get deleted
 * - Skills with zero quests AND zero children get deleted
 * Also refunds XP from parent skill when a specialization's XP changes.
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

