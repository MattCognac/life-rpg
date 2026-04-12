"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DifficultyStars } from "@/components/quests/difficulty-stars";
import { Textarea } from "@/components/ui/textarea";
import { generateQuestChain, refineQuestChain, saveGeneratedChain } from "@/actions/ai-actions";
import type { GeneratedChain } from "@/actions/ai-actions";
import { handleActionResult } from "@/components/shared/action-handler";
import { Sparkles, Wand2, Zap, RotateCw, Check, PenLine } from "lucide-react";
import { XP_BY_DIFFICULTY } from "@/lib/xp";
import { getChainTier } from "@/lib/realms";

const EXAMPLES = [
  {
    label: "Master the bow",
    prompt:
      "I want to get into bow hunting. I've never done it before and don't own any gear yet.",
  },
  {
    label: "Run a marathon",
    prompt:
      "I want to run a marathon. I'm pretty out of shape and can't run more than a mile.",
  },
  {
    label: "Build a web app",
    prompt:
      "I want to build a web app and actually get people using it. I know some coding basics.",
  },
  {
    label: "Learn guitar",
    prompt:
      "I want to learn guitar. I've never played an instrument but I want to be able to play songs.",
  },
  {
    label: "Write a novel",
    prompt:
      "I want to write a novel. I have some ideas but I've never written anything long before.",
  },
];

type OpenListener = () => void;
const openListeners = new Set<OpenListener>();

export function openAIChainGenerator() {
  openListeners.forEach((l) => l());
}

export function AIChainGenerator({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const listener: OpenListener = () => setOpen(true);
    openListeners.add(listener);
    return () => { openListeners.delete(listener); };
  }, []);

  const [goal, setGoal] = useState("");
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [isRefining, startRefining] = useTransition();
  const [generated, setGenerated] = useState<GeneratedChain | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refineMode, setRefineMode] = useState(false);
  const [refinement, setRefinement] = useState("");

  const reset = () => {
    setGoal("");
    setGenerated(null);
    setError(null);
    setRefineMode(false);
    setRefinement("");
  };

  const handleClose = (o: boolean) => {
    setOpen(o);
    if (!o) reset();
  };

  const handleGenerate = () => {
    if (!goal.trim()) return;
    setError(null);
    startGenerating(async () => {
      const result = await generateQuestChain(goal);
      if (result.success && result.data) {
        setGenerated(result.data);
      } else {
        setError(result.error ?? "Generation failed");
      }
    });
  };

  const handleAccept = () => {
    if (!generated) return;
    startSaving(async () => {
      const result = await saveGeneratedChain(generated);
      handleActionResult(result);
      if (result.success && result.data) {
        setOpen(false);
        reset();
        router.push(`/chains/${result.data.chainId}`);
      }
    });
  };

  const handleRefine = () => {
    if (!generated || !refinement.trim()) return;
    setError(null);
    startRefining(async () => {
      const result = await refineQuestChain(generated, goal, refinement);
      if (result.success && result.data) {
        setGenerated(result.data);
        setRefinement("");
        setRefineMode(false);
      } else {
        setError(result.error ?? "Refinement failed");
      }
    });
  };

  const isBusy = isSaving || isRefining;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Sparkles className="w-4 h-4" />
            Forge with Odin AI
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          if (isGenerating || generated) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isGenerating || generated) e.preventDefault();
        }}
      >
        {!generated ? (
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              Forge a Quest Chain
            </DialogTitle>
            <DialogDescription>
              Describe a big goal and Odin will break it down into an ordered
              chain of quests to get you there. The more details you share, the
              more tailored your path will be.
            </DialogDescription>
          </DialogHeader>
        ) : (
          <DialogHeader className="sr-only">
            <DialogTitle>Forge a Quest Chain</DialogTitle>
          </DialogHeader>
        )}

        {/* Input step */}
        {!generated && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="goal">Your Goal</Label>
              <Textarea
                id="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Describe your goal — where you're starting and where you want to end up"
                className="mt-1.5"
                disabled={isGenerating}
                rows={3}
                autoFocus
              />
            </div>

            <div>
              <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-2">
                Or try one of these
              </div>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.label}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setGoal(ex.prompt)}
                    className="px-3 py-1 text-xs font-body border border-border bg-card hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 border border-destructive/60 bg-destructive/10 text-destructive text-sm font-body">
                {error}
              </div>
            )}

            {isGenerating && (
              <div className="norse-card p-6 text-center space-y-3">
                <Sparkles className="w-6 h-6 text-primary mx-auto animate-pulse" />
                <div className="font-display text-sm tracking-widest uppercase text-primary animate-pulse">
                  Consulting the Allfather...
                </div>
                <div className="text-xs text-muted-foreground font-body">
                  Odin is reasoning through what your goal actually requires.
                  Ambitious goals may take up to a minute to fully decompose.
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="ghost" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!goal.trim() || isGenerating}
              >
                <Wand2 className="w-4 h-4" />
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Preview step */}
        {generated && (
          <div className="space-y-4">
            <div className="norse-card p-4 border-primary/40">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
                    Chain
                  </div>
                  <div className="font-display text-xl tracking-wider uppercase text-gradient-gold mt-1">
                    {generated.chainName}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {generated.tier && generated.tier !== "common" && (
                    <Badge
                      variant="outline"
                      className="text-[9px]"
                      style={{ borderColor: getChainTier(generated.tier)?.color, color: getChainTier(generated.tier)?.color }}
                    >
                      {getChainTier(generated.tier)?.name}
                    </Badge>
                  )}
                  <Badge variant="gold">
                    {generated.quests.length} Quest{generated.quests.length === 1 ? "" : "s"}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground font-body mt-2">
                {generated.chainDescription}
              </p>
            </div>

            <div>
              <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-2">
                The Path
              </div>
              <div className="space-y-2">
                {generated.quests.map((quest, i) => {
                  const d = Math.max(1, Math.min(5, Math.round(quest.difficulty)));
                  return (
                    <div
                      key={i}
                      className="norse-card p-3 flex items-start gap-3"
                    >
                      <div className="w-7 h-7 flex-shrink-0 rounded-full border border-primary bg-primary/10 flex items-center justify-center font-display text-xs text-primary">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="font-display text-sm tracking-wider uppercase text-foreground">
                            {quest.title}
                          </div>
                          <div className="flex items-center gap-1 text-gold font-display text-xs flex-shrink-0">
                            <Zap className="w-3 h-3" />
                            {XP_BY_DIFFICULTY[d]}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground font-body mt-1">
                          {quest.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <DifficultyStars difficulty={d} />
                          <Badge variant="outline" className="text-[9px]">
                            {quest.disciplineName}
                            {quest.skillName ? ` › ${quest.skillName}` : ""}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {refineMode && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="refinement">What would you like to change?</Label>
                  <Textarea
                    id="refinement"
                    value={refinement}
                    onChange={(e) => setRefinement(e.target.value)}
                    placeholder='e.g. "I already know the basics" or "Make the early steps more detailed"'
                    className="mt-1.5"
                    disabled={isRefining}
                    rows={3}
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="p-3 border border-destructive/60 bg-destructive/10 text-destructive text-sm font-body">
                    {error}
                  </div>
                )}

                {isRefining && (
                  <div className="norse-card p-6 text-center space-y-3">
                    <Sparkles className="w-6 h-6 text-primary mx-auto animate-pulse" />
                    <div className="font-display text-sm tracking-widest uppercase text-primary animate-pulse">
                      Odin is refining your path...
                    </div>
                    <div className="text-xs text-muted-foreground font-body">
                      Adjusting the chain based on your feedback.
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setRefineMode(false);
                      setRefinement("");
                      setError(null);
                    }}
                    disabled={isRefining}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRefine}
                    disabled={!refinement.trim() || isRefining}
                  >
                    <Wand2 className="w-4 h-4" />
                    {isRefining ? "Refining..." : "Refine"}
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setGenerated(null);
                  setError(null);
                  setRefineMode(false);
                  setRefinement("");
                }}
                disabled={isBusy}
              >
                <RotateCw className="w-4 h-4" />
                Start Over
              </Button>
              {!refineMode && (
                <Button
                  variant="outline"
                  onClick={() => setRefineMode(true)}
                  disabled={isBusy}
                >
                  <PenLine className="w-4 h-4" />
                  Refine
                </Button>
              )}
              <Button onClick={handleAccept} disabled={isBusy}>
                <Check className="w-4 h-4" />
                {isSaving ? "Saving..." : "Accept Chain"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
