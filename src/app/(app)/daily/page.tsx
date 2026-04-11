import Link from "next/link";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { DailyQuestCard } from "@/components/daily/daily-quest-card";
import { StreakDisplay } from "@/components/daily/streak-display";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Sun, Plus, Flame } from "lucide-react";
import { isCompletedToday, isDailyActiveToday, isStreakBroken } from "@/lib/daily";
import { startOfToday } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DailyPage() {
  const userId = await getAuthUser();

  const allStreaks = await db.dailyStreak.findMany({ where: { userId } });
  for (const s of allStreaks) {
    if (s.currentStreak > 0 && isStreakBroken(s.lastCompleted)) {
      await db.dailyStreak.update({
        where: { id: s.id },
        data: { currentStreak: 0 },
      });
    }
  }

  const dailyQuests = await db.quest.findMany({
    where: { userId, isDaily: true },
    include: {
      skill: true,
      completions: {
        where: { completedAt: { gte: startOfToday() } },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const streaks = await db.dailyStreak.findMany({ where: { userId } });
  const streakByQuest = new Map(streaks.map((s) => [s.questId, s]));

  const activeToday = dailyQuests.filter((q) => isDailyActiveToday(q.dailyCron));

  const bestStreak = streaks.reduce(
    (max, s) => Math.max(max, s.currentStreak),
    0
  );
  const totalCompletedToday = activeToday.filter((q) => q.completions.length > 0).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-widest uppercase text-gradient-gold">
            Daily Quests
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-body">
            Show up each day. Build your streak. Reap the rewards.
          </p>
        </div>
        <Link href="/quests/new">
          <Button variant="ghost">
            <Plus className="w-4 h-4" />
            New Daily
          </Button>
        </Link>
      </div>

      {activeToday.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="norse-card p-4 stat-glow">
            <Flame className="w-5 h-5 text-primary mb-2" />
            <div className="font-display text-2xl text-gold">
              {bestStreak}
            </div>
            <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
              Current Best Streak
            </div>
          </div>
          <div className="norse-card p-4 stat-glow">
            <Sun className="w-5 h-5 text-primary mb-2" />
            <div className="font-display text-2xl text-gold">
              {totalCompletedToday}/{activeToday.length}
            </div>
            <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
              Today
            </div>
          </div>
          <div className="norse-card p-4 stat-glow hidden md:block">
            <StreakDisplay streak={bestStreak} size="lg" />
            <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground mt-2">
              Keep It Burning
            </div>
          </div>
        </div>
      )}

      {activeToday.length === 0 ? (
        <EmptyState
          Icon={Sun}
          title="No Daily Quests"
          description="Daily quests reset each day and build streaks. Create one by making a new quest and toggling the daily option."
          action={
            <Link href="/quests/new">
              <Button variant="ghost">
                <Plus className="w-4 h-4" />
                Create Daily
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeToday.map((quest) => (
            <DailyQuestCard
              key={quest.id}
              quest={quest}
              streak={streakByQuest.get(quest.id) ?? null}
              completedToday={isCompletedToday(quest.completions[0]?.completedAt ?? null)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
