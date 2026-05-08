import { describe, expect, it } from "vitest";
import { diagnosticResultSchema, parseDiagnosticInput, parseQuestionOptions } from "../lib/services/diagnosticSchemas";
import { defaultQuestions } from "../lib/services/questionService";
import type { DiagnosticResult } from "../types/diagnostic";

const validResult: DiagnosticResult = {
  diagnosis: {
    level_estimation: "Voce esta em nivel iniciante com boa base para organizar estudos.",
    strengths: ["Ja conhece fundamentos web"],
    weaknesses: ["Precisa praticar projetos completos"]
  },
  direction: {
    focus_now: ["JavaScript aplicado", "Projetos pequenos"],
    avoid_now: ["Pular direto para muitas bibliotecas"],
    next_steps: ["Consolidar DOM", "Criar um projeto guiado"]
  },
  study_plan: [
    {
      day: 1,
      topics: ["JavaScript", "DOM"],
      description: "Revise eventos e manipule elementos em uma pagina simples."
    }
  ],
  recommendations: [
    {
      title: "MDN JavaScript Guide",
      type: "documentation",
      reason: "Boa referencia para fundamentos."
    }
  ],
  insights: {
    likely_mistakes: ["Estudar muitas coisas ao mesmo tempo"],
    blocking_points: ["Falta de projetos pequenos finalizados"]
  }
};

describe("diagnostic input schema", () => {
  it("normalizes answers using the active question configuration", () => {
    const parsed = parseDiagnosticInput(
      {
        answers: defaultQuestions.map((question) => ({
          question_id: question.id,
          key: question.key,
          value:
            question.type === "number" || question.type === "scale"
              ? "7"
              : question.type === "single_select"
                ? question.options[0]?.value
                : question.type === "multi_select"
                  ? [question.options[0]?.value].filter(Boolean)
                : "  React   e JavaScript  "
        }))
      },
      defaultQuestions
    );

    expect(parsed.answers).toHaveLength(defaultQuestions.length);
    expect(parsed.answers.find((answer) => answer.key === "clarity_score")?.value).toBe(7);
    expect(parsed.answers.find((answer) => answer.key === "technology_to_master")?.value).toBe("React e JavaScript");
  });

  it("rejects invalid select values", () => {
    expect(() =>
      parseDiagnosticInput(
        {
          answers: defaultQuestions.map((question) => ({
            question_id: question.id,
            key: question.key,
            value:
              question.key === "main_goal"
                ? "invalid_goal"
                : question.type === "number" || question.type === "scale"
                  ? 5
                  : question.type === "single_select"
                    ? question.options[0]?.value
                    : question.type === "multi_select"
                      ? [question.options[0]?.value].filter(Boolean)
                      : "ok"
          }))
        },
        defaultQuestions
      )
    ).toThrow();
  });

  it("rejects missing required questions", () => {
    expect(() =>
      parseDiagnosticInput(
        {
          answers: []
        },
        defaultQuestions
      )
    ).toThrow();
  });
});

describe("question options", () => {
  it("accepts label/value option objects", () => {
    expect(parseQuestionOptions([{ label: "Primeiro emprego", value: "first_job" }])).toEqual([
      { label: "Primeiro emprego", value: "first_job" }
    ]);
  });
});

describe("diagnostic result schema", () => {
  it("accepts the expected AI JSON shape", () => {
    expect(diagnosticResultSchema.parse(validResult)).toEqual(validResult);
  });

  it("rejects recommendations with invented types", () => {
    const result = diagnosticResultSchema.safeParse({
      ...validResult,
      recommendations: [
        {
          title: "Video qualquer",
          type: "video",
          reason: "Nao faz parte do contrato."
        }
      ]
    });

    expect(result.success).toBe(false);
  });
});
