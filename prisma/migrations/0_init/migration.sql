-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Adventurer',
    "title" TEXT NOT NULL DEFAULT 'Novice',
    "class" TEXT NOT NULL DEFAULT 'warrior',
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "hasCompletedTutorial" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'sword',
    "color" TEXT NOT NULL DEFAULT '#dd6119',
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "realm" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "difficulty" INTEGER NOT NULL DEFAULT 2,
    "xpReward" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isDaily" BOOLEAN NOT NULL DEFAULT false,
    "dailyCron" TEXT,
    "completedAt" TIMESTAMP(3),
    "skillId" TEXT,
    "chainId" TEXT,
    "chainOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestChain" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "tier" TEXT NOT NULL DEFAULT 'common',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestChain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "xpAwarded" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyStreak" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastCompleted" TIMESTAMP(3),

    CONSTRAINT "DailyStreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'trophy',
    "category" TEXT NOT NULL DEFAULT 'general',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "unlockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Character_userId_key" ON "Character"("userId");

-- CreateIndex
CREATE INDEX "Skill_userId_idx" ON "Skill"("userId");

-- CreateIndex
CREATE INDEX "Skill_parentId_idx" ON "Skill"("parentId");

-- CreateIndex
CREATE INDEX "Skill_userId_realm_idx" ON "Skill"("userId", "realm");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_userId_name_key" ON "Skill"("userId", "name");

-- CreateIndex
CREATE INDEX "Quest_userId_idx" ON "Quest"("userId");

-- CreateIndex
CREATE INDEX "Quest_status_idx" ON "Quest"("status");

-- CreateIndex
CREATE INDEX "Quest_chainId_chainOrder_idx" ON "Quest"("chainId", "chainOrder");

-- CreateIndex
CREATE INDEX "QuestChain_userId_idx" ON "QuestChain"("userId");

-- CreateIndex
CREATE INDEX "QuestCompletion_userId_idx" ON "QuestCompletion"("userId");

-- CreateIndex
CREATE INDEX "QuestCompletion_completedAt_idx" ON "QuestCompletion"("completedAt");

-- CreateIndex
CREATE INDEX "QuestCompletion_questId_idx" ON "QuestCompletion"("questId");

-- CreateIndex
CREATE INDEX "DailyStreak_userId_idx" ON "DailyStreak"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStreak_userId_questId_key" ON "DailyStreak"("userId", "questId");

-- CreateIndex
CREATE INDEX "Achievement_userId_idx" ON "Achievement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_userId_key_key" ON "Achievement"("userId", "key");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "QuestChain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestCompletion" ADD CONSTRAINT "QuestCompletion_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

