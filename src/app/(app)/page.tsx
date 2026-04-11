import { db } from "@/lib/db";
import { getCharacterForUser } from "@/lib/character";
import { getAuthUser } from "@/lib/auth";
import { computeLevel, titleForLevel } from "@/lib/xp";
import { XpChart } from "@/components/dashboard/xp-chart";
import { SkillRadar } from "@/components/dashboard/skill-radar";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { QuestTabs } from "@/components/dashboard/quest-tabs";
import { LevelBadge } from "@/components/shared/level-badge";
import { XpBar } from "@/components/shared/xp-bar";
import { Zap, Swords, Flame, Trophy } from "lucide-react";
import { formatNumber, startOfToday } from "@/lib/utils";
import { isDailyActiveToday, isCompletedToday } from "@/lib/daily";

export const dynamic = "force-dynamic";

async function getXpHistory(userId: string): Promise<Array<{ date: string; xp: number }>> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const completions = await db.questCompletion.findMany({
    where: { userId, completedAt: { gte: thirtyDaysAgo } },
    orderBy: { completedAt: "asc" },
  });

  const byDay = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    byDay.set(key, 0);
  }

  for (const c of completions) {
    const key = new Date(c.completedAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    byDay.set(key, (byDay.get(key) ?? 0) + c.xpAwarded);
  }

  return Array.from(byDay.entries()).map(([date, xp]) => ({ date, xp }));
}

export default async function DashboardPage() {
  const userId = await getAuthUser();
  const character = await getCharacterForUser(userId);
  if (!character) return null;

  const { level, currentLevelXp, xpForNextLevel } = computeLevel(character.totalXp);
  const title = titleForLevel(level);

  const [
    xpHistory,
    skills,
    activeQuests,
    dailyQuests,
    activeChains,
    dailyStreaks,
    completionCount,
    longestStreakRow,
    achievementsUnlocked,
    recentActivity,
  ] = await Promise.all([
    getXpHistory(userId),
    db.skill.findMany({ where: { userId }, orderBy: { totalXp: "desc" }, take: 8 }),
    db.quest.findMany({
      where: { userId, status: "active", isDaily: false },
      include: { skill: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    db.quest.findMany({
      where: { userId, isDaily: true },
      include: {
        skill: true,
        completions: {
          where: { completedAt: { gte: startOfToday() } },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.questChain.findMany({
      where: { userId },
      include: { quests: { select: { status: true } } },
      orderBy: { updatedAt: "desc" },
      take: 3,
    }),
    db.dailyStreak.findMany({ where: { userId } }),
    db.questCompletion.count({ where: { userId } }),
    db.dailyStreak.findFirst({ where: { userId }, orderBy: { currentStreak: "desc" } }),
    db.achievement.count({ where: { userId, unlockedAt: { not: null } } }),
    db.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const activeDailies = dailyQuests.filter((q) => isDailyActiveToday(q.dailyCron));
  const streakByQuest = new Map(dailyStreaks.map((s) => [s.questId, s]));
  const incompleteChains = activeChains.filter(
    (c) => c.quests.length === 0 || c.quests.some((q) => q.status !== "completed")
  );

  const radarData = skills.map((s) => ({ skill: s.name, level: s.level }));

  const stats = [
    { label: "Total XP", value: formatNumber(character.totalXp), Icon: Zap },
    { label: "Quests Done", value: formatNumber(completionCount), Icon: Swords },
    {
      label: "Streak",
      value: formatNumber(longestStreakRow?.currentStreak ?? 0),
      Icon: Flame,
    },
    {
      label: "Achievements",
      value: formatNumber(achievementsUnlocked),
      Icon: Trophy,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="norse-card p-6 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 80% 50%, hsl(var(--primary) / 0.3), transparent 60%)",
          }}
        />
        <div className="relative flex flex-col md:flex-row items-center md:items-center gap-6">
          <LevelBadge level={level} size="lg" />
          <div className="flex-1 text-center md:text-left w-full">
            <div className="text-[10px] font-display uppercase tracking-[0.3em] text-muted-foreground">
              {title}
            </div>
            <h1 className="font-display text-2xl md:text-3xl tracking-wider uppercase text-gradient-gold mt-0.5">
              {character.name}
            </h1>
            <div className="mt-3 max-w-md mx-auto md:mx-0">
              <XpBar current={currentLevelXp} max={xpForNextLevel} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, Icon }) => (
          <div key={label} className="norse-card p-4 stat-glow">
            <Icon className="w-5 h-5 text-primary mb-2" />
            <div className="font-display text-2xl text-gold">{value}</div>
            <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground mt-1">
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex">
          <QuestTabs
            dailies={activeDailies.slice(0, 4).map((q) => ({
              quest: q,
              streak: streakByQuest.get(q.id) ?? null,
              completedToday: isCompletedToday(q.completions[0]?.completedAt ?? null),
            }))}
            chains={incompleteChains.slice(0, 4)}
            quests={activeQuests}
          />
        </div>

        <div className="norse-card p-5 h-fit">
          <h2 className="font-display text-sm tracking-widest uppercase text-muted-foreground mb-4">
            Skill Mastery
          </h2>
          {radarData.length >= 3 ? (
            <SkillRadar data={radarData} />
          ) : (
            <div className="h-[260px] flex items-center justify-center text-xs text-muted-foreground text-center px-4">
              Create at least 3 skills to see your skill radar.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="norse-card p-5 lg:col-span-2">
          <h2 className="font-display text-sm tracking-widest uppercase text-muted-foreground mb-4">
            XP Earned — Last 30 Days
          </h2>
          <XpChart data={xpHistory} />
        </div>
        <div className="norse-card p-5 h-fit">
          <h2 className="font-display text-sm tracking-widest uppercase text-muted-foreground mb-4">
            Recent Activity
          </h2>
          <RecentActivity entries={recentActivity} />
        </div>
      </div>
    </div>
  );
}
