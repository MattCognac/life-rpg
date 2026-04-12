"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CHARACTER_CLASSES, CLASS_KEYS, type CharacterClass } from "@/lib/classes";
import { ClassIcon } from "@/components/shared/class-icon";
import { changeClass } from "@/actions/character-actions";
import { handleActionResult } from "@/components/shared/action-handler";
import { cn } from "@/lib/utils";

export function ChangeClass({ currentClass }: { currentClass: CharacterClass }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CharacterClass>(currentClass);
  const [isPending, startTransition] = useTransition();

  const onConfirm = () => {
    if (selected === currentClass) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      const result = await changeClass(selected);
      handleActionResult(result);
      if (result.success) {
        setOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-xs text-primary hover:text-primary/80 transition-colors font-body underline underline-offset-2">
          Change class
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Change Your Path</DialogTitle>
        </DialogHeader>
        <TooltipProvider delayDuration={300}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {CLASS_KEYS.map((key) => {
              const cls = CHARACTER_CLASSES[key];
              const active = selected === key;
              return (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setSelected(key)}
                      className={cn(
                        "norse-card p-3 text-center space-y-1.5 transition-all cursor-pointer",
                        active
                          ? "border-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
                          : "hover:border-muted-foreground/40"
                      )}
                    >
                      <ClassIcon characterClass={key} className="w-6 h-6 mx-auto text-primary" />
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
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? "Changing..." : "Confirm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
