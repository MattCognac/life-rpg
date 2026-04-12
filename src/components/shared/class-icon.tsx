import {
  Swords,
  Sparkles,
  Compass,
  Leaf,
  Coins,
  TreePine,
  Wrench,
  Scroll,
} from "lucide-react";
import { CHARACTER_CLASSES, type CharacterClass } from "@/lib/classes";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Swords,
  Sparkles,
  Compass,
  Leaf,
  Coins,
  TreePine,
  Wrench,
  Scroll,
};

interface ClassIconProps {
  characterClass: CharacterClass;
  className?: string;
}

export function ClassIcon({ characterClass, className }: ClassIconProps) {
  const classDef = CHARACTER_CLASSES[characterClass];
  const Icon = ICON_MAP[classDef.icon];
  if (!Icon) return null;
  return <Icon className={className} />;
}
