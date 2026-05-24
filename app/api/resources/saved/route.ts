import { NextResponse } from "next/server";
import { getSavedResources } from "@/lib/services/recommendedResourcesService";
import { getCurrentUserFromRequest } from "@/lib/services/userAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: "Sessao necessaria." }, { status: 401 });
  }

  const items = await getSavedResources(user.id);
  return NextResponse.json({ items });
}
