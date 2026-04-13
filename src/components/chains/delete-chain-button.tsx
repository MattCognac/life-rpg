"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteChain } from "@/actions/chain-actions";
import { handleActionResult } from "@/components/shared/action-handler";
import { Trash2, AlertTriangle } from "lucide-react";

interface Props {
  id: string;
  name: string;
  questCount: number;
  completedCount: number;
}

export function DeleteChainButton({
  id,
  name,
  questCount,
  completedCount,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onConfirm = () => {
    startTransition(async () => {
      const result = await deleteChain(id);
      handleActionResult(result);
      if (result.success) {
        setOpen(false);
        router.push("/chains");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="w-3 h-3" />
          Delete Chain
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Delete this chain?
          </DialogTitle>
          <DialogDescription>
            You are about to permanently delete{" "}
            <span className="text-gold font-display">{name}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 text-sm font-body">
          <p className="text-foreground">This will:</p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1">
            <li>
              Remove all{" "}
              <span className="text-foreground">{questCount} quest{questCount === 1 ? "" : "s"}</span>{" "}
              in this chain
            </li>
            {completedCount > 0 && (
              <li>
                Refund XP from{" "}
                <span className="text-foreground">
                  {completedCount} completed quest{completedCount === 1 ? "" : "s"}
                </span>{" "}
                (character level and affected skill levels may drop)
              </li>
            )}
            <li>
              Re-check achievements (any unlocked by this chain&apos;s progress
              may become locked again)
            </li>
          </ul>
          <p className="text-muted-foreground pt-1">
            Skills only used by this chain&apos;s quests will be removed.
            Skills shared with other quests will be kept.
          </p>
          <p className="text-destructive pt-2 font-display text-xs tracking-widest uppercase">
            This cannot be undone.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            <Trash2 className="w-3 h-3" />
            {isPending ? "Deleting..." : "Delete Forever"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
