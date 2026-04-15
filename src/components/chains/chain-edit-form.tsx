"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { DifficultyStars } from "@/components/quests/difficulty-stars";
import { updateChain, removeQuestsFromChain } from "@/actions/chain-actions";
import { handleActionResult } from "@/components/shared/action-handler";
import { CHAIN_TIERS } from "@/lib/disciplines";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Check, Lock, Trash2, Zap, AlertTriangle } from "lucide-react";
import { DIFFICULTY_LABELS } from "@/lib/constants";

interface ChainQuest {
  id: string;
  title: string;
  difficulty: number;
  xpReward: number;
  status: string;
  chainOrder: number | null;
}

interface Props {
  chain: {
    id: string;
    name: string;
    description: string;
    tier: string;
  };
  quests: ChainQuest[];
}

export function ChainEditForm({ chain, quests }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(chain.name);
  const [description, setDescription] = useState(chain.description);
  const [tier, setTier] = useState(chain.tier);
  const [deleteTarget, setDeleteTarget] = useState<ChainQuest | null>(null);

  const onSaveMetadata = () => {
    startTransition(async () => {
      const result = await updateChain(chain.id, { name, description, tier });
      handleActionResult(result);
      if (result.success) router.refresh();
    });
  };

  const onConfirmDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await removeQuestsFromChain(chain.id, [deleteTarget.id]);
      handleActionResult(result);
      if (result.success) {
        setDeleteTarget(null);
        router.refresh();
      }
    });
  };

  const metadataChanged =
    name !== chain.name || description !== chain.description || tier !== chain.tier;

  return (
    <div className="space-y-6">
      <div className="norse-card p-6 space-y-4">
        <h2 className="font-display text-sm tracking-widest uppercase text-muted-foreground">
          Chain Details
        </h2>
        <div>
          <Label htmlFor="chain-name">Name</Label>
          <Input
            id="chain-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="chain-desc">Description</Label>
          <Textarea
            id="chain-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Tier</Label>
          <div className="mt-1.5 grid grid-cols-5 gap-2">
            {CHAIN_TIERS.map((t) => (
              <button
                key={t.slug}
                type="button"
                onClick={() => setTier(t.slug)}
                className={cn(
                  "py-2.5 border flex flex-col items-center gap-1 transition-all",
                  tier === t.slug
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                <span
                  className="text-[9px] font-display uppercase tracking-widest"
                  style={{ color: tier === t.slug ? t.color : undefined }}
                >
                  {t.name}
                </span>
              </button>
            ))}
          </div>
        </div>
        {metadataChanged && (
          <div className="flex justify-end">
            <Button
              onClick={onSaveMetadata}
              disabled={isPending || !name.trim()}
            >
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-sm tracking-widest uppercase text-muted-foreground">
          Quest Steps ({quests.length})
        </h2>

        {quests.map((quest, i) => {
          const isCompleted = quest.status === "completed";
          const isLocked = quest.status === "locked";

          return (
            <div key={quest.id} className="relative">
              <Link href={`/quests/${quest.id}`} className="absolute inset-0 z-10" />
              <div className="norse-card p-3 flex items-center gap-3 cursor-pointer relative z-20 pointer-events-none [&_button]:pointer-events-auto [&_button]:relative [&_button]:z-30">
                <div className="flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-display">
                  {isCompleted ? (
                    <Check className="w-3 h-3 text-success" />
                  ) : isLocked ? (
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <span className="text-primary">{i + 1}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "font-display text-sm tracking-wider uppercase truncate",
                      isCompleted
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    )}
                  >
                    {quest.title}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <DifficultyStars difficulty={quest.difficulty} />
                    <span className="text-xs text-gold font-display flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5" />
                      {quest.xpReward}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-display uppercase">
                      {DIFFICULTY_LABELS[quest.difficulty]}
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteTarget(quest)}
                  disabled={isPending}
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="sr-only">Delete quest</span>
                </Button>
              </div>
            </div>
          );
        })}

        {quests.length === 0 && (
          <div className="norse-card p-8 text-center text-sm text-muted-foreground">
            No quests in this chain yet.
          </div>
        )}
      </div>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Remove quest from chain?
            </DialogTitle>
            <DialogDescription>
              You are about to delete{" "}
              <span className="text-gold font-display">
                {deleteTarget?.title}
              </span>{" "}
              from this chain.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-sm font-body">
            <p className="text-foreground">This will:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Remove the quest and all its completions</li>
              <li>Refund any XP earned from this quest</li>
              <li>Re-order remaining quests in the chain</li>
            </ul>
            <p className="text-destructive pt-2 font-display text-xs tracking-widest uppercase">
              This cannot be undone.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirmDelete}
              disabled={isPending}
            >
              <Trash2 className="w-3 h-3" />
              {isPending ? "Deleting..." : "Delete Quest"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
