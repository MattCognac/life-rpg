"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteQuest } from "@/actions/quest-actions";
import { handleActionResult } from "@/components/shared/action-handler";
import { Trash2 } from "lucide-react";

export function DeleteQuestButton({
  id,
  redirectTo,
}: {
  id: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onConfirm = () => {
    startTransition(async () => {
      const result = await deleteQuest(id);
      handleActionResult(result);
      if (result.success && redirectTo) router.push(redirectTo);
    });
  };

  return (
    <ConfirmDialog
      onConfirm={onConfirm}
      title="Delete Quest"
      description="Delete this quest? This cannot be undone."
      confirmLabel="Delete"
      variant="destructive"
      disabled={isPending}
    >
      <Button variant="destructive" size="sm" disabled={isPending}>
        <Trash2 className="w-3 h-3" />
        Delete
      </Button>
    </ConfirmDialog>
  );
}
