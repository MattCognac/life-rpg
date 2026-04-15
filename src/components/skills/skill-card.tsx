import Link from "next/link";
import { computeLevel } from "@/lib/xp";
import { XpBar } from "@/components/shared/xp-bar";
import { LevelRing } from "@/components/shared/level-ring";
import { formatNumber } from "@/lib/utils";

interface Props {
  skill: {
    id: string;
    name: string;
    totalXp: number;
    level: number;
    discipline?: string | null;
    parentId?: string | null;
  };
  href?: string;
  specCount?: number;
  parentName?: string;
}

export function SkillCard({ skill, href, specCount, parentName }: Props) {
  const { level, currentLevelXp, xpForNextLevel, progress } = computeLevel(skill.totalXp);

  const body = (
    <div className="norse-card p-5 ember-hover group cursor-pointer h-full">
      <div className="flex items-start gap-3 mb-4">
        <LevelRing level={level} progress={progress} size="sm" />
        <div className="flex-1 min-w-0">
          {parentName && (
            <div className="text-[9px] font-display uppercase tracking-widest text-muted-foreground mb-0.5">
              {parentName}
            </div>
          )}
          <div className="font-display text-base tracking-wider uppercase text-foreground truncate">
            {skill.name}
          </div>
          <div className="text-[10px] font-body tracking-widest uppercase text-muted-foreground flex items-center gap-2">
            <span>Level {level}</span>
            {specCount != null && specCount > 0 && (
              <span className="text-muted-foreground/60">
                &bull; {specCount} spec{specCount === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </div>
      </div>

      <XpBar
        current={currentLevelXp}
        max={xpForNextLevel}
        showLabel={false}
      />
      <div className="flex justify-between text-[10px] font-body tracking-wider text-muted-foreground mt-1.5">
        <span>{formatNumber(currentLevelXp)} / {formatNumber(xpForNextLevel)} XP</span>
        <span className="text-gold/70">Total: {formatNumber(skill.totalXp)}</span>
      </div>
    </div>
  );

  if (href) return <Link href={href}>{body}</Link>;
  return body;
}
