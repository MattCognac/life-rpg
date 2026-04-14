import Link from "next/link";
import { computeLevel } from "@/lib/xp";
import { XpBar } from "@/components/shared/xp-bar";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { colorForDiscipline } from "@/lib/skill-display";

interface Props {
  skill: {
    id: string;
    name: string;
    icon: string;
    totalXp: number;
    level: number;
    discipline?: string | null;
    parentId?: string | null;
  };
  href?: string;
  specCount?: number;
  parentName?: string;
}

function getIcon(name: string): LucideIcon {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  return icons[name] ?? LucideIcons.Sword;
}

export function SkillCard({ skill, href, specCount, parentName }: Props) {
  const { level, currentLevelXp, xpForNextLevel } = computeLevel(skill.totalXp);
  const Icon = getIcon(skill.icon);
  const color = colorForDiscipline(skill.discipline);

  const body = (
    <div className="norse-card p-5 ember-hover group cursor-pointer h-full">
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-12 h-12 flex items-center justify-center border"
          style={{
            borderColor: `${color}80`,
            backgroundColor: `${color}15`,
            boxShadow: `0 0 20px ${color}25`,
          }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
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
        <div className="font-display text-2xl text-gold">
          {level}
        </div>
      </div>

      <XpBar
        current={currentLevelXp}
        max={xpForNextLevel}
        color={color}
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
