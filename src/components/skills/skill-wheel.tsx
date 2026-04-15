"use client";

import { useState } from "react";
import {
  Sword,
  Brain,
  Sparkles,
  Leaf,
  Hammer,
  Heart,
  ArrowLeft,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SkillCard } from "@/components/skills/skill-card";
import { LevelRing } from "@/components/shared/level-ring";
import { cn } from "@/lib/utils";
import { computeLevel } from "@/lib/xp";

const DISCIPLINE_ICONS: Record<string, LucideIcon> = {
  Sword, Brain, Sparkles, Leaf, Hammer, Heart,
};

function getDisciplineIcon(name: string): LucideIcon {
  return DISCIPLINE_ICONS[name] ?? Sword;
}

function disciplineProgress(skills: SkillForWheel[]): { avgLevel: number; avgProgress: number } {
  if (skills.length === 0) return { avgLevel: 0, avgProgress: 0 };
  const totalXp = skills.reduce((sum, sk) => sum + sk.totalXp, 0);
  const { level, progress } = computeLevel(totalXp);
  return { avgLevel: level, avgProgress: progress };
}

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
  totalXp: number;
  level: number;
  discipline?: string | null;
  specCount: number;
}

interface Props {
  groups: Array<{
    discipline: DisciplineData;
    skills: SkillForWheel[];
  }>;
  onSelectionChange?: (selected: boolean) => void;
}

const WHEEL_SIZE = 480;
const ORBIT_RADIUS = 160;
const NODE_SIZE = 96;
const CENTER_SIZE = 72;

export function SkillWheel({ groups, onSelectionChange }: Props) {
  const [selected, setSelectedRaw] = useState<string | null>(null);

  const setSelected = (value: string | null) => {
    setSelectedRaw(value);
    onSelectionChange?.(value !== null);
  };
  const [hovered, setHovered] = useState<string | null>(null);
  const cx = WHEEL_SIZE / 2;
  const cy = WHEEL_SIZE / 2;

  const selectedGroup = groups.find((g) => g.discipline.slug === selected);
  const totalSkills = groups.reduce((sum, g) => sum + g.skills.length, 0);

  function nodePosition(index: number) {
    const angle = (index * (2 * Math.PI)) / groups.length - Math.PI / 2;
    return {
      x: cx + ORBIT_RADIUS * Math.cos(angle),
      y: cy + ORBIT_RADIUS * Math.sin(angle),
      ux: Math.cos(angle),
      uy: Math.sin(angle),
    };
  }

  if (selectedGroup) {
    const Icon = getDisciplineIcon(selectedGroup.discipline.icon);
    const { avgLevel, avgProgress } = disciplineProgress(selectedGroup.skills);
    return (
      <div
        key={selectedGroup.discipline.slug}
        className="animate-in fade-in slide-in-from-bottom-3 duration-300"
      >
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-5 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-xs font-display uppercase tracking-widest">
            All Disciplines
          </span>
        </button>

        <div className="flex items-center gap-3 mb-5">
          <LevelRing
            level={avgLevel}
            progress={avgProgress}
            size="sm"
            icon={
              <Icon
                className="w-full h-full"
                style={{ color: selectedGroup.discipline.color }}
              />
            }
          />
          <div>
            <h3
              className="font-display text-lg tracking-widest uppercase"
              style={{ color: selectedGroup.discipline.color }}
            >
              {selectedGroup.discipline.name}
            </h3>
            <span className="text-[10px] text-muted-foreground font-body">
              {selectedGroup.discipline.description}
            </span>
          </div>
        </div>

        {selectedGroup.skills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedGroup.skills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                href={`/skills/${skill.id}`}
                specCount={skill.specCount}
              />
            ))}
          </div>
        ) : (
          <div className="norse-card p-8 text-center text-sm text-muted-foreground">
            No skills in {selectedGroup.discipline.name} yet.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      {/* Desktop: radial wheel */}
      <div className="hidden md:flex justify-center">
        <div
          className="relative"
          style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}
        >
          {/* Orbit ring */}
          <div
            className="absolute z-0 rounded-full border border-border/30"
            style={{
              width: ORBIT_RADIUS * 2,
              height: ORBIT_RADIUS * 2,
              top: cy - ORBIT_RADIUS,
              left: cx - ORBIT_RADIUS,
            }}
          />

          {/* Outer decorative ring */}
          <div
            className="absolute z-0 rounded-full border border-dashed border-border/20"
            style={{
              width: ORBIT_RADIUS * 2 + NODE_SIZE + 16,
              height: ORBIT_RADIUS * 2 + NODE_SIZE + 16,
              top: cy - ORBIT_RADIUS - NODE_SIZE / 2 - 8,
              left: cx - ORBIT_RADIUS - NODE_SIZE / 2 - 8,
            }}
          />

          {/* Connecting lines */}
          <svg
            className="absolute inset-0 z-0 pointer-events-none"
            width={WHEEL_SIZE}
            height={WHEEL_SIZE}
          >
            {groups.map(({ discipline }, i) => {
              const { ux, uy } = nodePosition(i);
              const gap = 4;
              const x1 = cx + ux * (CENTER_SIZE / 2 + gap);
              const y1 = cy + uy * (CENTER_SIZE / 2 + gap);
              const x2 = cx + ux * (ORBIT_RADIUS - NODE_SIZE / 2 - gap);
              const y2 = cy + uy * (ORBIT_RADIUS - NODE_SIZE / 2 - gap);
              return (
                <line
                  key={discipline.slug}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="hsl(var(--primary))"
                  strokeWidth={0.75}
                  strokeOpacity={0.15}
                  strokeDasharray="4 4"
                />
              );
            })}
          </svg>

          {/* Center element */}
          <div
            className="absolute rounded-full border border-primary/20 bg-card flex flex-col items-center justify-center z-10"
            style={{
              width: CENTER_SIZE,
              height: CENTER_SIZE,
              top: cy - CENTER_SIZE / 2,
              left: cx - CENTER_SIZE / 2,
              boxShadow: "0 0 30px hsl(var(--primary) / 0.1)",
            }}
          >
            <span className="font-display text-xl text-gold leading-none">
              {totalSkills}
            </span>
            <span className="text-[8px] font-display uppercase tracking-widest text-muted-foreground">
              Skills
            </span>
          </div>

          {/* Shared gradient for discipline rings */}
          <svg className="absolute" width={0} height={0}>
            <defs>
              <linearGradient id="wheel-ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(10, 75%, 38%)" />
                <stop offset="50%" stopColor="hsl(20, 78%, 48%)" />
                <stop offset="100%" stopColor="hsl(32, 100%, 50%)" />
              </linearGradient>
            </defs>
          </svg>

          {/* Discipline nodes */}
          {groups.map(({ discipline, skills }, i) => {
            const { x, y } = nodePosition(i);
            const isEmpty = skills.length === 0;
            const isHovered = hovered === discipline.slug;
            const Icon = getDisciplineIcon(discipline.icon);
            const { avgLevel, avgProgress } = disciplineProgress(skills);

            const dimmed = isEmpty;
            const baseContentColor = dimmed
              ? `${discipline.color}50`
              : discipline.color;
            const contentColor = isHovered
              ? discipline.color
              : baseContentColor;

            const ringRadius = (NODE_SIZE - 4) / 2;
            const ringCircumference = 2 * Math.PI * ringRadius;
            const ringOffset = ringCircumference - avgProgress * ringCircumference;

            return (
              <button
                key={discipline.slug}
                onClick={() => setSelected(discipline.slug)}
                onMouseEnter={() => setHovered(discipline.slug)}
                onMouseLeave={() => setHovered((current) => current === discipline.slug ? null : current)}
                className={cn(
                  "absolute z-10 rounded-full flex flex-col items-center justify-center transition-all duration-300",
                  isHovered && "scale-110"
                )}
                style={{
                  width: NODE_SIZE,
                  height: NODE_SIZE,
                  top: y - NODE_SIZE / 2,
                  left: x - NODE_SIZE / 2,
                }}
              >
                {/* Progress ring SVG */}
                <svg
                  className="absolute inset-0 -rotate-90"
                  width={NODE_SIZE}
                  height={NODE_SIZE}
                  viewBox={`0 0 ${NODE_SIZE} ${NODE_SIZE}`}
                >
                  <circle
                    cx={NODE_SIZE / 2}
                    cy={NODE_SIZE / 2}
                    r={ringRadius}
                    fill="none"
                    stroke={dimmed ? "hsl(var(--border) / 0.3)" : "hsl(var(--border))"}
                    strokeWidth={3}
                  />
                  {avgProgress > 0 && (
                    <circle
                      cx={NODE_SIZE / 2}
                      cy={NODE_SIZE / 2}
                      r={ringRadius}
                      fill="none"
                      stroke="url(#wheel-ring-grad)"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                      className="transition-all duration-500"
                      style={{ filter: "drop-shadow(0 0 4px hsl(20 78% 48% / 0.4))" }}
                    />
                  )}
                </svg>

                {/* Background fill */}
                <div
                  className="absolute rounded-full transition-all duration-300"
                  style={{
                    inset: 4,
                    backgroundColor: isHovered
                      ? "hsl(var(--primary) / 0.06)"
                      : "hsl(var(--card))",
                    boxShadow: isHovered
                      ? "0 0 22px hsl(var(--primary) / 0.2), inset 0 0 12px hsl(var(--primary) / 0.06)"
                      : `0 0 14px hsl(var(--primary) / ${dimmed ? "0.03" : "0.08"})`,
                  }}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center">
                  <Icon
                    className="w-7 h-7 mb-1"
                    style={{ color: contentColor }}
                  />
                  <span
                    className="text-[10px] font-display uppercase tracking-widest leading-tight"
                    style={{ color: contentColor }}
                  >
                    {discipline.name}
                  </span>
                  {skills.length > 0 && (
                    <span className="text-[9px] font-body leading-tight text-gold/70">
                      Lv {avgLevel}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile: 3×2 grid */}
      <svg className="absolute" width={0} height={0}>
        <defs>
          <linearGradient id="mobile-ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(10, 75%, 38%)" />
            <stop offset="50%" stopColor="hsl(20, 78%, 48%)" />
            <stop offset="100%" stopColor="hsl(32, 100%, 50%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="grid grid-cols-3 gap-2 md:hidden">
        {groups.map(({ discipline, skills }) => {
          const Icon = getDisciplineIcon(discipline.icon);
          const dimmed = skills.length === 0;
          const contentColor = dimmed
            ? `${discipline.color}50`
            : discipline.color;
          const { avgLevel, avgProgress } = disciplineProgress(skills);

          const mobileSize = 48;
          const mobileRadius = (mobileSize - 3) / 2;
          const mobileCircumference = 2 * Math.PI * mobileRadius;
          const mobileOffset = mobileCircumference - avgProgress * mobileCircumference;

          return (
            <button
              key={discipline.slug}
              onClick={() => setSelected(discipline.slug)}
              className="flex flex-col items-center gap-1 py-3 border border-border transition-all"
              style={{ backgroundColor: "hsl(var(--card))" }}
            >
              <div className="relative" style={{ width: mobileSize, height: mobileSize }}>
                <svg
                  className="absolute inset-0 -rotate-90"
                  width={mobileSize}
                  height={mobileSize}
                  viewBox={`0 0 ${mobileSize} ${mobileSize}`}
                >
                  <circle
                    cx={mobileSize / 2}
                    cy={mobileSize / 2}
                    r={mobileRadius}
                    fill="none"
                    stroke={dimmed ? "hsl(var(--border) / 0.3)" : "hsl(var(--border))"}
                    strokeWidth={2.5}
                  />
                  {avgProgress > 0 && (
                    <circle
                      cx={mobileSize / 2}
                      cy={mobileSize / 2}
                      r={mobileRadius}
                      fill="none"
                      stroke="url(#mobile-ring-grad)"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeDasharray={mobileCircumference}
                      strokeDashoffset={mobileOffset}
                      className="transition-all duration-500"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon
                    className="w-5 h-5"
                    style={{ color: contentColor }}
                  />
                </div>
              </div>
              <span
                className="text-[9px] font-display uppercase tracking-widest"
                style={{ color: contentColor }}
              >
                {discipline.name}
              </span>
              {skills.length > 0 && (
                <span className="text-[8px] font-body text-gold/70">
                  Lv {avgLevel}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground font-body">
        Select a discipline to view skills
      </p>
    </div>
  );
}
