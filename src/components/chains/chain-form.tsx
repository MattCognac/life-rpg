"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CHAIN_TIERS } from "@/lib/disciplines";
import { createChain } from "@/actions/chain-actions";
import { handleActionResult } from "@/components/shared/action-handler";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface Props {
  trigger?: React.ReactNode;
}

export function ChainForm({ trigger }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tier, setTier] = useState("common");

  const reset = () => {
    setName("");
    setDescription("");
    setTier("common");
  };

  const onSubmit = () => {
    startTransition(async () => {
      const result = await createChain({ name, description, tier });
      handleActionResult(result);
      if (result.success && result.data) {
        setOpen(false);
        reset();
        router.push(`/chains/${result.data.id}`);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost">
            <Plus className="w-4 h-4" />
            New Chain
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Forge New Chain</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="chain-name">Chain Name</Label>
            <Input
              id="chain-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Couch to 5K, Learn Guitar Basics"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="chain-desc">Description</Label>
            <Textarea
              id="chain-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this chain about?"
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
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isPending || !name.trim()}>
            {isPending ? "Creating..." : "Create Chain"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
