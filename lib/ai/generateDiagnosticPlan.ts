import OpenAI from "openai";
import { diagnosticResultJsonSchema } from "@/lib/ai/resultSchema";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/ai/prompt";
import { diagnosticResultSchema } from "@/lib/services/diagnosticSchemas";
import type { CuratedKnowledgeResource, DiagnosticInput, DiagnosticResult } from "@/types/diagnostic";

export class AiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiConfigurationError";
  }
}

export class AiResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiResponseError";
  }
}

export type GeneratedDiagnostic = {
  result: DiagnosticResult;
  model: string;
};

function enforceCuratedRecommendationLinks(
  result: DiagnosticResult,
  resources: CuratedKnowledgeResource[]
): DiagnosticResult {
  const byId = new Map(resources.map((resource) => [resource.source_id, resource]));
  const byUrl = new Map(resources.map((resource) => [resource.url, resource]));

  return {
    ...result,
    recommendations: result.recommendations.map((recommendation) => {
      const source =
        (recommendation.source_id ? byId.get(recommendation.source_id) : null) ??
        (recommendation.url ? byUrl.get(recommendation.url) : null);

      if (!source) {
        return {
          ...recommendation,
          url: null,
          source_id: null
        };
      }

      return {
        ...recommendation,
        type: source.type,
        url: source.url,
        source_id: source.source_id
      };
    })
  };
}

export async function generateDiagnosticPlan(input: DiagnosticInput): Promise<GeneratedDiagnostic> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-5.4-mini";

  if (!apiKey) {
    throw new AiConfigurationError("OPENAI_API_KEY is not configured.");
  }

  const openai = new OpenAI({ apiKey });
  const response = await openai.responses.create({
    model,
    input: [
      {
        role: "system",
        content: buildSystemPrompt()
      },
      {
        role: "user",
        content: buildUserPrompt(input)
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "devup_diagnostic_result",
        strict: true,
        schema: diagnosticResultJsonSchema
      }
    }
  });

  const outputText = response.output_text;

  if (!outputText) {
    throw new AiResponseError("The AI response did not include output text.");
  }

  try {
    const result = diagnosticResultSchema.parse(JSON.parse(outputText));

    return {
      result: enforceCuratedRecommendationLinks(result, input.knowledge_resources),
      model
    };
  } catch (error) {
    throw new AiResponseError(error instanceof Error ? error.message : "Invalid AI JSON response.");
  }
}
