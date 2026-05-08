import { z } from "zod";
import { questionTypes, recommendationTypes } from "@/types/diagnostic";
import type {
  DiagnosticAnswer,
  DiagnosticAnswerInput,
  DiagnosticAnswerValue,
  DiagnosticInput,
  DiagnosticQuestion,
  QuestionOption
} from "@/types/diagnostic";
import { normalizeText } from "@/lib/utils/text";

export const questionOptionSchema = z.object({
  label: z.string().min(1).max(80).transform(normalizeText),
  value: z.string().min(1).max(80).transform(normalizeText)
});

export const diagnosticQuestionSchema = z.object({
  id: z.string().min(1),
  key: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z][a-z0-9_]*$/),
  label: z.string().min(2).max(160).transform(normalizeText),
  description: z.string().max(240).nullable(),
  placeholder: z.string().max(160).nullable(),
  type: z.enum(questionTypes),
  required: z.boolean(),
  options: z.array(questionOptionSchema).default([]),
  step: z.string().min(2).max(80).transform(normalizeText),
  order: z.number().int().min(0).max(999),
  aiHint: z.string().max(240).nullable(),
  isActive: z.boolean()
});

const answerValueSchema = z.union([
  z.string(),
  z.coerce.number(),
  z.array(z.string())
]) satisfies z.ZodType<DiagnosticAnswerValue>;

export const diagnosticAnswerInputSchema = z.object({
  question_id: z.string().min(1),
  key: z.string().min(2).max(80),
  value: answerValueSchema
}) satisfies z.ZodType<DiagnosticAnswerInput>;

export const diagnosticInputPayloadSchema = z.object({
  answers: z.array(diagnosticAnswerInputSchema).min(1)
});

export const diagnosticResultSchema = z.object({
  diagnosis: z.object({
    level_estimation: z.string().min(1),
    strengths: z.array(z.string().min(1)).min(1),
    weaknesses: z.array(z.string().min(1)).min(1)
  }),
  direction: z.object({
    focus_now: z.array(z.string().min(1)).min(1),
    avoid_now: z.array(z.string().min(1)).min(1),
    next_steps: z.array(z.string().min(1)).min(1)
  }),
  study_plan: z
    .array(
      z.object({
        day: z.number().int().min(1),
        topics: z.array(z.string().min(1)).min(1),
        description: z.string().min(1)
      })
    )
    .min(1),
  recommendations: z
    .array(
      z.object({
        title: z.string().min(1),
        type: z.enum(recommendationTypes),
        reason: z.string().min(1)
      })
    )
    .min(1),
  insights: z.object({
    likely_mistakes: z.array(z.string().min(1)).min(1),
    blocking_points: z.array(z.string().min(1)).min(1)
  })
});

function normalizeAnswerValue(value: DiagnosticAnswerValue): DiagnosticAnswerValue {
  if (Array.isArray(value)) {
    return value.map(normalizeText).filter(Boolean);
  }

  if (typeof value === "number") {
    return Math.round(value * 100) / 100;
  }

  return normalizeText(value);
}

function hasAnswer(value: DiagnosticAnswerValue): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  return value.length > 0;
}

function ensureOptionValue(question: DiagnosticQuestion, value: string): string {
  const match = question.options.find((option) => option.value === value);

  if (!match) {
    throw new z.ZodError([
      {
        code: "custom",
        path: [question.key],
        message: `Opcao invalida para ${question.label}.`
      }
    ]);
  }

  return match.value;
}

function validateAnswer(question: DiagnosticQuestion, rawValue: DiagnosticAnswerValue): DiagnosticAnswerValue {
  const value = normalizeAnswerValue(rawValue);

  if (question.required && !hasAnswer(value)) {
    throw new z.ZodError([
      {
        code: "custom",
        path: [question.key],
        message: `${question.label} e obrigatorio.`
      }
    ]);
  }

  if (!hasAnswer(value)) {
    return value;
  }

  if (question.type === "number" || question.type === "scale") {
    const numeric = typeof value === "number" ? value : Number(value);

    if (!Number.isFinite(numeric)) {
      throw new z.ZodError([
        {
          code: "custom",
          path: [question.key],
          message: `${question.label} precisa ser um numero.`
        }
      ]);
    }

    if (question.type === "scale" && (numeric < 1 || numeric > 10)) {
      throw new z.ZodError([
        {
          code: "custom",
          path: [question.key],
          message: `${question.label} precisa estar entre 1 e 10.`
        }
      ]);
    }

    return numeric;
  }

  if (question.type === "multi_select") {
    const values = Array.isArray(value) ? value : [String(value)];
    return values.map((item) => ensureOptionValue(question, item));
  }

  if (question.type === "single_select") {
    return ensureOptionValue(question, Array.isArray(value) ? String(value[0] ?? "") : String(value));
  }

  return Array.isArray(value) ? value.join(", ") : String(value);
}

export function parseQuestionOptions(options: unknown): QuestionOption[] {
  const parsed = z.array(questionOptionSchema).safeParse(options ?? []);
  return parsed.success ? parsed.data : [];
}

export function parseDiagnosticInput(payload: unknown, questions: DiagnosticQuestion[]): DiagnosticInput {
  const parsed = diagnosticInputPayloadSchema.parse(payload);
  const activeById = new Map(questions.filter((question) => question.isActive).map((question) => [question.id, question]));
  const answersByQuestion = new Map(parsed.answers.map((answer) => [answer.question_id, answer]));

  const answers: DiagnosticAnswer[] = questions
    .filter((question) => question.isActive)
    .sort((left, right) => left.order - right.order)
    .map((question) => {
      const answer = answersByQuestion.get(question.id);

      if (!answer || answer.key !== question.key || !activeById.has(answer.question_id)) {
        if (question.required) {
          throw new z.ZodError([
            {
              code: "custom",
              path: [question.key],
              message: `${question.label} e obrigatorio.`
            }
          ]);
        }

        return null;
      }

      const value = validateAnswer(question, answer.value);

      if (!hasAnswer(value)) {
        return null;
      }

      return {
        question_id: question.id,
        key: question.key,
        label: question.label,
        type: question.type,
        value,
        aiHint: question.aiHint
      };
    })
    .filter((answer): answer is DiagnosticAnswer => Boolean(answer));

  return { answers };
}
