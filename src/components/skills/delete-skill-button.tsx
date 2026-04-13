"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteSkill } from "@/actions/skill-actions";
import { handleActionResult } from "@/components/shared/action-handler";

interface Props {
  skillId: string;
  skillName: string;
  isSpecialization: boolean;
  specCount: number;
  questCount: number;
  redirectTo: string;
}

export function DeleteSkillButton({
  skillId,
  skillName,
  isSpecialization,
  specCount,
  questCount,
  redirectTo,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const label = isSpecialization ? "specialization" : "skill";

  const onConfirm = () => {
    startTransition(async () => {
      const result = await deleteSkill(skillId);
      handleActionResult(result);
      if (result.success) {
        setOpen(false);
        router.push(redirectTo);
        router.refresh();
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {skillName}?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>This will permanently delete the {label} &ldquo;{skillName}&rdquo;.</p>
              {!isSpecialization && specCount > 0 && (
                <p className="text-destructive">
                  {specCount} specialization{specCount === 1 ? "" : "s"} will also be deleted.
                </p>
              )}
              {questCount > 0 && (
                <p>
                  {questCount} quest{questCount === 1 ? "" : "s"} will be unlinked from this {label} but not deleted.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
