-- AlterTable
ALTER TABLE "QuestChain" ADD COLUMN "starred" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "QuestChain" ADD COLUMN "starredAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "QuestChain_userId_starred_idx" ON "QuestChain"("userId", "starred");
