"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from "@/lib/constants";
import { XP_BY_DIFFICULTY } from "@/lib/xp";
import { DISCIPLINES } from "@/lib/disciplines";
import { getChainTier } from "@/lib/disciplines";
import { createQuest, updateQuest } from "@/actions/quest-actions";
import { handleActionResult } from "@/components/shared/action-handler";
import { toast } from "@/components/shared/toaster";
import { isDailyActiveToday, nextActiveLabel, scheduleLabel } from "@/lib/daily";
import { cn } from "@/lib/utils";
import { Check, Swords, Zap, Plus } from "lucide-react";
import { SkillForm } from "@/components/skills/skill-form";

interface Skill {
  id: string;
  name: string;
  color: string;
  discipline?: string | null;
  parentId?: string | null;
  children?: Array<{ id: string; name: string; color: string }>;
}

interface Chain {
  id: string;
  name: string;
  tier?: string;
}

interface Props {
  skills: Skill[];
  chains?: Chain[];
  defaultChainId?: string;
  defaultChainOrder?: number;
  defaultIsDaily?: boolean;
  quest?: {
    id: string;
    title: string;
    description: string;
    difficulty: number;
    xpReward: number;
    skillId: string | null;
  };
  onDone?: () => void;
}

export function QuestForm({
  skills,
  chains,
  defaultChainId,
  defaultChainOrder,
  defaultIsDaily,
  quest,
  onDone,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(quest?.title ?? "");
  const [description, setDescription] = useState(quest?.description ?? "");
  const [difficulty, setDifficulty] = useState(quest?.difficulty ?? 2);
  const [skillId, setSkillId] = useState<string>(quest?.skillId ?? "none");
  const [chainId, setChainId] = useState<string>(defaultChainId ?? "none");
  const [isDaily, setIsDaily] = useState(defaultIsDaily ?? false);
  const [dailyCron, setDailyCron] = useState<string>("daily");

  const xpReward = XP_BY_DIFFICULTY[difficulty];

  const skillsByDiscipline = useMemo(() => {
    return DISCIPLINES.map((disc) => ({
      discipline: disc,
      skills: skills.filter((s) => s.discipline === disc.slug),
    })).filter((g) => g.skills.length > 0);
  }, [skills]);

  const ungroupedSkills = useMemo(
    () => skills.filter((s) => !s.discipline),
    [skills]
  );

  const onSubmit = () => {
    if (!title.trim()) return;
    startTransition(async () => {
      const input = {
        title,
        description,
        difficulty,
        xpReward,
        skillId: skillId === "none" ? null : skillId,
        chainId: chainId === "none" ? null : chainId,
        chainOrder: defaultChainOrder,
        isDaily,
        dailyCron: isDaily ? dailyCron : null,
      };
      const result = quest
        ? await updateQuest(quest.id, {
            title,
            description,
            difficulty,
            xpReward,
            skillId: skillId === "none" ? null : skillId,
          })
        : await createQuest(input);
      handleActionResult(result);
      if (result.success) {
        if (!quest && isDaily && !isDailyActiveToday(dailyCron)) {
          toast({
            type: "default",
            title: "Daily Created",
            description: `${scheduleLabel(dailyCron)} — it'll appear on ${nextActiveLabel(dailyCron)}.`,
          });
        }
        router.refresh();
        if (onDone) onDone();
        else if (!quest) router.back();
      }
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="title">Quest Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Run 5 kilometers"
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this quest entail?"
          className="mt-1.5"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label>Difficulty</Label>
          <div className="flex items-center gap-1.5 text-gold font-display text-sm">
            <Zap className="w-3.5 h-3.5" />
            <span>{xpReward} XP</span>
          </div>
        </div>
        <div className="mt-1.5 grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className={cn(
                "py-2 border flex flex-col items-center gap-1 transition-all",
                difficulty === d
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <div className="flex">
                {Array.from({ length: d }).map((_, i) => (
                  <Swords
                    key={i}
                    className="w-2.5 h-2.5"
                    fill={DIFFICULTY_COLORS[d]}
                    style={{ color: DIFFICULTY_COLORS[d] }}
                  />
                ))}
              </div>
              <span
                className="text-[9px] font-display uppercase tracking-widest"
                style={{ color: DIFFICULTY_COLORS[d] }}
              >
                {DIFFICULTY_LABELS[d]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="skill">Skill (optional)</Label>
          <SkillForm
            trigger={
              <button
                type="button"
                className="text-[10px] font-display uppercase tracking-widest text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                New Skill
              </button>
            }
            onCreated={(id) => setSkillId(id)}
          />
        </div>
        <Select value={skillId} onValueChange={setSkillId}>
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="No skill" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No skill</SelectItem>
            {skillsByDiscipline.map(({ discipline, skills: discSkills }) => (
              <SelectGroup key={discipline.slug}>
                <SelectLabel
                  className="text-[10px] font-display uppercase tracking-widest"
                  style={{ color: discipline.color }}
                >
                  {discipline.name}
                </SelectLabel>
                {discSkills.map((s) => (
                  <div key={s.id}>
                    <SelectItem value={s.id}>
                      {s.name}
                    </SelectItem>
                    {s.children?.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        &nbsp;&nbsp;↳ {child.name}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectGroup>
            ))}
            {ungroupedSkills.length > 0 && (
              <SelectGroup>
                <SelectLabel className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
                  Other
                </SelectLabel>
                {ungroupedSkills.map((s) => (
                  <div key={s.id}>
                    <SelectItem value={s.id}>
                      {s.name}
                    </SelectItem>
                    {s.children?.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        &nbsp;&nbsp;↳ {child.name}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
      </div>

      {chains && chains.length > 0 && !quest && !defaultIsDaily && (
        <div>
          <Label htmlFor="chain">Chain (optional)</Label>
          <Select value={chainId} onValueChange={setChainId}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Add to chain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Standalone quest</SelectItem>
              {chains.map((c) => {
                const tier = c.tier ? getChainTier(c.tier) : null;
                return (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      {tier && tier.slug !== "common" && (
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tier.color }}
                        />
                      )}
                      {c.name}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      {!quest && defaultIsDaily && (
        <div>
          <Label>Schedule</Label>
          <Select value={dailyCron} onValueChange={setDailyCron}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Every day</SelectItem>
              <SelectItem value="weekdays">Weekdays only</SelectItem>
              <SelectItem value="weekends">Weekends only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {!quest && !defaultIsDaily && (
        <div
          className={cn(
            "flex items-start gap-3 p-3 border bg-card/50 cursor-pointer transition-all duration-300",
            isDaily
              ? "border-primary/60 bg-primary/5"
              : "border-border hover:border-primary/30"
          )}
          onClick={() => setIsDaily(!isDaily)}
        >
          <button
            type="button"
            role="checkbox"
            aria-checked={isDaily}
            className={cn(
              "mt-0.5 flex-shrink-0 w-5 h-5 border transition-all duration-200 flex items-center justify-center",
              isDaily
                ? "border-primary bg-primary/20 shadow-[0_0_8px_hsl(var(--primary)/0.4)]"
                : "border-border bg-card hover:border-primary/50"
            )}
            onClick={(e) => {
              e.stopPropagation();
              setIsDaily(!isDaily);
            }}
          >
            <Check
              className={cn(
                "w-3.5 h-3.5 text-primary transition-all duration-200",
                isDaily ? "opacity-100 scale-100" : "opacity-0 scale-75"
              )}
              strokeWidth={3}
            />
          </button>
          <div className="flex-1">
            <span
              className="font-display text-xs tracking-widest uppercase text-foreground cursor-pointer select-none"
            >
              Daily Quest
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              Completable once per day, builds a streak.
            </p>
            {isDaily && (
              <Select value={dailyCron} onValueChange={setDailyCron}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Every day</SelectItem>
                  <SelectItem value="weekdays">Weekdays only</SelectItem>
                  <SelectItem value="weekends">Weekends only</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onDone && (
          <Button variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        )}
        <Button onClick={onSubmit} disabled={isPending || !title.trim()}>
          {isPending
            ? "Saving..."
            : quest
              ? "Save"
              : defaultIsDaily
                ? "Create Daily"
                : "Create Quest"}
        </Button>
      </div>
    </div>
  );
}
