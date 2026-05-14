import { NextResponse } from "next/server";
import { hasAdminRequestAccess } from "@/lib/services/adminAuth";
import { deleteForm, updateForm } from "@/lib/services/questionService";

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
    const form = await updateForm(id, await request.json());
    return NextResponse.json({ form });
  } catch (error) {
    return NextResponse.json(
      {
        error: "INVALID_FORM",
        message: error instanceof Error ? error.message : "Formulario invalido."
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

  try {
    await deleteForm(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: "FORM_DELETE_FAILED",
        message: error instanceof Error ? error.message : "Nao foi possivel remover o formulario."
      },
      { status: 400 }
    );
  }
}
