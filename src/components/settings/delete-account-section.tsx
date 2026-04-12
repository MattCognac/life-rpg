"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteAccount } from "@/actions/account-actions";
import { toast } from "@/components/shared/toaster";
import { AlertTriangle, Trash2 } from "lucide-react";

const CONFIRMATION_WORD = "DELETE";

export function DeleteAccountSection() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [isPending, startTransition] = useTransition();

  const confirmed = confirmation === CONFIRMATION_WORD;

  const onConfirm = () => {
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteAccount();
      if (!result.success) {
        toast({
          type: "default",
          title: "Error",
          description: result.error ?? "Failed to delete account",
        });
        return;
      }

      router.push("/login");
      router.refresh();
    });
  };

  return (
    <div className="norse-card p-6 border-destructive/30">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        <h2 className="font-display text-lg tracking-widest uppercase text-destructive">
          Danger Zone
        </h2>
      </div>

      <p className="text-sm text-muted-foreground font-body mb-4">
        Permanently delete your account and all associated data. This action
        cannot be undone — all quests, skills, chains, achievements, and
        progress will be lost forever.
      </p>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setConfirmation("");
        }}
      >
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 className="w-3 h-3" />
            Delete Account
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete your account?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete your character, all quests, skills,
              chains, achievements, streaks, and activity history. Your login
              will be removed.{" "}
              <span className="text-destructive font-semibold">
                This cannot be undone.
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="delete-confirm">
                Type <span className="text-destructive font-mono">{CONFIRMATION_WORD}</span> to
                confirm
              </Label>
              <Input
                id="delete-confirm"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder={CONFIRMATION_WORD}
                autoComplete="off"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={onConfirm}
                disabled={!confirmed || isPending}
              >
                {isPending ? "Deleting..." : "Permanently Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
