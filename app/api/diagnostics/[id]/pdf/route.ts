import { NextResponse } from "next/server";
import { getDiagnostic } from "@/lib/services/diagnosticService";
import { renderDiagnosticPdf } from "@/lib/services/pdfService";

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

  const pdf = await renderDiagnosticPdf(diagnostic);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="devup-plano-${diagnostic.id}.pdf"`,
      "Cache-Control": "no-store"
    }
  });
}
