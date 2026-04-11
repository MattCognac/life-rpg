"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from "@/lib/constants";
import { XP_BY_DIFFICULTY } from "@/lib/xp";
import { createQuest, updateQuest } from "@/actions/quest-actions";
import { handleActionResult } from "@/components/shared/action-handler";
import { cn } from "@/lib/utils";
import { Swords, Zap } from "lucide-react";

interface Skill {
  id: string;
  name: string;
  color: string;
}

interface Chain {
  id: string;
  name: string;
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

  const onSubmit = () => {
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
        <Label htmlFor="skill">Skill</Label>
        <Select value={skillId} onValueChange={setSkillId}>
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="Choose skill" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No skill</SelectItem>
            {skills.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
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
              {chains.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {!quest && (
        <div className="flex items-start gap-3 p-3 border border-border bg-card/50">
          <input
            type="checkbox"
            id="daily"
            checked={isDaily}
            onChange={(e) => setIsDaily(e.target.checked)}
            className="mt-1 accent-primary"
          />
          <div className="flex-1">
            <label
              htmlFor="daily"
              className="font-display text-xs tracking-widest uppercase text-foreground cursor-pointer"
            >
              Daily Quest
            </label>
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
          {isPending ? "Saving..." : quest ? "Save" : "Create Quest"}
        </Button>
      </div>
    </div>
  );
}
