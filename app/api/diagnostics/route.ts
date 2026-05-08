import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AiConfigurationError, AiResponseError } from "@/lib/ai/generateDiagnosticPlan";
import { createApiResponsePayload, createDiagnostic } from "@/lib/services/diagnosticService";
import { getCurrentUserFromRequest } from "@/lib/services/userAuth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        {
          error: "UNAUTHORIZED",
          message: "Entre com seu e-mail para gerar o diagnostico."
        },
        { status: 401 }
      );
    }

    const payload = await request.json();
    const diagnostic = await createDiagnostic(payload, user.id);

    return NextResponse.json(createApiResponsePayload(diagnostic), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message: "Revise os campos do formulario.",
          issues: error.issues
        },
        { status: 400 }
      );
    }

    if (error instanceof AiConfigurationError) {
      return NextResponse.json(
        {
          error: "AI_NOT_CONFIGURED",
          message: "A chave da OpenAI ainda nao foi configurada."
        },
        { status: 503 }
      );
    }

    if (error instanceof AiResponseError) {
      return NextResponse.json(
        {
          error: "AI_RESPONSE_INVALID",
          message: "A IA retornou um formato inesperado. Tente novamente."
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error: "UNEXPECTED_ERROR",
        message: "Nao foi possivel gerar o diagnostico agora."
      },
      { status: 500 }
    );
  }
}
