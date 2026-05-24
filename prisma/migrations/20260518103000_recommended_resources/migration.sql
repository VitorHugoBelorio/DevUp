-- CreateEnum
CREATE TYPE "KnowledgeResourceLevel" AS ENUM ('beginner', 'intermediate', 'advanced');

-- CreateEnum
CREATE TYPE "ResourceInteractionStatus" AS ENUM ('VIEWED', 'OPENED', 'SAVED', 'DISMISSED');

-- AlterTable
ALTER TABLE "KnowledgeResource"
ADD COLUMN "estimatedMinutes" INTEGER,
ADD COLUMN "isMainTrack" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isOutdated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lastCheckedAt" TIMESTAMP(3),
ADD COLUMN "level" "KnowledgeResourceLevel" NOT NULL DEFAULT 'beginner',
ADD COLUMN "publishedAt" TIMESTAMP(3),
ADD COLUMN "sourceName" TEXT;

-- CreateTable
CREATE TABLE "UserResourceInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "status" "ResourceInteractionStatus" NOT NULL DEFAULT 'VIEWED',
    "viewedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "savedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserResourceInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserResourceInteraction_userId_resourceId_key" ON "UserResourceInteraction"("userId", "resourceId");

-- CreateIndex
CREATE INDEX "UserResourceInteraction_userId_idx" ON "UserResourceInteraction"("userId");

-- CreateIndex
CREATE INDEX "UserResourceInteraction_resourceId_idx" ON "UserResourceInteraction"("resourceId");

-- CreateIndex
CREATE INDEX "UserResourceInteraction_status_idx" ON "UserResourceInteraction"("status");

-- CreateIndex
CREATE INDEX "KnowledgeResource_isActive_isMainTrack_isOutdated_idx" ON "KnowledgeResource"("isActive", "isMainTrack", "isOutdated");

-- CreateIndex
CREATE INDEX "KnowledgeResource_level_idx" ON "KnowledgeResource"("level");

-- AddForeignKey
ALTER TABLE "UserResourceInteraction" ADD CONSTRAINT "UserResourceInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserResourceInteraction" ADD CONSTRAINT "UserResourceInteraction_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "KnowledgeResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
