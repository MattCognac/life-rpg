-- Enable Row Level Security on tables that were missing it.
-- Since the app uses Prisma (direct connection) for all data queries,
-- no policies are needed — RLS with no policies blocks all PostgREST access
-- while Prisma continues to work as the database owner.

ALTER TABLE "QuestSkill" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
