import { db } from "@/lib/db";
import { getCharacterForUser } from "@/lib/character";
import { getAuthUser } from "@/lib/auth";
import { computeLevel, titleForLevel } from "@/lib/xp";
import { CHARACTER_CLASSES, resolveClass } from "@/lib/classes";
import { ClassIcon } from "@/components/shared/class-icon";
import { XpChart } from "@/components/dashboard/xp-chart";
import { SkillRadar } from "@/components/dashboard/skill-radar";
import { ActiveQuests } from "@/components/dashboard/active-quests";
import { DailiesBlock } from "@/components/dashboard/dailies-block";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { AchievementCard } from "@/components/achievements/achievement-card";
import { LevelBadge } from "@/components/shared/level-badge";
import { XpBar } from "@/components/shared/xp-bar";
import { EditCharacter } from "@/components/character/edit-character";
import { Zap, Swords, Flame, Trophy } from "lucide-react";
import { formatNumber, startOfToday } from "@/lib/utils";
import Link from "next/link";
import { isDailyActiveToday, isCompletedToday } from "@/lib/daily";
import { DISCIPLINES } from "@/lib/disciplines";

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

  const [
    character,
    xpHistory,
    disciplines,
    activeQuests,
    dailyQuests,
    dailyStreaks,
    completionCount,
    longestStreakRow,
    achievementsUnlocked,
    activityEntries,
    recentAchievements,
  ] = await Promise.all([
    getCharacterForUser(userId),
    getXpHistory(userId),
    db.skill.findMany({ where: { userId, parentId: null }, orderBy: { totalXp: "desc" } }),
    db.quest.findMany({
      where: { userId, status: "active", isDaily: false },
      include: {
        chain: {
          include: { quests: { select: { status: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
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
    db.dailyStreak.findMany({ where: { userId } }),
    db.questCompletion.count({ where: { userId } }),
    db.dailyStreak.findFirst({ where: { userId }, orderBy: { currentStreak: "desc" } }),
    db.achievement.count({ where: { userId, unlockedAt: { not: null } } }),
    db.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.achievement.findMany({
      where: { userId, unlockedAt: { not: null } },
      orderBy: { unlockedAt: "desc" },
      take: 4,
    }),
  ]);
  if (!character) return null;

  const { level, currentLevelXp, xpForNextLevel } = computeLevel(character.totalXp);
  const title = titleForLevel(level);
  const characterClass = resolveClass(character.class);
  const classDef = CHARACTER_CLASSES[characterClass];

  const activeDailies = dailyQuests.filter((q) => isDailyActiveToday(q.dailyCron));
  const streakByQuest = new Map(dailyStreaks.map((s) => [s.questId, s]));

  const disciplineXpMap = new Map<string, number>();
  for (const d of disciplines) {
    if (!d.discipline) continue;
    disciplineXpMap.set(d.discipline, (disciplineXpMap.get(d.discipline) ?? 0) + d.totalXp);
  }
  const radarData = DISCIPLINES.map((disc) => ({
    discipline: disc.name,
    level: computeLevel(disciplineXpMap.get(disc.slug) ?? 0).level,
    color: disc.color,
  }));

  const stats = [
    { label: "XP", value: formatNumber(character.totalXp), Icon: Zap },
    { label: "Quests", value: formatNumber(completionCount), Icon: Swords },
    { label: "Streak", value: formatNumber(longestStreakRow?.currentStreak ?? 0), Icon: Flame },
    { label: "Trophies", value: formatNumber(achievementsUnlocked), Icon: Trophy },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero card with inline stats */}
      <div data-tutorial="hero" className="norse-card p-6 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 80% 50%, hsl(var(--primary) / 0.3), transparent 60%)",
          }}
        />

        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-border bg-card/60 text-muted-foreground"
            title={`${longestStreakRow?.currentStreak ?? 0} day streak`}
          >
            <Flame className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-display uppercase tracking-widest">
              {longestStreakRow?.currentStreak ?? 0}d
            </span>
          </div>
          <EditCharacter
            currentName={character.name}
            currentClass={characterClass}
          />
        </div>

        <div className="relative flex flex-col md:flex-row items-center md:items-center gap-6">
          <LevelBadge
            level={level}
            size="lg"
            icon={
              <ClassIcon
                characterClass={characterClass}
                className="w-full h-full"
              />
            }
          />
          <div className="flex-1 text-center md:text-left w-full">
            <div className="text-[10px] font-display uppercase tracking-[0.3em] text-muted-foreground">
              {classDef?.name ?? "Adventurer"} &bull; {title}
            </div>
            <h1 className="font-display text-2xl md:text-3xl tracking-wider uppercase text-gradient-gold mt-0.5 w-fit mx-auto md:mx-0">
              {character.name}
            </h1>
            <div className="mt-3 max-w-md mx-auto md:mx-0">
              <XpBar current={currentLevelXp} max={xpForNextLevel} />
            </div>
            <div data-tutorial="stats" className="flex items-center gap-4 md:gap-6 mt-3 justify-center md:justify-start flex-wrap">
              {stats.map(({ label, value, Icon }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                  <span className="font-display text-sm text-gold">{value}</span>
                  <span className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Quests + Dailies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch max-h-[min(75vh,38rem)] min-h-0">
        <div data-tutorial="quests" className="lg:col-span-2 flex min-h-0 min-w-0 w-full">
          <ActiveQuests quests={activeQuests} />
        </div>
        <div data-tutorial="dailies" className="flex min-h-0 min-w-0 w-full">
          <DailiesBlock
            dailies={activeDailies.slice(0, 6).map((q) => ({
              quest: q,
              streak: streakByQuest.get(q.id) ?? null,
              completedToday: isCompletedToday(q.completions[0]?.completedAt ?? null),
            }))}
            totalActive={activeDailies.length}
          />
        </div>
      </div>

      {/* XP Chart + Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch max-h-[min(75vh,38rem)] min-h-0">
        <div className="norse-card p-5 lg:col-span-2 min-h-0 overflow-y-auto">
          <h2 className="font-display text-sm tracking-widest uppercase text-muted-foreground mb-4">
            XP Earned — Last 30 Days
          </h2>
          <XpChart data={xpHistory} />
        </div>
        <div data-tutorial="skills" className="norse-card p-5 min-h-0 overflow-y-auto">
          <h2 className="font-display text-sm tracking-widest uppercase text-muted-foreground mb-4">
            Discipline Mastery
          </h2>
          <SkillRadar data={radarData} />
        </div>
      </div>

      {/* Recent Achievements + Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch max-h-[min(75vh,38rem)] min-h-0">
        <div className="norse-card p-5 lg:col-span-2 min-h-0 overflow-y-auto">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-sm tracking-widest uppercase text-muted-foreground">
              Recent Achievements
            </h2>
            <Link
              href="/achievements"
              className="text-[10px] font-display uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
            >
              View all
            </Link>
          </div>
          {recentAchievements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Trophy className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">
                Complete quests to unlock achievements.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAchievements.map((a) => (
                <AchievementCard key={a.id} achievement={a} />
              ))}
            </div>
          )}
        </div>
        <div className="norse-card p-5 min-h-0 overflow-y-auto">
          <h2 className="font-display text-sm tracking-widest uppercase text-muted-foreground mb-4">
            Activity Log
          </h2>
          <RecentActivity entries={activityEntries} />
        </div>
      </div>
    </div>
  );
}
