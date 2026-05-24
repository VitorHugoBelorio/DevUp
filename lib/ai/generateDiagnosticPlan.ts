import OpenAI from "openai";
import { diagnosticResultJsonSchema } from "@/lib/ai/resultSchema";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/ai/prompt";
import { generateWithVertex } from "@/lib/ai/vertexClient";
import { AiConfigurationError, AiResponseError } from "@/lib/ai/errors";
import { diagnosticResultSchema } from "@/lib/services/diagnosticSchemas";
import type { CuratedKnowledgeResource, DiagnosticInput, DiagnosticResult } from "@/types/diagnostic";

export type GeneratedDiagnostic = {
  result: DiagnosticResult;
  model: string;
};

type AiProvider = "openai" | "vertex";

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
  const provider = getAiProvider();
  const generated = provider === "vertex" ? await generateVertexOutput(input) : await generateOpenAiOutput(input);

  try {
    const result = diagnosticResultSchema.parse(JSON.parse(generated.outputText));

    return {
      result: enforceCuratedRecommendationLinks(result, input.knowledge_resources),
      model: generated.model
    };
  } catch (error) {
    throw new AiResponseError(error instanceof Error ? error.message : "Invalid AI JSON response.");
  }
}

function getAiProvider(): AiProvider {
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (provider === "vertex" || provider === "openai") {
    return provider;
  }

  return process.env.VERTEX_AI_PROJECT_ID ? "vertex" : "openai";
}

async function generateOpenAiOutput(input: DiagnosticInput): Promise<{ outputText: string; model: string }> {
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

  return {
    outputText,
    model
  };
}

async function generateVertexOutput(input: DiagnosticInput): Promise<{ outputText: string; model: string }> {
  return generateWithVertex(input);
}
