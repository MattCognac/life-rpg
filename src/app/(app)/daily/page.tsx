import Link from "next/link";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { DailyQuestCard } from "@/components/daily/daily-quest-card";
import { StreakDisplay } from "@/components/daily/streak-display";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Sun, Plus, Flame } from "lucide-react";
import { isCompletedToday, isDailyActiveToday, isStreakBroken, scheduleLabel } from "@/lib/daily";
import { startOfToday } from "@/lib/utils";
import { getUserTimezone } from "@/lib/timezone";

export const dynamic = "force-dynamic";

export default async function DailyPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const userId = await getAuthUser();
  const tz = await getUserTimezone();
  const { view } = await searchParams;
  const filter = view ?? "today";

  const [, dailyQuests] = await Promise.all([
    db.dailyStreak.findMany({ where: { userId } }).then(async (allStreaks) => {
      const resets = allStreaks
        .filter((s) => s.currentStreak > 0 && isStreakBroken(s.lastCompleted, tz))
        .map((s) => db.dailyStreak.update({ where: { id: s.id }, data: { currentStreak: 0 } }));
      await Promise.all(resets);
    }),
    db.quest.findMany({
      where: { userId, isDaily: true },
      include: {
        skill: true,
        completions: {
          where: { completedAt: { gte: startOfToday(tz) } },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Re-fetch streaks after resets are applied
  const streaks = await db.dailyStreak.findMany({ where: { userId } });
  const streakByQuest = new Map(streaks.map((s) => [s.questId, s]));

  const activeToday = dailyQuests.filter((q) => isDailyActiveToday(q.dailyCron, tz));
  const inactiveToday = dailyQuests.filter((q) => !isDailyActiveToday(q.dailyCron, tz));

  const bestStreak = streaks.reduce(
    (max, s) => Math.max(max, s.currentStreak),
    0
  );
  const totalCompletedToday = activeToday.filter((q) => q.completions.length > 0).length;

  const tabs = [
    { key: "today", label: "Today", count: activeToday.length },
    { key: "scheduled", label: "Not Scheduled", count: inactiveToday.length },
    { key: "all", label: "All", count: dailyQuests.length },
  ];

  let visibleQuests: typeof dailyQuests;
  let showInactive: boolean;
  switch (filter) {
    case "scheduled":
      visibleQuests = inactiveToday;
      showInactive = true;
      break;
    case "all":
      visibleQuests = dailyQuests;
      showInactive = false;
      break;
    default:
      visibleQuests = activeToday;
      showInactive = false;
      break;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-widest uppercase text-gradient-gold w-fit">
            Daily Quests
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-body">
            Show up each day. Build your streak. Reap the rewards.
          </p>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/daily/new">
            <Plus className="w-4 h-4" />
            New Daily
          </Link>
        </Button>
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

      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/daily?view=${tab.key}`}
            className={`px-4 py-2 font-display text-xs uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
              filter === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-[10px] opacity-60">({tab.count})</span>
          </Link>
        ))}
      </div>

      {visibleQuests.length === 0 ? (
        <EmptyState
          Icon={Sun}
          title={filter === "today" ? "Nothing Due Today" : "No Daily Quests"}
          description={
            filter === "today" && inactiveToday.length > 0
              ? "No dailies are scheduled for today. Check the Not Scheduled tab to see your other dailies."
              : "Daily quests reset each day and build streaks. Create one by making a new quest and toggling the daily option."
          }
          action={
            <Button variant="ghost" asChild>
              <Link href="/daily/new">
                <Plus className="w-4 h-4" />
                Create Daily
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleQuests.map((quest) => {
            const isInactive = !isDailyActiveToday(quest.dailyCron, tz);
            return (
              <DailyQuestCard
                key={quest.id}
                quest={quest}
                streak={streakByQuest.get(quest.id) ?? null}
                completedToday={isCompletedToday(quest.completions[0]?.completedAt ?? null, tz)}
                inactive={showInactive || (filter === "all" && isInactive)}
                scheduleName={isInactive ? scheduleLabel(quest.dailyCron) : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
