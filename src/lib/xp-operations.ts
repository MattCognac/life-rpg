import { db } from "@/lib/db";
import { computeLevel, titleForLevel } from "@/lib/xp";
import { getCharacterForUser } from "@/lib/character";

/**
 * Propagate XP change to parent skill (denormalized).
 * Call after awarding or refunding XP on a specialization.
 */
export async function propagateXpToParent(
  skillId: string,
  xpDelta: number
): Promise<void> {
  const skill = await db.skill.findUnique({
    where: { id: skillId },
    select: { parentId: true },
  });
  if (!skill?.parentId) return;

  const parent = await db.skill.findUnique({
    where: { id: skill.parentId },
  });
  if (!parent) return;

  const newTotal = Math.max(0, parent.totalXp + xpDelta);
  const { level: newLevel } = computeLevel(newTotal);
  await db.skill.update({
    where: { id: parent.id },
    data: { totalXp: newTotal, level: newLevel },
  });
}

/**
 * Refund XP from a character after quest deletion/undo.
 * Updates character level/title accordingly.
 */
export async function refundCharacterXp(userId: string, xpAmount: number) {
  if (xpAmount <= 0) return;

  const character = await getCharacterForUser(userId);
  if (!character) return;

  const newTotal = Math.max(0, character.totalXp - xpAmount);
  const { level: newLevel } = computeLevel(newTotal);

  await db.character.update({
    where: { userId },
    data: {
      totalXp: newTotal,
      level: newLevel,
      title: titleForLevel(newLevel),
    },
  });
}

/**
 * Refund XP from a skill after quest deletion/undo.
 * Also propagates the refund to the parent skill if applicable.
 * @param propagationMultiplier accounts for class perks like Artificer's deep_craft (2x parent propagation)
 */
export async function refundSkillXp(skillId: string, xpAmount: number, propagationMultiplier = 1) {
  if (xpAmount <= 0) return;

  const skill = await db.skill.findUnique({ where: { id: skillId } });
  if (!skill) return;

  const newTotal = Math.max(0, skill.totalXp - xpAmount);
  const { level: newLevel } = computeLevel(newTotal);

  await db.skill.update({
    where: { id: skillId },
    data: { totalXp: newTotal, level: newLevel },
  });

  await propagateXpToParent(skillId, -xpAmount * propagationMultiplier);
}

