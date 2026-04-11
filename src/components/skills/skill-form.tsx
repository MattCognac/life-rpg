"use client";

import { useState, useTransition } from "react";
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
import { SKILL_COLOR_PRESETS, SKILL_ICON_PRESETS } from "@/lib/constants";
import { createSkill, updateSkill } from "@/actions/skill-actions";
import { handleActionResult } from "@/components/shared/action-handler";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

function getIcon(name: string): LucideIcon {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  return icons[name] ?? LucideIcons.Sword;
}

interface Props {
  skill?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  trigger?: React.ReactNode;
}

export function SkillForm({ skill, trigger }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(skill?.name ?? "");
  const [icon, setIcon] = useState(skill?.icon ?? "Sword");
  const [color, setColor] = useState(skill?.color ?? SKILL_COLOR_PRESETS[0]);

  const onSubmit = () => {
    startTransition(async () => {
      const result = skill
        ? await updateSkill(skill.id, { name, icon, color })
        : await createSkill({ name, icon, color });
      handleActionResult(result);
      if (result.success) {
        setOpen(false);
        if (!skill) {
          setName("");
          setIcon("Sword");
          setColor(SKILL_COLOR_PRESETS[0]);
        }
        router.refresh();
      }
    });
  };

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
          <DialogTitle>{skill ? "Edit Skill" : "Forge New Skill"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fitness, Coding, Music"
              className="mt-1.5"
            />
          </div>

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
          <Button onClick={onSubmit} disabled={isPending || !name.trim()}>
            {isPending ? "Saving..." : skill ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
