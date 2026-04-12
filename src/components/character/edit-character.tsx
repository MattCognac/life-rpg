"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
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
import { CHARACTER_CLASSES, CLASS_KEYS, type CharacterClass } from "@/lib/classes";
import { ClassIcon } from "@/components/shared/class-icon";
import { renameCharacter, changeClass } from "@/actions/character-actions";
import { handleActionResult } from "@/components/shared/action-handler";
import { cn } from "@/lib/utils";

interface Props {
  currentName: string;
  currentClass: CharacterClass;
}

export function EditCharacter({ currentName, currentClass }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [selectedClass, setSelectedClass] = useState<CharacterClass>(currentClass);
  const [isPending, startTransition] = useTransition();

  const onSave = () => {
    startTransition(async () => {
      const nameChanged = name.trim() !== currentName;
      const classChanged = selectedClass !== currentClass;

      if (nameChanged) {
        const result = await renameCharacter(name.trim());
        handleActionResult(result);
        if (!result.success) return;
      }

      if (classChanged) {
        const result = await changeClass(selectedClass);
        handleActionResult(result);
        if (!result.success) return;
      }

      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) {
          setName(currentName);
          setSelectedClass(currentClass);
        }
        setOpen(v);
      }}
    >
      <DialogTrigger asChild>
        <button
          className="p-1.5 border border-border bg-card/60 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
          title="Edit character"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Character</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <Label htmlFor="hero-name">Name</Label>
            <Input
              id="hero-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="mt-1.5"
              maxLength={30}
            />
          </div>

          <div>
            <Label>Class</Label>
            <TooltipProvider delayDuration={300}>
              <div className="mt-1.5 grid grid-cols-2 md:grid-cols-4 gap-2">
                {CLASS_KEYS.map((key) => {
                  const cls = CHARACTER_CLASSES[key];
                  const active = selectedClass === key;
                  return (
                    <Tooltip key={key}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => setSelectedClass(key)}
                          className={cn(
                            "norse-card p-3 text-center space-y-1.5 transition-all cursor-pointer",
                            active
                              ? "border-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
                              : "hover:border-muted-foreground/40"
                          )}
                        >
                          <ClassIcon
                            characterClass={key}
                            className="w-6 h-6 mx-auto text-primary"
                          />
                          <div className="font-display text-xs tracking-wider uppercase text-foreground">
                            {cls.name}
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[220px] text-center">
                        <p className="font-medium italic text-xs">{cls.flavor}</p>
                        <p className="text-muted-foreground text-[10px] mt-1">{cls.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isPending || !name.trim()}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
