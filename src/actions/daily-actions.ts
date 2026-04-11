"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { isStreakBroken } from "@/lib/daily";
import { getAuthUser } from "@/lib/auth";

export async function checkDailyReset(): Promise<void> {
  const userId = await getAuthUser();
  const streaks = await db.dailyStreak.findMany({ where: { userId } });
  for (const streak of streaks) {
    if (streak.currentStreak > 0 && isStreakBroken(streak.lastCompleted)) {
      await db.dailyStreak.update({
        where: { id: streak.id },
        data: { currentStreak: 0 },
      });
    }
  }
  revalidatePath("/daily");
}
