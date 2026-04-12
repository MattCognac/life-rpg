import { db } from "@/lib/db";
import { computeLevel, titleForLevel } from "@/lib/xp";
import { getAuthUser } from "@/lib/auth";
import { ClassIcon } from "@/components/shared/class-icon";
import { LevelBadge } from "@/components/shared/level-badge";
import { CHARACTER_CLASSES, resolveClass } from "@/lib/classes";
import { formatNumber } from "@/lib/utils";

export async function Header() {
  const userId = await getAuthUser();
  const character = await db.character.findUnique({ where: { userId } });
  if (!character) return null;

  const { level, currentLevelXp, xpForNextLevel } = computeLevel(character.totalXp);
  const title = titleForLevel(level);
  const characterClass = resolveClass(character.class);
  const classDef = CHARACTER_CLASSES[characterClass];

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-border bg-background/80 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between">
      <div className="lg:hidden font-display text-xl tracking-widest text-gradient-gold">
        LIFE RPG
      </div>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="font-display text-sm tracking-wider text-foreground">
            {character.name}
          </div>
          <div className="text-[10px] font-body tracking-widest text-muted-foreground uppercase">
            {title}
          </div>
        </div>

        <LevelBadge
          level={level}
          size="md"
          icon={
            classDef ? (
              <ClassIcon
                characterClass={characterClass}
                className="w-full h-full"
              />
            ) : undefined
          }
        />

        <div className="hidden sm:flex items-center min-w-[140px]">
          <div className="xp-bar w-full">
            <div
              className="xp-bar-fill"
              style={{ width: `${(currentLevelXp / xpForNextLevel) * 100}%` }}
            />
            <span className="absolute inset-0 flex items-center px-1.5 text-[9px] font-body tracking-wider text-foreground/70">
              {formatNumber(currentLevelXp)} / {formatNumber(xpForNextLevel)} XP
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
