"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { QuestForm } from "@/components/quests/quest-form";
import { Plus } from "lucide-react";

interface Props {
  chainId: string;
  nextOrder: number;
  skills: Array<{
    id: string;
    name: string;
    discipline?: string | null;
    children?: Array<{ id: string; name: string }>;
  }>;
  questNames?: string[];
}

export function AddQuestToChain({
  chainId,
  nextOrder,
  skills,
  questNames = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(nextOrder);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setPosition(nextOrder);
  };

  const positionOptions = Array.from({ length: nextOrder + 1 }, (_, i) => i);

  const positionLabel = (i: number): string => {
    if (i === 0 && nextOrder === 0) return "Step 1 (first quest)";
    if (i === 0) return `Step 1 (before "${questNames[0]}")`;
    if (i === nextOrder) return `Step ${i + 1} (end of chain)`;
    return `Step ${i + 1} (before "${questNames[i]}")`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-3 h-3" />
          Add Quest
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Quest to Chain</DialogTitle>
        </DialogHeader>

        {nextOrder > 0 && (
          <div>
            <Label>Position</Label>
            <Select
              value={String(position)}
              onValueChange={(v) => setPosition(Number(v))}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {positionOptions.map((i) => (
                  <SelectItem key={i} value={String(i)}>
                    {positionLabel(i)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <QuestForm
          skills={skills}
          defaultChainId={chainId}
          defaultChainOrder={position}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
