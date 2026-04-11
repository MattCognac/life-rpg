import { db } from "@/lib/db";
import { computeLevel, titleForLevel } from "@/lib/xp";
import { getAuthUser } from "@/lib/auth";
import { ClassIcon } from "@/components/shared/class-icon";
import { CHARACTER_CLASSES, type CharacterClass } from "@/lib/classes";
import { formatNumber } from "@/lib/utils";

export async function Header() {
  const userId = await getAuthUser();
  const character = await db.character.findUnique({ where: { userId } });
  if (!character) return null;

  const { level, currentLevelXp, xpForNextLevel } = computeLevel(character.totalXp);
  const title = titleForLevel(level);
  const classDef = CHARACTER_CLASSES[character.class as CharacterClass];

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

        <div className="relative">
          <div className="w-12 h-12 level-badge-ring flex items-center justify-center border-2 border-primary/60 bg-card">
            {classDef ? (
              <ClassIcon
                characterClass={character.class as CharacterClass}
                className="absolute inset-0 w-full h-full p-2.5 text-primary/20"
              />
            ) : null}
            <div className="relative font-display font-bold text-lg text-gold">
              {level}
            </div>
          </div>
        </div>

        <div className="hidden sm:block min-w-[140px]">
          <div className="xp-bar">
            <div
              className="xp-bar-fill"
              style={{ width: `${(currentLevelXp / xpForNextLevel) * 100}%` }}
            />
          </div>
          <div className="text-[10px] font-body tracking-wider text-muted-foreground mt-1 text-right">
            {formatNumber(currentLevelXp)} / {formatNumber(xpForNextLevel)} XP
          </div>
        </div>
      </div>
    </header>
  );
}
