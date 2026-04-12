"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import { getAuthUser } from "@/lib/auth";
import { getCharacterForUser } from "@/lib/character";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { CHARACTER_CLASSES, type CharacterClass } from "@/lib/classes";

export async function renameCharacter(name: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUser();
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: "Name is required" };

    const character = await getCharacterForUser(userId);
    if (!character) return { success: false, error: "Character not found" };

    await db.character.update({
      where: { userId },
      data: { name: trimmed },
    });
    revalidatePath("/");
    revalidatePath("/character");
    return { success: true };
  } catch (err) {
    console.error("renameCharacter failed:", err);
    return { success: false, error: "Failed to rename character" };
  }
}

export async function changeClass(newClass: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUser();
    if (!(newClass in CHARACTER_CLASSES)) {
      return { success: false, error: "Invalid class" };
    }

    const character = await getCharacterForUser(userId);
    if (!character) return { success: false, error: "Character not found" };

    await db.character.update({
      where: { userId },
      data: { class: newClass },
    });
    revalidatePath("/");
    revalidatePath("/character");
    return { success: true };
  } catch (err) {
    console.error("changeClass failed:", err);
    return { success: false, error: "Failed to change class" };
  }
}

export async function completeTutorial(): Promise<ActionResult> {
  try {
    const userId = await getAuthUser();
    await db.character.update({
      where: { userId },
      data: { hasCompletedTutorial: true },
    });
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("completeTutorial failed:", err);
    return { success: false, error: "Failed to complete tutorial" };
  }
}

export async function createCharacter(
  name: string,
  characterClass: CharacterClass,
): Promise<ActionResult> {
  try {
    const userId = await getAuthUser();
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: "Name is required" };
    if (!(characterClass in CHARACTER_CLASSES)) {
      return { success: false, error: "Invalid class" };
    }

    const existing = await getCharacterForUser(userId);
    if (existing) return { success: false, error: "Character already exists" };

    await db.character.create({
      data: {
        userId,
        name: trimmed,
        class: characterClass,
      },
    });

    // Seed achievements for this user
    for (const def of ACHIEVEMENTS) {
      await db.achievement.create({
        data: {
          userId,
          key: def.key,
          name: def.name,
          description: def.description,
          icon: def.icon,
          category: def.category,
          sortOrder: def.sortOrder,
        },
      });
    }

    await db.activityLog.create({
      data: {
        userId,
        type: "quest_complete",
        message: "A new hero enters the realm!",
        metadata: JSON.stringify({ event: "character_created" }),
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("createCharacter failed:", err);
    return { success: false, error: "Failed to create character" };
  }
}
