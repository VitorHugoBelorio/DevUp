import { NextResponse } from "next/server";
import { hasAdminRequestAccess } from "@/lib/services/adminAuth";
import { createKnowledgeResource, getAllKnowledgeResources } from "@/lib/services/knowledgeService";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json(
    {
      error: "UNAUTHORIZED",
      message: "Acesso root necessario."
    },
    { status: 401 }
  );
}

export async function GET(request: Request) {
  if (!(await hasAdminRequestAccess(request))) {
    return unauthorized();
  }

  const resources = await getAllKnowledgeResources();
  return NextResponse.json({ resources });
}

export async function POST(request: Request) {
  if (!(await hasAdminRequestAccess(request))) {
    return unauthorized();
  }

  try {
    const resource = await createKnowledgeResource(await request.json());
    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "INVALID_RESOURCE",
        message: error instanceof Error ? error.message : "Fonte invalida."
      },
      { status: 400 }
    );
  }
}
