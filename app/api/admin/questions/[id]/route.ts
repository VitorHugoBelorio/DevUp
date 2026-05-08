import { NextResponse } from "next/server";
import { hasAdminRequestAccess } from "@/lib/services/adminAuth";
import { deleteQuestion, updateQuestion } from "@/lib/services/questionService";

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
      message: "Acesso de administrador necessario."
    },
    { status: 401 }
  );
}

export async function PUT(request: Request, context: RouteContext) {
  if (!hasAdminRequestAccess(request)) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    const question = await updateQuestion(id, await request.json());
    return NextResponse.json({ question });
  } catch (error) {
    return NextResponse.json(
      {
        error: "INVALID_QUESTION",
        message: error instanceof Error ? error.message : "Pergunta invalida."
      },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!hasAdminRequestAccess(request)) {
    return unauthorized();
  }

  const { id } = await context.params;
  await deleteQuestion(id);

  return NextResponse.json({ ok: true });
}
