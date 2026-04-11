"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import { checkAchievements } from "@/lib/achievements";
import { getAuthUser } from "@/lib/auth";

export async function createSkill(input: {
  name: string;
  icon?: string;
  color?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await getAuthUser();
    if (!input.name.trim()) {
      return { success: false, error: "Name is required" };
    }
    const skill = await db.skill.create({
      data: {
        userId,
        name: input.name.trim(),
        icon: input.icon ?? "Sword",
        color: input.color ?? "#dd6119",
      },
    });
    const achievementsUnlocked = await checkAchievements(userId);
    revalidatePath("/skills");
    revalidatePath("/character");
    return {
      success: true,
      data: { id: skill.id },
      events: { achievementsUnlocked },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create skill";
    if (msg.includes("Unique constraint")) {
      return { success: false, error: "A skill with that name already exists" };
    }
    return { success: false, error: msg };
  }
}

export async function updateSkill(
  id: string,
  input: { name?: string; icon?: string; color?: string }
): Promise<ActionResult> {
  try {
    const userId = await getAuthUser();
    const existing = await db.skill.findFirst({ where: { id, userId } });
    if (!existing) return { success: false, error: "Skill not found" };
    await db.skill.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.icon !== undefined && { icon: input.icon }),
        ...(input.color !== undefined && { color: input.color }),
      },
    });
    revalidatePath("/skills");
    revalidatePath(`/skills/${id}`);
    revalidatePath("/character");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update",
    };
  }
}

export async function deleteSkill(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUser();
    const existing = await db.skill.findFirst({ where: { id, userId } });
    if (!existing) return { success: false, error: "Skill not found" };
    await db.skill.delete({ where: { id } });
    revalidatePath("/skills");
    revalidatePath("/character");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete",
    };
  }
}
