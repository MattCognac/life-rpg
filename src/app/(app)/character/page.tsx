import { db } from "@/lib/db";
import { computeLevel, titleForLevel } from "@/lib/xp";
import { getCharacterForUser } from "@/lib/character";
import { getAuthUser } from "@/lib/auth";
import { CHARACTER_CLASSES, type CharacterClass } from "@/lib/classes";
import { ClassIcon } from "@/components/shared/class-icon";
import { XpBar } from "@/components/shared/xp-bar";
import { LevelBadge } from "@/components/shared/level-badge";
import { SkillCard } from "@/components/skills/skill-card";
import { SkillForm } from "@/components/skills/skill-form";
import { EditCharacter } from "@/components/character/edit-character";
import { Zap, Swords, Flame, Trophy, Calendar } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CharacterPage() {
  const userId = await getAuthUser();
  const character = await getCharacterForUser(userId);
  if (!character) return null;

  const { level, currentLevelXp, xpForNextLevel } = computeLevel(character.totalXp);
  const title = titleForLevel(level);
  const classDef = CHARACTER_CLASSES[character.class as CharacterClass];

  const [skills, completionCount, longestStreakRow, achievementsUnlocked] =
    await Promise.all([
      db.skill.findMany({ where: { userId }, orderBy: { totalXp: "desc" } }),
      db.questCompletion.count({ where: { userId } }),
      db.dailyStreak.findFirst({ where: { userId }, orderBy: { longestStreak: "desc" } }),
      db.achievement.count({ where: { userId, unlockedAt: { not: null } } }),
    ]);

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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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
            currentClass={character.class as CharacterClass}
          />
        </div>

        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
          <LevelBadge
            level={level}
            size="xl"
            icon={
              <ClassIcon
                characterClass={character.class as CharacterClass}
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

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl tracking-widest uppercase text-foreground">
            Skills
          </h2>
          <SkillForm />
        </div>
        {skills.length === 0 ? (
          <div className="norse-card p-8 text-center text-sm text-muted-foreground">
            Forge your first skill to begin tracking mastery.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                href={`/skills/${skill.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
