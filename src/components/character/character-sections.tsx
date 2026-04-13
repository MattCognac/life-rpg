"use client";

import { useState, type ReactNode } from "react";
import { SkillWheel } from "@/components/skills/skill-wheel";
import { cn } from "@/lib/utils";

interface DisciplineData {
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface SkillForWheel {
  id: string;
  name: string;
  icon: string;
  color: string;
  totalXp: number;
  level: number;
  discipline?: string | null;
  specCount: number;
}

interface Props {
  identity: ReactNode;
  skillsHeader: ReactNode;
  skillGroups: Array<{ discipline: DisciplineData; skills: SkillForWheel[] }>;
  bottomRow: ReactNode;
}

export function CharacterSections({ identity, skillsHeader, skillGroups, bottomRow }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <>
      <div className={cn(
        "grid gap-6",
        focused
          ? "grid-cols-1"
          : "grid-cols-1 lg:grid-cols-[340px_1fr]"
      )}>
        {!focused && identity}
        <div>
          {skillsHeader}
          <SkillWheel groups={skillGroups} onSelectionChange={setFocused} />
        </div>
      </div>

      {!focused && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {bottomRow}
        </div>
      )}
    </>
  );
}
