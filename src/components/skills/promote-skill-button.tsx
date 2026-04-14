"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { unparentSkill } from "@/actions/skill-actions";
import { handleActionResult } from "@/components/shared/action-handler";
import { DISCIPLINES, type DisciplineSlug } from "@/lib/disciplines";
import { ArrowUpFromDot } from "lucide-react";

interface Props {
  skillId: string;
}

export function PromoteSkillButton({ skillId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [discipline, setDiscipline] = useState<DisciplineSlug | "">("");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirm = () => {
    if (!discipline) return;
    startTransition(async () => {
      const result = await unparentSkill(skillId, discipline);
      handleActionResult(result);
      if (result.success) {
        router.push(`/skills/${skillId}`);
        router.refresh();
      }
    });
  };

  if (!showConfirm) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowConfirm(true)}
        className="text-xs"
      >
        <ArrowUpFromDot className="w-3.5 h-3.5" />
        Promote to skill
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={discipline} onValueChange={(v) => setDiscipline(v as DisciplineSlug)}>
        <SelectTrigger className="w-[160px] h-8 text-xs">
          <SelectValue placeholder="Choose discipline" />
        </SelectTrigger>
        <SelectContent>
          {DISCIPLINES.map((d) => (
            <SelectItem key={d.slug} value={d.slug}>
              <span style={{ color: d.color }}>{d.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        disabled={!discipline || isPending}
        onClick={handleConfirm}
        className="text-xs"
      >
        {isPending ? "Promoting..." : "Confirm"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => { setShowConfirm(false); setDiscipline(""); }}
        className="text-xs"
      >
        Cancel
      </Button>
    </div>
  );
}
