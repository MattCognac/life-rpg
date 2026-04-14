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
import { reparentSkill } from "@/actions/skill-actions";
import { handleActionResult } from "@/components/shared/action-handler";
import { CornerDownRight } from "lucide-react";

interface Props {
  skillId: string;
  targets: Array<{ id: string; name: string }>;
}

export function ReparentSkillSelect({ skillId, targets }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [parentId, setParentId] = useState<string>("");
  const [showConfirm, setShowConfirm] = useState(false);

  if (targets.length === 0) return null;

  const handleConfirm = () => {
    if (!parentId) return;
    startTransition(async () => {
      const result = await reparentSkill(skillId, parentId);
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
        <CornerDownRight className="w-3.5 h-3.5" />
        Nest under...
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={parentId} onValueChange={setParentId}>
        <SelectTrigger className="w-[180px] h-8 text-xs">
          <SelectValue placeholder="Choose parent skill" />
        </SelectTrigger>
        <SelectContent>
          {targets.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        disabled={!parentId || isPending}
        onClick={handleConfirm}
        className="text-xs"
      >
        {isPending ? "Moving..." : "Confirm"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => { setShowConfirm(false); setParentId(""); }}
        className="text-xs"
      >
        Cancel
      </Button>
    </div>
  );
}
