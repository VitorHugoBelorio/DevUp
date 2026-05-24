import { NextResponse } from "next/server";
import { getRecommendedResources } from "@/lib/services/recommendedResourcesService";
import { getCurrentUserFromRequest } from "@/lib/services/userAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    return NextResponse.json(
      {
        error: "UNAUTHORIZED",
        message: "Sessao necessaria para carregar recomendacoes."
      },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 6);
  const diagnosticId = url.searchParams.get("diagnosticId") ?? undefined;
  const result = await getRecommendedResources({
    userId: user.id,
    diagnosticId,
    limit
  });

  return NextResponse.json(result);
}
