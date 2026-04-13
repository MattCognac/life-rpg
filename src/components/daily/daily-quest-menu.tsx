"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteQuest } from "@/actions/quest-actions";
import { handleActionResult } from "@/components/shared/action-handler";
import { EllipsisVertical, Pencil, Trash2 } from "lucide-react";

export function DailyQuestMenu({ questId }: { questId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const onDelete = () => {
    startTransition(async () => {
      const result = await deleteQuest(questId);
      handleActionResult(result);
      if (result.success) router.refresh();
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 flex-shrink-0 text-muted-foreground hover:text-foreground"
            disabled={isPending}
          >
            <EllipsisVertical className="w-4 h-4" />
            <span className="sr-only">More options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/quests/${questId}/edit`)}>
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setConfirmOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={onDelete}
        title="Delete Quest"
        description="Delete this quest? This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
      />
    </>
  );
}
