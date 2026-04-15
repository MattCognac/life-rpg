"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { isStreakBroken } from "@/lib/daily";
import { getAuthUser } from "@/lib/auth";
import { getCharacterForUser } from "@/lib/character";
import { CHARACTER_CLASSES, resolveClass } from "@/lib/classes";
import { getUserTimezone } from "@/lib/timezone";

export async function checkDailyReset(): Promise<void> {
  try {
    const userId = await getAuthUser();
    const tz = await getUserTimezone();
    const character = await getCharacterForUser(userId);
    const charClass = character ? resolveClass(character.class) : "warrior";
    const graceDays = CHARACTER_CLASSES[charClass].perk === "streak_grace" ? 1 : 0;

    const streaks = await db.dailyStreak.findMany({ where: { userId } });
    for (const streak of streaks) {
      if (streak.currentStreak > 0 && isStreakBroken(streak.lastCompleted, tz, graceDays)) {
        await db.dailyStreak.update({
          where: { id: streak.id },
          data: { currentStreak: 0 },
        });
      }
    }
    revalidatePath("/daily");
  } catch (err) {
    console.error("checkDailyReset failed:", err);
  }
}
