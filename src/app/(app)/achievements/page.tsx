import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { AchievementCard } from "@/components/achievements/achievement-card";
import { Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

const CATEGORIES: Array<{ key: string; label: string }> = [
  { key: "general", label: "General" },
  { key: "quests", label: "Quests" },
  { key: "levels", label: "Levels" },
  { key: "skills", label: "Skills" },
  { key: "streaks", label: "Streaks" },
  { key: "difficulty", label: "Difficulty" },
];

export default async function AchievementsPage() {
  const userId = await getAuthUser();
  const achievements = await db.achievement.findMany({
    where: { userId },
    orderBy: { sortOrder: "asc" },
  });

  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;
  const byCategory = new Map<string, typeof achievements>();
  for (const a of achievements) {
    const list = byCategory.get(a.category) ?? [];
    list.push(a);
    byCategory.set(a.category, list);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl tracking-widest uppercase text-gradient-gold">
          Achievements
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-body">
          Trophies of your journey.{" "}
          <span className="text-gold font-display">
            {unlockedCount}/{achievements.length}
          </span>{" "}
          unlocked.
        </p>
      </div>

      {achievements.length === 0 ? (
        <div className="norse-card p-8 text-center">
          <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Achievements will appear as you complete quests and level up.
          </p>
        </div>
      ) : (
        CATEGORIES.map((cat) => {
          const items = byCategory.get(cat.key);
          if (!items || items.length === 0) return null;
          return (
            <div key={cat.key}>
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="font-display text-lg tracking-widest uppercase text-foreground">
                  {cat.label}
                </h2>
                <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
                  {items.filter((a) => a.unlockedAt).length}/{items.length}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((a) => (
                  <AchievementCard key={a.id} achievement={a} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
