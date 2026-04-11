import { db } from "./db";

/**
 * Get the character for a specific user.
 * Returns null if no character exists (user needs onboarding).
 */
export async function getCharacterForUser(userId: string) {
  return db.character.findUnique({ where: { userId } });
}
