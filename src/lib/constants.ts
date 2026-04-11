export const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Trivial",
  2: "Easy",
  3: "Medium",
  4: "Hard",
  5: "Legendary",
};

export const DIFFICULTY_COLORS: Record<number, string> = {
  1: "#9ca3af", // gray
  2: "#4ade80", // green
  3: "#60a5fa", // blue
  4: "#c084fc", // purple
  5: "#ff8201", // gold (Valheim)
};

export const SKILL_COLOR_PRESETS = [
  "#dd6119", // Valheim orange
  "#ad2817", // burnt red
  "#ff8201", // fire gold
  "#4ade80", // moss green
  "#60a5fa", // ice blue
  "#c084fc", // mystic purple
  "#facc15", // sun yellow
  "#f87171", // blood red
];

export const SKILL_ICON_PRESETS = [
  "Sword",
  "Shield",
  "Dumbbell",
  "Code",
  "Book",
  "Music",
  "ChefHat",
  "Palette",
  "Brain",
  "Heart",
  "Mountain",
  "Sparkles",
  "Flame",
  "Leaf",
];

export const QUEST_STATUSES = {
  ACTIVE: "active",
  COMPLETED: "completed",
  FAILED: "failed",
  LOCKED: "locked",
} as const;

export const ACTIVITY_TYPES = {
  QUEST_COMPLETE: "quest_complete",
  LEVEL_UP: "level_up",
  SKILL_LEVEL_UP: "skill_level_up",
  ACHIEVEMENT_UNLOCK: "achievement_unlock",
  CHAIN_COMPLETE: "chain_complete",
} as const;
