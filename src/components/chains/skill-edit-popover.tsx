"use client";

import { useRef, useState, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DISCIPLINES } from "@/lib/disciplines";
import type { DisciplineSlug } from "@/lib/disciplines";

export type SkillEditScope = "quest" | "all";

export type SkillEditSnapshot = {
  skillName: string;
  discipline: DisciplineSlug;
  specializationName: string;
};

type SkillEditPopoverProps = {
  trigger: React.ReactNode;
  disabled?: boolean;
  mode: "primary" | "secondary" | "add-secondary";
  /** Current values from parent — snapshotted when popover opens */
  current: SkillEditSnapshot;
  /** Shown next to “All quests with this skill” */
  skillLabelForAll?: string;
  showScope: boolean;
  /** Hide scope radios and always apply as “all quests” (e.g. skill overview grid). */
  aggregateOnly?: boolean;
  defaultScope?: SkillEditScope;
  onCommit: (args: {
    next: SkillEditSnapshot;
    baseline: SkillEditSnapshot;
    scope: SkillEditScope;
    mode: "primary" | "secondary" | "add-secondary";
  }) => void;
  /** Secondary: remove this secondary. Primary: clear primary skill on this quest (path) or use overview delete for chain-wide. */
  onRemove?: () => void;
};

export function SkillEditPopover({
  trigger,
  disabled,
  mode,
  current,
  skillLabelForAll,
  showScope,
  aggregateOnly = false,
  defaultScope = "all",
  onCommit,
  onRemove,
}: SkillEditPopoverProps) {
  const [open, setOpen] = useState(false);
  const [skillName, setSkillName] = useState("");
  const [discipline, setDiscipline] = useState<DisciplineSlug>(current.discipline);
  const [spec, setSpec] = useState("");
  const [scope, setScope] = useState<SkillEditScope>(defaultScope);
  const baselineRef = useRef<SkillEditSnapshot>(current);
  const skipCommitOnCloseRef = useRef(false);

  const flushCommit = useCallback(() => {
    const next: SkillEditSnapshot = {
      skillName: skillName.trim(),
      discipline,
      specializationName: spec.trim(),
    };
    if (mode === "add-secondary") {
      if (!next.skillName) return;
      onCommit({
        next,
        baseline: baselineRef.current,
        scope: "quest",
        mode: "add-secondary",
      });
      return;
    }
    if (!next.skillName) return;
    onCommit({
      next,
      baseline: baselineRef.current,
      scope: aggregateOnly ? "all" : scope,
      mode,
    });
  }, [aggregateOnly, discipline, mode, onCommit, scope, skillName, spec]);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      const snap: SkillEditSnapshot = {
        skillName: current.skillName,
        discipline: current.discipline,
        specializationName: current.specializationName ?? "",
      };
      baselineRef.current = snap;
      setSkillName(snap.skillName);
      setDiscipline(snap.discipline);
      setSpec(snap.specializationName);
      setScope(
        mode === "add-secondary" ? "quest" : aggregateOnly ? "all" : defaultScope,
      );
    } else if (open && !skipCommitOnCloseRef.current) {
      flushCommit();
    }
    skipCommitOnCloseRef.current = false;
    setOpen(next);
  };

  const handleRemoveClick = () => {
    skipCommitOnCloseRef.current = true;
    onRemove?.();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
      <PopoverTrigger asChild disabled={disabled}>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-3" align="start">
        <div className="space-y-2">
          <Label htmlFor="skill-edit-name" className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">
            Skill name
          </Label>
          <Input
            id="skill-edit-name"
            value={skillName}
            onChange={(e) => setSkillName(e.target.value)}
            className="h-8 text-xs"
            placeholder={mode === "add-secondary" ? "e.g. Running" : undefined}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">
            Discipline
          </Label>
          <Select
            value={discipline}
            onValueChange={(v) => setDiscipline(v as DisciplineSlug)}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[70]">
              {DISCIPLINES.map((d) => (
                <SelectItem key={d.slug} value={d.slug}>
                  <span style={{ color: d.color }}>{d.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="skill-edit-spec" className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">
              Specialization <span className="font-body normal-case text-muted-foreground/80">(optional)</span>
            </Label>
            {spec.trim() !== "" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px]"
                onClick={() => setSpec("")}
                disabled={disabled}
              >
                Clear
              </Button>
            )}
          </div>
          <Input
            id="skill-edit-spec"
            value={spec}
            onChange={(e) => setSpec(e.target.value)}
            className="h-8 text-xs"
            placeholder="e.g. Compound Bow"
            disabled={disabled}
          />
        </div>

        {showScope && !aggregateOnly && mode !== "add-secondary" && (
          <fieldset className="space-y-2 border-0 p-0 m-0">
            <legend className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-1.5">
              Apply changes to
            </legend>
            <div className="flex flex-col gap-2 text-xs font-body">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="skill-scope"
                  className="accent-primary"
                  checked={scope === "quest"}
                  onChange={() => setScope("quest")}
                  disabled={disabled}
                />
                <span>This quest only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="skill-scope"
                  className="accent-primary"
                  checked={scope === "all"}
                  onChange={() => setScope("all")}
                  disabled={disabled}
                />
                <span>
                  All quests with skill &ldquo;{skillLabelForAll ?? skillName}&rdquo;
                </span>
              </label>
            </div>
          </fieldset>
        )}

        {mode === "add-secondary" && (
          <p className="text-[10px] text-muted-foreground font-body">
            Applied to this quest only. Secondary skills earn +50% XP when you complete the quest.
          </p>
        )}

        {onRemove && mode === "secondary" && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="w-full"
            disabled={disabled}
            onClick={handleRemoveClick}
          >
            Remove secondary skill
          </Button>
        )}

        {onRemove && mode === "primary" && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="w-full"
            disabled={disabled}
            onClick={handleRemoveClick}
          >
            Remove primary skill
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
