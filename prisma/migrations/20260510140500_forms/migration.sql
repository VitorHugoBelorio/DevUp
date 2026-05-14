-- CreateTable
CREATE TABLE "DiagnosticForm" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosticForm_pkey" PRIMARY KEY ("id")
);

-- Seed the default form before existing questions receive the foreign key.
INSERT INTO "DiagnosticForm" (
    "id",
    "slug",
    "name",
    "description",
    "isActive",
    "isArchived",
    "createdAt",
    "updatedAt"
) VALUES (
    'default-diagnostic-form',
    'devup-diagnostic',
    'Diagnostico DevUp',
    'Formulario principal para diagnostico, direcionamento e plano de estudos.',
    true,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT ("id") DO NOTHING;

-- DropIndex
DROP INDEX IF EXISTS "DiagnosticQuestion_key_key";

-- AlterTable
ALTER TABLE "Diagnostic"
ADD COLUMN "formId" TEXT,
ADD COLUMN "formSnapshot" JSONB;

UPDATE "Diagnostic"
SET "formId" = 'default-diagnostic-form'
WHERE "formId" IS NULL;

-- AlterTable
ALTER TABLE "DiagnosticQuestion"
ADD COLUMN "formId" TEXT NOT NULL DEFAULT 'default-diagnostic-form';

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticForm_slug_key" ON "DiagnosticForm"("slug");

-- CreateIndex
CREATE INDEX "DiagnosticForm_isActive_isArchived_idx" ON "DiagnosticForm"("isActive", "isArchived");

-- CreateIndex
CREATE INDEX "Diagnostic_formId_idx" ON "Diagnostic"("formId");

-- CreateIndex
CREATE INDEX "DiagnosticQuestion_formId_order_idx" ON "DiagnosticQuestion"("formId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticQuestion_formId_key_key" ON "DiagnosticQuestion"("formId", "key");

-- AddForeignKey
ALTER TABLE "Diagnostic"
ADD CONSTRAINT "Diagnostic_formId_fkey"
FOREIGN KEY ("formId") REFERENCES "DiagnosticForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticQuestion"
ADD CONSTRAINT "DiagnosticQuestion_formId_fkey"
FOREIGN KEY ("formId") REFERENCES "DiagnosticForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
