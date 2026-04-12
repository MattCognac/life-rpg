"use server";

import { getAuthUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/types";

export async function deleteAccount(): Promise<ActionResult> {
  try {
    const userId = await getAuthUser();

    await db.$transaction([
      db.activityLog.deleteMany({ where: { userId } }),
      db.achievement.deleteMany({ where: { userId } }),
      db.dailyStreak.deleteMany({ where: { userId } }),
      db.questCompletion.deleteMany({ where: { userId } }),
      db.quest.deleteMany({ where: { userId } }),
      db.questChain.deleteMany({ where: { userId } }),
      db.skill.deleteMany({ where: { userId } }),
      db.character.deleteMany({ where: { userId } }),
    ]);

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      console.error("Supabase admin deleteUser failed:", error);
      return { success: false, error: "Failed to remove auth account" };
    }

    return { success: true };
  } catch (err) {
    console.error("deleteAccount failed:", err);
    return { success: false, error: "Failed to delete account" };
  }
}
