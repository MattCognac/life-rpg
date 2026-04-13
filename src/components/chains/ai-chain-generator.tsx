"use client";

import {
  useState,
  useEffect,
  useTransition,
  useMemo,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from "react";
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
import {
  generateQuestChain,
  refineQuestChain,
  saveGeneratedChain,
  type GeneratedChain,
} from "@/actions/ai-actions";
import { getClassName } from "@/actions/character-actions";
import { handleActionResult } from "@/components/shared/action-handler";
import { Sparkles, Wand2, Zap, RotateCw, Check, PenLine, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { XP_BY_DIFFICULTY } from "@/lib/xp";
import { DISCIPLINES, getChainTier } from "@/lib/disciplines";
import type { DisciplineSlug } from "@/lib/disciplines";
import {
  SkillEditPopover,
  type SkillEditSnapshot,
  type SkillEditScope,
} from "@/components/chains/skill-edit-popover";

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

function normSpec(s: string | undefined): string | undefined {
  const t = s?.trim();
  return t ? t : undefined;
}

type GeneratedQuest = GeneratedChain["quests"][number];

const DEFAULT_DISCIPLINE: DisciplineSlug = "body";

function cloneQuests(quests: GeneratedQuest[]): GeneratedQuest[] {
  return quests.map((q) => ({
    ...q,
    secondarySkills: q.secondarySkills?.map((s) => ({ ...s })),
  }));
}

/** Rename / reassign / spec changes for every quest line (primary or secondary) that matches the baseline skill name. */
function applyGlobalSkillSnapshot(
  setGenerated: Dispatch<SetStateAction<GeneratedChain | null>>,
  baseline: SkillEditSnapshot,
  next: SkillEditSnapshot,
) {
  const newName = next.skillName.trim();
  if (!newName) return;

  setGenerated((g) => {
    if (!g) return g;
    let quests = cloneQuests(g.quests);
    const oldName = baseline.skillName;

    if (newName.toLowerCase() !== oldName.toLowerCase()) {
      quests = quests.map((q) => ({
        ...q,
        skillName: q.skillName.toLowerCase() === oldName.toLowerCase() ? newName : q.skillName,
        secondarySkills: q.secondarySkills?.map((sec) => ({
          ...sec,
          skillName: sec.skillName.toLowerCase() === oldName.toLowerCase() ? newName : sec.skillName,
        })),
      }));
    }

    const effectiveName =
      newName.toLowerCase() !== oldName.toLowerCase() ? newName : oldName;
    const effLower = effectiveName.toLowerCase();

    if (next.discipline !== baseline.discipline) {
      const nd = next.discipline;
      quests = quests.map((q) => ({
        ...q,
        discipline: q.skillName.toLowerCase() === effLower ? nd : q.discipline,
        secondarySkills: q.secondarySkills?.map((sec) => ({
          ...sec,
          discipline: sec.skillName.toLowerCase() === effLower ? nd : sec.discipline,
        })),
      }));
    }

    const bSpec = normSpec(baseline.specializationName);
    const nSpec = normSpec(next.specializationName);

    if (bSpec !== nSpec) {
      const sk = effLower;
      if (bSpec && nSpec) {
        quests = quests.map((q) => ({
          ...q,
          specializationName:
            q.skillName.toLowerCase() === sk &&
            q.specializationName?.toLowerCase() === bSpec.toLowerCase()
              ? nSpec
              : q.specializationName,
          secondarySkills: q.secondarySkills?.map((sec) => ({
            ...sec,
            specializationName:
              sec.skillName.toLowerCase() === sk &&
              sec.specializationName?.toLowerCase() === bSpec.toLowerCase()
                ? nSpec
                : sec.specializationName,
          })),
        }));
      } else if (bSpec && !nSpec) {
        quests = quests.map((q) => ({
          ...q,
          specializationName:
            q.skillName.toLowerCase() === sk &&
            q.specializationName?.toLowerCase() === bSpec.toLowerCase()
              ? undefined
              : q.specializationName,
          secondarySkills: q.secondarySkills?.map((sec) => ({
            ...sec,
            specializationName:
              sec.skillName.toLowerCase() === sk &&
              sec.specializationName?.toLowerCase() === bSpec.toLowerCase()
                ? undefined
                : sec.specializationName,
          })),
        }));
      } else if (!bSpec && nSpec) {
        quests = quests.map((q) => ({
          ...q,
          specializationName:
            q.skillName.toLowerCase() === sk && !normSpec(q.specializationName)
              ? nSpec
              : q.specializationName,
          secondarySkills: q.secondarySkills?.map((sec) => ({
            ...sec,
            specializationName:
              sec.skillName.toLowerCase() === sk && !normSpec(sec.specializationName)
                ? nSpec
                : sec.specializationName,
          })),
        }));
      }
    }

    return { ...g, quests };
  });
}

export function AIChainGenerator({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const listener: OpenListener = () => setOpen(true);
    openListeners.add(listener);
    return () => { openListeners.delete(listener); };
  }, []);

  useEffect(() => {
    if (open) {
      getClassName().then(setClassName);
    }
  }, [open]);

  const [goal, setGoal] = useState("");
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [isRefining, startRefining] = useTransition();
  const [generated, setGenerated] = useState<GeneratedChain | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refineMode, setRefineMode] = useState(false);
  const [refinement, setRefinement] = useState("");
  const [className, setClassName] = useState("Warrior");
  const [skillOverviewOpen, setSkillOverviewOpen] = useState(false);

  type SkillEntry = {
    name: string;
    discipline: string;
    questCount: number;
    specs: { name: string; questCount: number }[];
  };

  const uniqueSkills = useMemo((): SkillEntry[] => {
    if (!generated) return [];
    const map = new Map<string, { name: string; discipline: string; questCount: number; specs: Map<string, { name: string; questCount: number }> }>();
    for (const q of generated.quests) {
      if (!q.skillName.trim()) continue;
      const key = q.skillName.toLowerCase();
      let entry = map.get(key);
      if (!entry) {
        entry = { name: q.skillName, discipline: q.discipline, questCount: 0, specs: new Map() };
        map.set(key, entry);
      }
      entry.questCount++;
      if (q.specializationName?.trim()) {
        const specKey = q.specializationName.trim().toLowerCase();
        const spec = entry.specs.get(specKey);
        if (spec) {
          spec.questCount++;
        } else {
          entry.specs.set(specKey, { name: q.specializationName.trim(), questCount: 1 });
        }
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.questCount - a.questCount)
      .map((e) => ({ ...e, specs: Array.from(e.specs.values()) }));
  }, [generated]);

  const skillsByDiscipline = useMemo(() => {
    const groups = new Map<string, SkillEntry[]>();
    for (const skill of uniqueSkills) {
      const existing = groups.get(skill.discipline) ?? [];
      existing.push(skill);
      groups.set(skill.discipline, existing);
    }
    return DISCIPLINES
      .filter((d) => groups.has(d.slug))
      .map((d) => ({ discipline: d, skills: groups.get(d.slug)! }));
  }, [uniqueSkills]);

  const removeSkillNameFromEntireChain = (skillName: string) => {
    const lower = skillName.toLowerCase();
    if (!lower) return;
    setGenerated((g) => {
      if (!g) return g;
      return {
        ...g,
        quests: g.quests.map((q) => {
          let nq = { ...q };
          if (nq.skillName.toLowerCase() === lower) {
            nq = {
              ...nq,
              skillName: "",
              specializationName: undefined,
              discipline: DEFAULT_DISCIPLINE,
            };
          }
          if (nq.secondarySkills?.length) {
            const filtered = nq.secondarySkills.filter((s) => s.skillName.toLowerCase() !== lower);
            nq.secondarySkills = filtered.length > 0 ? filtered : undefined;
          }
          return nq;
        }),
      };
    });
  };

  const clearQuestPrimarySkill = (questIndex: number) => {
    setGenerated((g) => {
      if (!g) return g;
      const quests = [...g.quests];
      quests[questIndex] = {
        ...quests[questIndex],
        skillName: "",
        specializationName: undefined,
        discipline: DEFAULT_DISCIPLINE,
      };
      return { ...g, quests };
    });
  };

  const setQuestPrimaryFields = (questIndex: number, next: SkillEditSnapshot) => {
    setGenerated((g) => {
      if (!g) return g;
      const name = next.skillName.trim();
      const quests = [...g.quests];
      if (!name) {
        quests[questIndex] = {
          ...quests[questIndex],
          skillName: "",
          specializationName: undefined,
          discipline: next.discipline,
        };
      } else {
        quests[questIndex] = {
          ...quests[questIndex],
          skillName: name,
          discipline: next.discipline,
          specializationName: normSpec(next.specializationName),
        };
      }
      return { ...g, quests };
    });
  };

  const setQuestSecondaryFields = (questIndex: number, secIndex: number, next: SkillEditSnapshot) => {
    setGenerated((g) => {
      if (!g) return g;
      const name = next.skillName.trim();
      if (!name) return g;
      const quests = [...g.quests];
      const quest = { ...quests[questIndex] };
      const secs = [...(quest.secondarySkills ?? [])];
      secs[secIndex] = {
        ...secs[secIndex],
        skillName: name,
        discipline: next.discipline,
        specializationName: normSpec(next.specializationName),
      };
      quest.secondarySkills = secs;
      quests[questIndex] = quest;
      return { ...g, quests };
    });
  };

  const appendQuestSecondary = (questIndex: number, next: SkillEditSnapshot) => {
    setGenerated((g) => {
      if (!g) return g;
      const name = next.skillName.trim();
      if (!name) return g;
      const quests = [...g.quests];
      const quest = { ...quests[questIndex] };
      const secs = [...(quest.secondarySkills ?? [])];
      if (secs.length >= 2) return g;
      secs.push({
        discipline: next.discipline,
        skillName: name,
        specializationName: normSpec(next.specializationName),
      });
      quest.secondarySkills = secs;
      quests[questIndex] = quest;
      return { ...g, quests };
    });
  };

  const removeQuestSecondarySkill = (questIndex: number, secIndex: number) => {
    setGenerated((g) => {
      if (!g) return g;
      const quests = [...g.quests];
      const quest = { ...quests[questIndex] };
      const secs = [...(quest.secondarySkills ?? [])];
      secs.splice(secIndex, 1);
      quest.secondarySkills = secs.length > 0 ? secs : undefined;
      quests[questIndex] = quest;
      return { ...g, quests };
    });
  };

  const handlePrimaryCommit = useCallback(
    (questIndex: number) =>
      ({
        next,
        baseline,
        scope,
      }: {
        next: SkillEditSnapshot;
        baseline: SkillEditSnapshot;
        scope: SkillEditScope;
        mode: "primary" | "secondary" | "add-secondary";
      }) => {
        if (scope === "all") {
          applyGlobalSkillSnapshot(setGenerated, baseline, next);
        } else {
          setQuestPrimaryFields(questIndex, next);
        }
      },
    [],
  );

  const handleAggregatedSkillCommit = useCallback(
    ({
      next,
      baseline,
    }: {
      next: SkillEditSnapshot;
      baseline: SkillEditSnapshot;
      scope: SkillEditScope;
      mode: "primary" | "secondary" | "add-secondary";
    }) => {
      applyGlobalSkillSnapshot(setGenerated, baseline, next);
    },
    [],
  );

  const handleSecondaryCommit = useCallback(
    (questIndex: number, secIndex: number) =>
      ({
        next,
        baseline,
        scope,
      }: {
        next: SkillEditSnapshot;
        baseline: SkillEditSnapshot;
        scope: SkillEditScope;
        mode: "primary" | "secondary" | "add-secondary";
      }) => {
        if (scope === "all") {
          applyGlobalSkillSnapshot(setGenerated, baseline, next);
        } else {
          setQuestSecondaryFields(questIndex, secIndex, next);
        }
      },
    [],
  );

  const reset = () => {
    setGoal("");
    setGenerated(null);
    setError(null);
    setRefineMode(false);
    setRefinement("");
    setSkillOverviewOpen(false);
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
        {!generated && !isGenerating ? (
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
        {!generated && !isGenerating && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="goal">Your Goal</Label>
              <div className="relative mt-1.5">
                <Textarea
                  id="goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value.slice(0, 2000))}
                  maxLength={2000}
                  placeholder="Describe your goal — where you're starting and where you want to end up. The more detail you give (your experience level, what gear you have, your timeline), the better the chain will be."
                  className="scrollbar-none min-h-[100px] pb-8"
                  rows={4}
                  autoFocus
                />
                <span
                  className={`pointer-events-none absolute bottom-2 right-2 text-[10px] font-body tabular-nums leading-none select-none ${goal.length > 1800 ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {goal.length}/2,000
                </span>
              </div>
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
                    onClick={() => setGoal(ex.prompt)}
                    className="px-3 py-1 text-xs font-body border border-border bg-card hover:border-primary hover:text-primary transition-colors"
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

            <DialogFooter>
              <Button variant="ghost" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!goal.trim()}
              >
                <Wand2 className="w-4 h-4" />
                Generate
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Loading step */}
        {!generated && isGenerating && (
          <div className="py-8 space-y-4">
            <div className="norse-card p-8 text-center space-y-4">
              <Sparkles className="w-8 h-8 text-primary mx-auto animate-pulse" />
              <div className="font-display text-base tracking-widest uppercase text-primary animate-pulse">
                Consulting the Allfather...
              </div>
              <div className="text-sm text-muted-foreground font-body max-w-md mx-auto">
                Odin is forging your path. This may take up to a few minutes
                for ambitious goals — grab your mead and sit tight, {className}.
              </div>
            </div>
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
                  const hasPrimary = Boolean(quest.skillName.trim());
                  const primaryCurrent: SkillEditSnapshot = {
                    skillName: quest.skillName,
                    discipline: quest.discipline,
                    specializationName: quest.specializationName ?? "",
                  };
                  const nonDupSecondaryCount =
                    quest.secondarySkills?.filter(
                      (s) =>
                        !(
                          s.skillName.toLowerCase() === quest.skillName.toLowerCase() &&
                          s.specializationName?.toLowerCase() === quest.specializationName?.toLowerCase()
                        ),
                    ).length ?? 0;
                  const canAddSecondary = nonDupSecondaryCount < 2;

                  return (
                    <div
                      key={i}
                      className="norse-card p-3 flex items-start gap-3 group/quest"
                    >
                      <div className="w-7 h-7 flex-shrink-0 rounded-full border border-primary bg-primary/10 flex items-center justify-center font-display text-xs text-primary">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 font-display text-sm tracking-wider uppercase text-foreground break-words">
                            {quest.title}
                          </div>
                          <div className="flex shrink-0 items-center gap-1 pt-0.5 text-gold font-display text-xs">
                            <Zap className="w-3 h-3 flex-shrink-0" />
                            {XP_BY_DIFFICULTY[d]}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground font-body mt-1">
                          {quest.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <DifficultyStars difficulty={d} />
                          <SkillEditPopover
                            mode="primary"
                            showScope
                            defaultScope="all"
                            skillLabelForAll={quest.skillName || "skill"}
                            current={primaryCurrent}
                            disabled={isBusy}
                            onCommit={handlePrimaryCommit(i)}
                            onRemove={hasPrimary ? () => clearQuestPrimarySkill(i) : undefined}
                            trigger={
                              <button
                                type="button"
                                disabled={isBusy}
                                className="group"
                              >
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] cursor-pointer hover:border-primary transition-colors ${!hasPrimary ? "opacity-70 border-dashed" : ""}`}
                                >
                                  {hasPrimary ? (
                                    <>
                                      {quest.skillName}
                                      {quest.specializationName ? ` › ${quest.specializationName}` : ""}
                                    </>
                                  ) : (
                                    <span>Add skill</span>
                                  )}
                                  <PenLine className="w-2 h-2 ml-0.5 inline opacity-0 group-hover:opacity-50 transition-opacity" />
                                </Badge>
                              </button>
                            }
                          />
                          {quest.secondarySkills?.map((sec, j) => {
                            const isDuplicate =
                              sec.skillName.toLowerCase() === quest.skillName.toLowerCase() &&
                              sec.specializationName?.toLowerCase() === quest.specializationName?.toLowerCase();
                            if (isDuplicate) return null;
                            const secCurrent: SkillEditSnapshot = {
                              skillName: sec.skillName,
                              discipline: sec.discipline,
                              specializationName: sec.specializationName ?? "",
                            };
                            return (
                              <SkillEditPopover
                                key={j}
                                mode="secondary"
                                showScope
                                defaultScope="all"
                                skillLabelForAll={sec.skillName}
                                current={secCurrent}
                                disabled={isBusy}
                                onCommit={handleSecondaryCommit(i, j)}
                                onRemove={() => removeQuestSecondarySkill(i, j)}
                                trigger={
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    className="group"
                                  >
                                    <Badge variant="outline" className="text-[9px] opacity-60 cursor-pointer hover:border-primary hover:opacity-90 transition-all">
                                      {sec.skillName}
                                      {sec.specializationName ? ` › ${sec.specializationName}` : ""}
                                      <span className="ml-0.5 text-gold">+50%</span>
                                      <PenLine className="w-2 h-2 ml-0.5 inline opacity-0 group-hover:opacity-50 transition-opacity" />
                                    </Badge>
                                  </button>
                                }
                              />
                            );
                          })}
                          {canAddSecondary && (
                            <SkillEditPopover
                              mode="add-secondary"
                              showScope={false}
                              current={{
                                skillName: "",
                                discipline: quest.discipline,
                                specializationName: "",
                              }}
                              disabled={isBusy}
                              onCommit={({ next }) => appendQuestSecondary(i, next)}
                              trigger={
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  className="opacity-0 group-hover/quest:opacity-60 hover:!opacity-100 transition-opacity disabled:opacity-0"
                                  title="Add secondary skill"
                                >
                                  <Badge variant="outline" className="text-[9px] opacity-50 cursor-pointer hover:border-primary hover:opacity-80 transition-all">
                                    <Plus className="w-2.5 h-2.5" />
                                  </Badge>
                                </button>
                              }
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="norse-card border-primary/40 overflow-hidden">
              {!skillOverviewOpen ? (
                <button
                  type="button"
                  onClick={() => setSkillOverviewOpen(true)}
                  disabled={isBusy}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left group disabled:opacity-50"
                >
                  <div>
                    <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-0.5">
                      Skill breakdown
                    </div>
                    <p className="text-xs text-muted-foreground font-body">
                      Overview of skills by discipline (quest counts). Open to edit tags or remove a skill from the whole chain.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-display uppercase tracking-wider text-primary group-hover:underline">
                      Show
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              ) : (
                <div className="space-y-0">
                  <div className="flex items-center justify-between gap-2 p-4 pb-2 border-b border-border/50">
                    <div>
                      <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-0.5">
                        Skill breakdown
                      </div>
                      <p className="text-xs text-muted-foreground font-body">
                        Counts are primary-skill uses per quest. Only disciplines that appear in this chain are shown.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSkillOverviewOpen(false)}
                      disabled={isBusy}
                      className="flex items-center gap-1.5 flex-shrink-0 text-[10px] font-display uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Hide
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4 pt-3">
                    {skillsByDiscipline.length === 0 ? (
                      <p className="text-xs text-muted-foreground font-body text-center py-6">
                        No skills to show. Add or restore skill tags on the quests above.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {skillsByDiscipline.map(({ discipline: disc, skills }) => (
                          <div
                            key={disc.slug}
                            className="rounded-md border border-border/80 bg-card/40 p-2 flex flex-col min-h-[100px] max-h-56"
                          >
                            <div
                              className="text-[10px] font-display uppercase tracking-wider mb-2 pb-1 border-b shrink-0"
                              style={{ color: disc.color, borderColor: `${disc.color}35` }}
                            >
                              {disc.name}
                            </div>
                            <div className="space-y-1.5 overflow-y-auto pr-0.5 flex-1 min-h-0">
                              {skills.map((sk) => (
                                <div key={sk.name.toLowerCase()} className="space-y-1">
                                  <div className="flex items-start gap-1">
                                    <SkillEditPopover
                                      mode="primary"
                                      showScope={false}
                                      aggregateOnly
                                      current={{
                                        skillName: sk.name,
                                        discipline: sk.discipline as DisciplineSlug,
                                        specializationName: "",
                                      }}
                                      disabled={isBusy}
                                      onCommit={handleAggregatedSkillCommit}
                                      trigger={
                                        <button
                                          type="button"
                                          disabled={isBusy}
                                          className="flex-1 min-w-0 text-left rounded-sm px-1 py-0.5 hover:bg-muted/60 transition-colors group/ov"
                                        >
                                          <span className="text-[10px] font-body text-foreground leading-tight line-clamp-2">
                                            {sk.name}
                                          </span>
                                          <span className="text-[9px] text-muted-foreground tabular-nums ml-0.5">
                                            ×{sk.questCount}
                                          </span>
                                          <PenLine className="w-2.5 h-2.5 inline ml-0.5 opacity-0 group-hover/ov:opacity-50 align-middle" />
                                        </button>
                                      }
                                    />
                                    <button
                                      type="button"
                                      title="Remove this skill from the whole chain"
                                      disabled={isBusy}
                                      className="shrink-0 p-0.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                      onClick={() => removeSkillNameFromEntireChain(sk.name)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                  {sk.specs.map((sp) => (
                                    <div key={sp.name.toLowerCase()} className="flex items-start gap-1 pl-1.5 border-l border-border/60 ml-0.5">
                                      <SkillEditPopover
                                        mode="primary"
                                        showScope={false}
                                        aggregateOnly
                                        current={{
                                          skillName: sk.name,
                                          discipline: sk.discipline as DisciplineSlug,
                                          specializationName: sp.name,
                                        }}
                                        disabled={isBusy}
                                        onCommit={handleAggregatedSkillCommit}
                                        skillLabelForAll={sk.name}
                                        trigger={
                                          <button
                                            type="button"
                                            disabled={isBusy}
                                            className="flex-1 min-w-0 text-left rounded-sm px-1 py-0.5 hover:bg-muted/60 transition-colors group/sp"
                                          >
                                            <span className="text-[9px] text-muted-foreground">
                                              › {sp.name}
                                            </span>
                                            <span className="text-[9px] text-muted-foreground/80 tabular-nums ml-0.5">
                                              ×{sp.questCount}
                                            </span>
                                            <PenLine className="w-2 h-2 inline ml-0.5 opacity-0 group-hover/sp:opacity-50 align-middle" />
                                          </button>
                                        }
                                      />
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
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
