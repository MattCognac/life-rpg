-- Rename realm column to discipline on Skill table
ALTER TABLE "Skill" RENAME COLUMN "realm" TO "discipline";
ALTER INDEX "Skill_userId_realm_idx" RENAME TO "Skill_userId_discipline_idx";
