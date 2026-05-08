import { NextResponse } from "next/server";
import { createApiResponsePayload, getDiagnostic } from "@/lib/services/diagnosticService";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const diagnostic = await getDiagnostic(id);

  if (!diagnostic) {
    return NextResponse.json(
      {
        error: "NOT_FOUND",
        message: "Diagnostico nao encontrado."
      },
      { status: 404 }
    );
  }

  return NextResponse.json(createApiResponsePayload(diagnostic));
}
