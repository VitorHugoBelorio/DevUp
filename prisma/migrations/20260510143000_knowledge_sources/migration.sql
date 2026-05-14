-- CreateEnum
CREATE TYPE "KnowledgeResourceType" AS ENUM (
    'platform',
    'article',
    'blog',
    'documentation',
    'course',
    'video',
    'community',
    'tool',
    'other'
);

-- CreateTable
CREATE TABLE "KnowledgeFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeResource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "KnowledgeResourceType" NOT NULL,
    "description" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeResourceFlag" (
    "resourceId" TEXT NOT NULL,
    "flagId" TEXT NOT NULL,

    CONSTRAINT "KnowledgeResourceFlag_pkey" PRIMARY KEY ("resourceId","flagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeFlag_key_key" ON "KnowledgeFlag"("key");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeResource_url_key" ON "KnowledgeResource"("url");

-- CreateIndex
CREATE INDEX "KnowledgeResource_isActive_priority_idx" ON "KnowledgeResource"("isActive", "priority");

-- CreateIndex
CREATE INDEX "KnowledgeResource_subject_idx" ON "KnowledgeResource"("subject");

-- CreateIndex
CREATE INDEX "KnowledgeResourceFlag_flagId_idx" ON "KnowledgeResourceFlag"("flagId");

-- AddForeignKey
ALTER TABLE "KnowledgeResourceFlag"
ADD CONSTRAINT "KnowledgeResourceFlag_resourceId_fkey"
FOREIGN KEY ("resourceId") REFERENCES "KnowledgeResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeResourceFlag"
ADD CONSTRAINT "KnowledgeResourceFlag_flagId_fkey"
FOREIGN KEY ("flagId") REFERENCES "KnowledgeFlag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
