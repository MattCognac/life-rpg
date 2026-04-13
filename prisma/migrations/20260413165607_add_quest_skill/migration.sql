-- CreateTable
CREATE TABLE "QuestSkill" (
    "id" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    CONSTRAINT "QuestSkill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuestSkill_questId_idx" ON "QuestSkill"("questId");

-- CreateIndex
CREATE INDEX "QuestSkill_skillId_idx" ON "QuestSkill"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestSkill_questId_skillId_key" ON "QuestSkill"("questId", "skillId");

-- AddForeignKey
ALTER TABLE "QuestSkill" ADD CONSTRAINT "QuestSkill_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestSkill" ADD CONSTRAINT "QuestSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
