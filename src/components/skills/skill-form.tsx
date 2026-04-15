"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Sword,
  Brain,
  Sparkles,
  Leaf,
  Hammer,
  Heart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DISCIPLINES, type DisciplineSlug } from "@/lib/disciplines";
import { createSkill, updateSkill } from "@/actions/skill-actions";
import { handleActionResult } from "@/components/shared/action-handler";
import { cn } from "@/lib/utils";

const DISCIPLINE_ICONS: Record<string, LucideIcon> = {
  Sword, Brain, Sparkles, Leaf, Hammer, Heart,
};

interface ExistingSkill {
  id: string;
  name: string;
  discipline: string | null;
}

interface Props {
  skill?: {
    id: string;
    name: string;
    discipline?: string | null;
    parentId?: string | null;
  };
  skills?: ExistingSkill[];
  trigger?: React.ReactNode;
  onCreated?: (id: string) => void;
  addSpecTo?: { discipline: DisciplineSlug; skillName: string };
}

export function SkillForm({ skill, skills = [], trigger, onCreated, addSpecTo }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isEditing = !!skill;
  const isAddingSpec = !!addSpecTo;
  const [discipline, setDiscipline] = useState<DisciplineSlug | "">(
    addSpecTo?.discipline ?? (skill?.discipline as DisciplineSlug) ?? ""
  );
  const [skillName, setSkillName] = useState(
    addSpecTo?.skillName ?? (isEditing ? skill.name : "")
  );
  const [specName, setSpecName] = useState("");

  const filteredSkills = useMemo(
    () => (discipline ? skills.filter((s) => s.discipline === discipline) : []),
    [discipline, skills]
  );

  const reset = () => {
    setDiscipline("");
    setSkillName("");
    setSpecName("");
  };

  const onSubmit = () => {
    startTransition(async () => {
      if (isEditing) {
        const result = await updateSkill(skill.id, {
          name: skillName,
          ...(skill.parentId ? {} : { discipline: discipline || undefined }),
        });
        handleActionResult(result);
        if (result.success) {
          setOpen(false);
          router.refresh();
        }
      } else {
        if (!discipline) return;
        const result = await createSkill({
          discipline,
          skillName,
          specializationName: specName || undefined,
        });
        handleActionResult(result);
        if (result.success) {
          setOpen(false);
          reset();
          if (onCreated && result.data) onCreated(result.data.id);
          router.refresh();
        }
      }
    });
  };

  const disciplinePicker = (
    <div>
      <Label>Discipline</Label>
      <TooltipProvider delayDuration={300}>
        <div className="mt-1.5 grid grid-cols-3 sm:grid-cols-6 gap-2">
          {DISCIPLINES.map((d) => {
            const I = DISCIPLINE_ICONS[d.icon] ?? Sword;
            return (
              <Tooltip key={d.slug}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setDiscipline(d.slug)}
                    className={cn(
                      "py-2.5 border flex flex-col items-center gap-1.5 transition-all",
                      discipline === d.slug
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <I
                      className="w-4 h-4"
                      style={{ color: d.color }}
                    />
                    <span
                      className="text-[9px] font-display uppercase tracking-widest"
                      style={{ color: discipline === d.slug ? d.color : undefined }}
                    >
                      {d.name}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {d.description}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
      <p className="text-[10px] text-muted-foreground mt-2">
        Skill color follows the discipline you choose.
      </p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost">
            <Plus className="w-4 h-4" />
            New Skill
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Skill" : isAddingSpec ? "New Specialization" : "Forge New Skill"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isEditing && !isAddingSpec && disciplinePicker}
          {(isEditing && !skill.parentId) && disciplinePicker}

          {!isAddingSpec && (
            <div>
              <Label htmlFor="skill-name">
                {isEditing ? "Name" : "Skill Name"}
              </Label>
              <Input
                id="skill-name"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                placeholder="e.g. Archery, Cooking, Woodworking"
                className="mt-1.5"
                list={!isEditing && filteredSkills.length > 0 ? "skill-suggestions" : undefined}
              />
              {!isEditing && filteredSkills.length > 0 && (
                <datalist id="skill-suggestions">
                  {filteredSkills.map((s) => (
                    <option key={s.id} value={s.name} />
                  ))}
                </datalist>
              )}
            </div>
          )}

          {!isEditing && (
            <div>
              <Label htmlFor="spec-name">
                {isAddingSpec ? "Name" : "Specialization (optional)"}
              </Label>
              <Input
                id="spec-name"
                value={specName}
                onChange={(e) => setSpecName(e.target.value)}
                placeholder="e.g. Compound Bow, Grilling"
                className="mt-1.5"
              />
              {!isAddingSpec && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  A focused branch within this skill. Leave blank for a skill-only entry.
                </p>
              )}
            </div>
          )}

        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={
              isPending ||
              (isAddingSpec ? !specName.trim() : !skillName.trim()) ||
              (!isEditing && !discipline)
            }
          >
            {isPending ? "Saving..." : isEditing ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
