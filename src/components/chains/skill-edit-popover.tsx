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
import { Check, CornerDownRight, Trash2 } from "lucide-react";

export type SkillEditScope = "quest" | "all";

export type SkillEditSnapshot = {
  skillName: string;
  discipline: DisciplineSlug;
  specializationName: string;
};

type NestTarget = { name: string; discipline: string };

type SkillEditPopoverProps = {
  trigger: React.ReactNode;
  disabled?: boolean;
  mode: "primary" | "secondary" | "add-secondary";
  current: SkillEditSnapshot;
  skillLabelForAll?: string;
  showScope: boolean;
  aggregateOnly?: boolean;
  defaultScope?: SkillEditScope;
  onCommit: (args: {
    next: SkillEditSnapshot;
    baseline: SkillEditSnapshot;
    scope: SkillEditScope;
    mode: "primary" | "secondary" | "add-secondary";
  }) => void;
  onRemove?: () => void;
  nestTargets?: NestTarget[];
  onNest?: (parentName: string, parentDiscipline: string, specName: string) => void;
  /** Primary skill name on this quest — prevents adding a duplicate secondary. */
  primarySkillName?: string;
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
  nestTargets,
  onNest,
  primarySkillName,
}: SkillEditPopoverProps) {
  const [open, setOpen] = useState(false);
  const [skillName, setSkillName] = useState("");
  const [discipline, setDiscipline] = useState<DisciplineSlug>(current.discipline);
  const [spec, setSpec] = useState("");
  const [scope, setScope] = useState<SkillEditScope>(defaultScope);
  const baselineRef = useRef<SkillEditSnapshot>(current);
  const skipCommitOnCloseRef = useRef(false);
  const [nestOpen, setNestOpen] = useState(false);
  const [nestParent, setNestParent] = useState<string | null>(null);
  const [nestSpecName, setNestSpecName] = useState("");

  const isDuplicateOfPrimary =
    !!primarySkillName &&
    !!skillName.trim() &&
    skillName.trim().toLowerCase() === primarySkillName.toLowerCase();

  const flushCommit = useCallback(() => {
    const next: SkillEditSnapshot = {
      skillName: skillName.trim(),
      discipline,
      specializationName: spec.trim(),
    };
    if (!next.skillName) return;
    if (
      primarySkillName &&
      next.skillName.toLowerCase() === primarySkillName.toLowerCase()
    ) {
      return;
    }
    onCommit({
      next,
      baseline: baselineRef.current,
      scope: mode === "add-secondary" ? "quest" : aggregateOnly ? "all" : scope,
      mode,
    });
  }, [aggregateOnly, discipline, mode, onCommit, primarySkillName, scope, skillName, spec]);

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
      setNestOpen(false);
      setNestParent(null);
      setNestSpecName(snap.skillName);
    } else if (open && !skipCommitOnCloseRef.current) {
      flushCommit();
    }
    skipCommitOnCloseRef.current = false;
    setOpen(next);
  };

  const handleSaveClick = () => {
    skipCommitOnCloseRef.current = true;
    flushCommit();
    setOpen(false);
  };

  const handleRemoveClick = () => {
    skipCommitOnCloseRef.current = true;
    onRemove?.();
    setOpen(false);
  };

  const handleNestConfirm = () => {
    if (!nestParent || !nestSpecName.trim() || !onNest) return;
    const target = nestTargets?.find((t) => t.name === nestParent);
    if (!target) return;
    skipCommitOnCloseRef.current = true;
    onNest(target.name, target.discipline, nestSpecName.trim());
    setOpen(false);
  };

  const availableNestTargets = nestTargets?.filter(
    (t) => t.name.toLowerCase() !== skillName.toLowerCase(),
  );

  const showNest =
    onNest &&
    availableNestTargets &&
    availableNestTargets.length > 0 &&
    skillName.trim() &&
    mode !== "add-secondary";

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
          {isDuplicateOfPrimary && (
            <p className="text-[10px] text-destructive font-body">
              This is already the primary skill on this quest.
            </p>
          )}
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

        {/* Nest link (shown when not in nest-expanded mode) */}
        {showNest && !nestOpen && (
          <button
            type="button"
            onClick={() => { setNestOpen(true); setNestSpecName(skillName); }}
            disabled={disabled}
            className="w-full flex items-center gap-1.5 text-[10px] font-display uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
          >
            <CornerDownRight className="w-3 h-3" />
            Nest under another skill...
          </button>
        )}

        {/* Nest expanded UI */}
        {showNest && nestOpen && (
          <div className="space-y-2 border-t border-border/50 pt-3">
            <Label className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">
              Nest &ldquo;{skillName}&rdquo; under
            </Label>
            <Select value={nestParent ?? ""} onValueChange={(v) => setNestParent(v || null)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select a skill..." />
              </SelectTrigger>
              <SelectContent className="z-[70]">
                {availableNestTargets.map((t) => (
                  <SelectItem key={t.name} value={t.name}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {nestParent && (
              <div className="space-y-2">
                <Label className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">
                  Specialization name
                </Label>
                <Input
                  value={nestSpecName}
                  onChange={(e) => setNestSpecName(e.target.value)}
                  className="h-8 text-xs"
                  placeholder={skillName}
                  disabled={disabled}
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => { setNestOpen(false); setNestParent(null); }}
              >
                Cancel
              </Button>
              {nestParent && (
                <Button
                  type="button"
                  size="sm"
                  className="flex-1"
                  disabled={!nestSpecName.trim() || disabled}
                  onClick={handleNestConfirm}
                >
                  <CornerDownRight className="w-3 h-3" />
                  Nest
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Action row: Remove (left) + Save (right) — hidden when nest is expanded */}
        {!nestOpen && (
          <div className="flex gap-2">
            {onRemove && (mode === "primary" || mode === "secondary") && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={disabled}
                onClick={handleRemoveClick}
                title={`Remove ${mode} skill`}
                className="px-3"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              className="flex-1"
              disabled={disabled || !skillName.trim() || isDuplicateOfPrimary}
              onClick={handleSaveClick}
            >
              <Check className="w-3 h-3" />
              Save
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
