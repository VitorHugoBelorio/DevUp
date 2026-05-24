import { NextResponse } from "next/server";
import { recordResourceInteraction } from "@/lib/services/recommendedResourcesService";
import { getCurrentUserFromRequest } from "@/lib/services/userAuth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: "Sessao necessaria." }, { status: 401 });
  }

  const { id } = await context.params;
  const interaction = await recordResourceInteraction({
    userId: user.id,
    resourceId: id,
    status: "SAVED"
  });

  return NextResponse.json({ interaction });
}
