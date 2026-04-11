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
import { RenameCharacter } from "@/components/character/rename-character";
import { ChangeClass } from "@/components/character/change-class";
import { Zap, Swords, Flame, Trophy } from "lucide-react";
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
        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
          <LevelBadge level={level} size="xl" />

          <div className="flex-1 text-center md:text-left w-full">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              {classDef && (
                <ClassIcon
                  characterClass={character.class as CharacterClass}
                  className="w-4 h-4 text-primary"
                />
              )}
              <div className="text-[10px] font-display uppercase tracking-[0.3em] text-muted-foreground">
                {classDef?.name ?? "Adventurer"} • {title}
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center md:justify-start mt-1">
              <h1 className="font-display text-4xl tracking-wider uppercase text-gradient-gold">
                {character.name}
              </h1>
              <RenameCharacter current={character.name} />
            </div>
            {classDef && (
              <div className="text-xs font-body text-muted-foreground italic mt-1">
                &ldquo;{classDef.flavor}&rdquo;
              </div>
            )}
            <div className="flex items-center gap-4 mt-2">
              <div className="text-xs font-body text-muted-foreground">
                {daysActive} days adventuring
              </div>
              <ChangeClass currentClass={character.class as CharacterClass} />
            </div>

            <div className="mt-6 max-w-md mx-auto md:mx-0">
              <XpBar current={currentLevelXp} max={xpForNextLevel} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, Icon }) => (
          <div key={label} className="norse-card p-5 stat-glow">
            <Icon className="w-5 h-5 text-primary mb-2" />
            <div className="font-display text-2xl text-gold">{value}</div>
            <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground mt-1">
              {label}
            </div>
          </div>
        ))}
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
