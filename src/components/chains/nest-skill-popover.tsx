"use client";

import { useState } from "react";
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
import { CornerDownRight } from "lucide-react";

type NestSkillPopoverProps = {
  skillName: string;
  otherSkills: { name: string; discipline: string }[];
  disabled?: boolean;
  onNest: (parentName: string, parentDiscipline: string, specName: string) => void;
};

export function NestSkillPopover({
  skillName,
  otherSkills,
  disabled,
  onNest,
}: NestSkillPopoverProps) {
  const [open, setOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const [specName, setSpecName] = useState(skillName);

  const handleOpen = (next: boolean) => {
    if (next) {
      setSelectedParent(null);
      setSpecName(skillName);
    }
    setOpen(next);
  };

  const handleConfirm = () => {
    if (!selectedParent || !specName.trim()) return;
    const parent = otherSkills.find((s) => s.name === selectedParent);
    if (!parent) return;
    onNest(parent.name, parent.discipline, specName.trim());
    setOpen(false);
  };

  if (otherSkills.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={handleOpen} modal={false}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          title="Nest as specialization under another skill"
          className="shrink-0 p-0.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
        >
          <CornerDownRight className="w-3 h-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3" align="start">
        <div className="space-y-2">
          <Label className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">
            Nest &ldquo;{skillName}&rdquo; under
          </Label>
          <Select value={selectedParent ?? ""} onValueChange={(v) => setSelectedParent(v || null)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select a skill..." />
            </SelectTrigger>
            <SelectContent className="z-[70]">
              {otherSkills.map((s) => (
                <SelectItem key={s.name} value={s.name}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedParent && (
          <>
            <div className="space-y-2">
              <Label className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">
                Specialization name
              </Label>
              <Input
                value={specName}
                onChange={(e) => setSpecName(e.target.value)}
                className="h-8 text-xs"
                placeholder={skillName}
              />
            </div>
            <Button
              size="sm"
              className="w-full"
              disabled={!specName.trim()}
              onClick={handleConfirm}
            >
              <CornerDownRight className="w-3 h-3" />
              Nest under {selectedParent}
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
