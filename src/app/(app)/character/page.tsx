import { db } from "@/lib/db";
import { computeLevel, titleForLevel } from "@/lib/xp";
import { getCharacterForUser } from "@/lib/character";
import { getAuthUser } from "@/lib/auth";
import { CHARACTER_CLASSES, resolveClass } from "@/lib/classes";
import { ClassIcon } from "@/components/shared/class-icon";
import { XpBar } from "@/components/shared/xp-bar";
import { LevelBadge } from "@/components/shared/level-badge";
import { SkillForm } from "@/components/skills/skill-form";
import { EditCharacter } from "@/components/character/edit-character";
import { CharacterIdentity } from "@/components/character/character-identity";
import { ActiveChains } from "@/components/character/active-chains";
import { RecentTrophies } from "@/components/character/recent-trophies";
import { UpcomingTrophies } from "@/components/character/upcoming-trophies";
import { CharacterSections } from "@/components/character/character-sections";
import { DISCIPLINES } from "@/lib/disciplines";
import { getUpcomingAchievements } from "@/lib/achievements";
import { Zap, Swords, Flame, Trophy, Calendar } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CharacterPage() {
  const userId = await getAuthUser();

  const [
    character,
    skills,
    completionCount,
    longestStreakRow,
    achievementsUnlocked,
    activeChains,
    recentAchievements,
    upcomingAchievements,
  ] = await Promise.all([
    getCharacterForUser(userId),
    db.skill.findMany({
      where: { userId, parentId: null },
      include: { children: { orderBy: { totalXp: "desc" } } },
      orderBy: { totalXp: "desc" },
    }),
    db.questCompletion.count({ where: { userId } }),
    db.dailyStreak.findFirst({ where: { userId }, orderBy: { longestStreak: "desc" } }),
    db.achievement.count({ where: { userId, unlockedAt: { not: null } } }),
    db.questChain.findMany({
      where: { userId },
      include: { quests: { select: { status: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.achievement.findMany({
      where: { userId, unlockedAt: { not: null } },
      orderBy: { unlockedAt: "desc" },
      take: 3,
    }),
    getUpcomingAchievements(userId, 3),
  ]);
  if (!character) return null;

  const { level, currentLevelXp, xpForNextLevel } = computeLevel(character.totalXp);
  const title = titleForLevel(level);
  const characterClass = resolveClass(character.class);
  const classDef = CHARACTER_CLASSES[characterClass];

  const daysActive = Math.floor(
    (Date.now() - new Date(character.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  const stats = [
    { label: "Total XP", value: formatNumber(character.totalXp), Icon: Zap },
    { label: "Quests Done", value: formatNumber(completionCount), Icon: Swords },
    {
      label: "Best Streak",
      value: formatNumber(longestStreakRow?.longestStreak ?? 0),
      Icon: Flame,
    },
    {
      label: "Achievements",
      value: formatNumber(achievementsUnlocked),
      Icon: Trophy,
    },
  ];

  const disciplineGroups = DISCIPLINES.map((disc) => ({
    discipline: disc,
    skills: skills
      .filter((s) => s.discipline === disc.slug)
      .map((s) => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
        color: s.color,
        totalXp: s.totalXp,
        level: s.level,
        discipline: s.discipline,
        specCount: s.children.length,
      })),
  }));

  const inProgressChains = activeChains
    .map((c) => {
      const total = c.quests.length;
      const completed = c.quests.filter((q) => q.status === "completed").length;
      return { id: c.id, name: c.name, tier: c.tier, total, completed };
    })
    .filter((c) => c.total > 0 && c.completed < c.total);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero card */}
      <div className="norse-card p-8 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.4), transparent 60%)",
          }}
        />

        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-border bg-card/60 text-muted-foreground"
            title={`${daysActive} day${daysActive === 1 ? "" : "s"} adventuring`}
          >
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-display uppercase tracking-widest">
              {daysActive}d
            </span>
          </div>
          <EditCharacter
            currentName={character.name}
            currentClass={characterClass}
          />
        </div>

        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
          <LevelBadge
            level={level}
            size="xl"
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
            <h1 className="font-display text-4xl tracking-wider uppercase text-gradient-gold mt-1 w-fit mx-auto md:mx-0">
              {character.name}
            </h1>

            <div className="mt-3 max-w-md mx-auto md:mx-0">
              <XpBar current={currentLevelXp} max={xpForNextLevel} />
            </div>
            <div className="flex items-center gap-4 md:gap-6 mt-3 justify-center md:justify-start flex-wrap">
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

      {/* Identity + Skills + Bottom cards */}
      <CharacterSections
        identity={
          <CharacterIdentity
            characterClass={characterClass}
            daysActive={daysActive}
            createdAt={character.createdAt}
          />
        }
        skillsHeader={
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl tracking-widest uppercase text-foreground">
              Skills
            </h2>
            <SkillForm skills={skills.map((s) => ({ id: s.id, name: s.name, discipline: s.discipline }))} />
          </div>
        }
        skillGroups={disciplineGroups}
        bottomRow={
          <>
            <ActiveChains chains={inProgressChains.slice(0, 5)} />
            <UpcomingTrophies achievements={upcomingAchievements} />
            <RecentTrophies
              achievements={recentAchievements.map((a) => ({
                key: a.key,
                name: a.name,
                description: a.description,
                icon: a.icon,
                unlockedAt: a.unlockedAt!,
              }))}
            />
          </>
        }
      />
    </div>
  );
}
