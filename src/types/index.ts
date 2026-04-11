export type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  events?: ActionEvents;
};

export type ActionEvents = {
  xpAwarded?: number;
  leveledUp?: { newLevel: number; newTitle: string };
  skillLeveledUp?: { skillId: string; skillName: string; newLevel: number };
  achievementsUnlocked?: Array<{ key: string; name: string; description: string; icon: string }>;
  streakUpdate?: { questId: string; newStreak: number; broken?: boolean };
  chainCompleted?: { chainId: string; chainName: string };
};
