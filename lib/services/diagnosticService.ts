import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateDiagnosticPlan } from "@/lib/ai/generateDiagnosticPlan";
import { diagnosticResultSchema, parseDiagnosticInput } from "@/lib/services/diagnosticSchemas";
import { getActiveQuestions } from "@/lib/services/questionService";
import type { DiagnosticInput, DiagnosticResult, StoredDiagnostic } from "@/types/diagnostic";

function toStoredDiagnostic(record: {
  id: string;
  input: unknown;
  questionSnapshot: unknown;
  aiResult: unknown;
  aiModel: string;
  createdAt: Date;
}): StoredDiagnostic {
  return {
    id: record.id,
    input: record.input as DiagnosticInput,
    questions: record.questionSnapshot as StoredDiagnostic["questions"],
    result: diagnosticResultSchema.parse(record.aiResult),
    aiModel: record.aiModel,
    createdAt: record.createdAt.toISOString()
  };
}

export async function createDiagnostic(payload: unknown, userId?: string): Promise<StoredDiagnostic> {
  const questions = await getActiveQuestions();
  const input = parseDiagnosticInput(payload, questions);
  const generated = await generateDiagnosticPlan(input);

  const record = await prisma.diagnostic.create({
    data: {
      userId,
      input,
      questionSnapshot: questions,
      aiResult: generated.result,
      aiModel: generated.model
    }
  });

  return toStoredDiagnostic(record);
}

export async function getDiagnostic(id: string): Promise<StoredDiagnostic | null> {
  const record = await prisma.diagnostic.findUnique({
    where: { id }
  });

  return record ? toStoredDiagnostic(record) : null;
}

export async function requireDiagnostic(id: string): Promise<StoredDiagnostic> {
  const diagnostic = await getDiagnostic(id);

  if (!diagnostic) {
    notFound();
  }

  return diagnostic;
}

export function createApiResponsePayload(diagnostic: StoredDiagnostic): {
  id: string;
  input: DiagnosticInput;
  result: DiagnosticResult;
} {
  return {
    id: diagnostic.id,
    input: diagnostic.input,
    result: diagnostic.result
  };
}
