"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import * as LucideIcons from "lucide-react";
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
import { SKILL_COLOR_PRESETS, SKILL_ICON_PRESETS } from "@/lib/constants";
import { REALMS, type RealmSlug } from "@/lib/realms";
import { createSkill, updateSkill } from "@/actions/skill-actions";
import { handleActionResult } from "@/components/shared/action-handler";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

function getIcon(name: string): LucideIcon {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  return icons[name] ?? LucideIcons.Sword;
}

interface Discipline {
  id: string;
  name: string;
  realm: string | null;
}

interface Props {
  skill?: {
    id: string;
    name: string;
    icon: string;
    color: string;
    realm?: string | null;
    parentId?: string | null;
  };
  disciplines?: Discipline[];
  trigger?: React.ReactNode;
}

export function SkillForm({ skill, disciplines = [], trigger }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isEditing = !!skill;
  const [realm, setRealm] = useState<RealmSlug | "">(
    (skill?.realm as RealmSlug) ?? ""
  );
  const [disciplineName, setDisciplineName] = useState(
    isEditing ? skill.name : ""
  );
  const [subSkillName, setSubSkillName] = useState("");
  const [icon, setIcon] = useState(skill?.icon ?? "Sword");
  const [color, setColor] = useState(skill?.color ?? SKILL_COLOR_PRESETS[0]);

  const filteredDisciplines = useMemo(
    () => (realm ? disciplines.filter((d) => d.realm === realm) : []),
    [realm, disciplines]
  );

  const reset = () => {
    setRealm("");
    setDisciplineName("");
    setSubSkillName("");
    setIcon("Sword");
    setColor(SKILL_COLOR_PRESETS[0]);
  };

  const onSubmit = () => {
    startTransition(async () => {
      if (isEditing) {
        const result = await updateSkill(skill.id, {
          name: disciplineName,
          icon,
          color,
          ...(skill.parentId ? {} : { realm: realm || undefined }),
        });
        handleActionResult(result);
        if (result.success) {
          setOpen(false);
          router.refresh();
        }
      } else {
        if (!realm) return;
        const result = await createSkill({
          realm,
          disciplineName,
          subSkillName: subSkillName || undefined,
          icon,
          color,
        });
        handleActionResult(result);
        if (result.success) {
          setOpen(false);
          reset();
          router.refresh();
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost">
            <Plus className="w-4 h-4" />
            New Discipline
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Skill" : "Forge New Discipline"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isEditing && (
            <div>
              <Label>Realm</Label>
              <TooltipProvider delayDuration={300}>
                <div className="mt-1.5 grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {REALMS.map((r) => {
                    const I = getIcon(r.icon);
                    return (
                      <Tooltip key={r.slug}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => setRealm(r.slug)}
                            className={cn(
                              "py-2.5 border flex flex-col items-center gap-1.5 transition-all",
                              realm === r.slug
                                ? "border-primary bg-primary/10"
                                : "border-border bg-card hover:border-primary/50"
                            )}
                          >
                            <I
                              className="w-4 h-4"
                              style={{ color: r.color }}
                            />
                            <span
                              className="text-[9px] font-display uppercase tracking-widest"
                              style={{ color: realm === r.slug ? r.color : undefined }}
                            >
                              {r.name}
                            </span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          {r.description}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>
            </div>
          )}

          {(isEditing && !skill.parentId) && (
            <div>
              <Label>Realm</Label>
              <TooltipProvider delayDuration={300}>
                <div className="mt-1.5 grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {REALMS.map((r) => {
                    const I = getIcon(r.icon);
                    return (
                      <Tooltip key={r.slug}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => setRealm(r.slug)}
                            className={cn(
                              "py-2.5 border flex flex-col items-center gap-1.5 transition-all",
                              realm === r.slug
                                ? "border-primary bg-primary/10"
                                : "border-border bg-card hover:border-primary/50"
                            )}
                          >
                            <I className="w-4 h-4" style={{ color: r.color }} />
                            <span
                              className="text-[9px] font-display uppercase tracking-widest"
                              style={{ color: realm === r.slug ? r.color : undefined }}
                            >
                              {r.name}
                            </span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          {r.description}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>
            </div>
          )}

          <div>
            <Label htmlFor="discipline-name">
              {isEditing ? "Name" : "Discipline Name"}
            </Label>
            <Input
              id="discipline-name"
              value={disciplineName}
              onChange={(e) => setDisciplineName(e.target.value)}
              placeholder="e.g. Archery, Cooking, Woodworking"
              className="mt-1.5"
              list={!isEditing && filteredDisciplines.length > 0 ? "discipline-suggestions" : undefined}
            />
            {!isEditing && filteredDisciplines.length > 0 && (
              <datalist id="discipline-suggestions">
                {filteredDisciplines.map((d) => (
                  <option key={d.id} value={d.name} />
                ))}
              </datalist>
            )}
          </div>

          {!isEditing && (
            <div>
              <Label htmlFor="subskill-name">Sub-skill (optional)</Label>
              <Input
                id="subskill-name"
                value={subSkillName}
                onChange={(e) => setSubSkillName(e.target.value)}
                placeholder="e.g. Compound Bow, Grilling"
                className="mt-1.5"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Leave blank for a discipline-only skill.
              </p>
            </div>
          )}

          <div>
            <Label>Icon</Label>
            <div className="mt-1.5 grid grid-cols-7 gap-2">
              {SKILL_ICON_PRESETS.map((iconName) => {
                const I = getIcon(iconName);
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={cn(
                      "h-10 flex items-center justify-center border bg-card transition-all",
                      icon === iconName
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    <I className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Color</Label>
            <div className="mt-1.5 flex gap-2">
              {SKILL_COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-8 h-8 border-2 transition-all",
                    color === c ? "border-foreground scale-110" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={
              isPending ||
              !disciplineName.trim() ||
              (!isEditing && !realm)
            }
          >
            {isPending ? "Saving..." : isEditing ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
