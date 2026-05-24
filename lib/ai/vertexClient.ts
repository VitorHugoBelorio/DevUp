import { getGoogleAccessToken } from "@/lib/ai/googleAuth";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/ai/prompt";
import { diagnosticResultJsonSchema } from "@/lib/ai/resultSchema";
import { AiConfigurationError, AiResponseError } from "@/lib/ai/errors";
import type { DiagnosticInput } from "@/types/diagnostic";

type VertexResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  error?: {
    message?: string;
  };
};

function stripUnsupportedSchemaFields(schema: unknown): unknown {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    return schema;
  }

  const record = schema as Record<string, unknown>;

  if (Array.isArray(record.anyOf)) {
    const nonNull = record.anyOf.find(
      (item) => typeof item === "object" && item !== null && (item as Record<string, unknown>).type !== "null"
    );
    const hasNull = record.anyOf.some(
      (item) => typeof item === "object" && item !== null && (item as Record<string, unknown>).type === "null"
    );

    if (hasNull && nonNull) {
      return {
        ...(stripUnsupportedSchemaFields(nonNull) as Record<string, unknown>),
        nullable: true
      };
    }
  }

  const next: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    if (key === "additionalProperties") {
      continue;
    }

    if (key === "properties" && value && typeof value === "object" && !Array.isArray(value)) {
      next.properties = Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([propertyKey, propertyValue]) => [
          propertyKey,
          stripUnsupportedSchemaFields(propertyValue)
        ])
      );
      continue;
    }

    next[key] = stripUnsupportedSchemaFields(value);
  }

  return next;
}

function getVertexEndpoint(): { url: string; model: string } {
  const projectId = process.env.VERTEX_AI_PROJECT_ID?.trim();
  const location = process.env.VERTEX_AI_LOCATION?.trim() || "us-central1";
  const model = process.env.VERTEX_AI_MODEL?.trim() || "gemini-2.5-flash";

  if (!projectId) {
    throw new AiConfigurationError("VERTEX_AI_PROJECT_ID is not configured.");
  }

  return {
    model,
    url: `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${encodeURIComponent(
      model
    )}:generateContent`
  };
}

export async function generateWithVertex(input: DiagnosticInput): Promise<{ outputText: string; model: string }> {
  const { url, model } = getVertexEndpoint();
  const accessToken = await getGoogleAccessToken();
  const prompt = [buildSystemPrompt(), buildUserPrompt(input)].join("\n\n");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify({
      contents: {
        role: "user",
        parts: {
          text: prompt
        }
      },
      generation_config: {
        maxOutputTokens: Number(process.env.VERTEX_AI_MAX_OUTPUT_TOKENS ?? 8192),
        temperature: Number(process.env.VERTEX_AI_TEMPERATURE ?? 0.4),
        responseMimeType: "application/json",
        responseSchema: stripUnsupportedSchemaFields(diagnosticResultJsonSchema)
      }
    })
  });
  const data = (await response.json().catch(() => null)) as VertexResponse | null;

  if (!response.ok) {
    throw new AiResponseError(data?.error?.message || `Vertex AI respondeu ${response.status}.`);
  }

  const outputText = data?.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;

  if (!outputText) {
    throw new AiResponseError("A resposta do Vertex AI nao incluiu texto.");
  }

  return {
    outputText,
    model: `vertex:${model}`
  };
}
