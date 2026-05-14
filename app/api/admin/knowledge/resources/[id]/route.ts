import { NextResponse } from "next/server";
import { hasAdminRequestAccess } from "@/lib/services/adminAuth";
import { deleteKnowledgeResource, updateKnowledgeResource } from "@/lib/services/knowledgeService";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function unauthorized() {
  return NextResponse.json(
    {
      error: "UNAUTHORIZED",
      message: "Acesso root necessario."
    },
    { status: 401 }
  );
}

export async function PUT(request: Request, context: RouteContext) {
  if (!(await hasAdminRequestAccess(request))) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    const resource = await updateKnowledgeResource(id, await request.json());
    return NextResponse.json({ resource });
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

export async function DELETE(request: Request, context: RouteContext) {
  if (!(await hasAdminRequestAccess(request))) {
    return unauthorized();
  }

  const { id } = await context.params;
  await deleteKnowledgeResource(id);

  return NextResponse.json({ ok: true });
}
