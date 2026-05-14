import { NextResponse } from "next/server";
import { hasAdminRequestAccess } from "@/lib/services/adminAuth";
import { activateForm } from "@/lib/services/questionService";

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

export async function POST(request: Request, context: RouteContext) {
  if (!(await hasAdminRequestAccess(request))) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    const form = await activateForm(id);
    return NextResponse.json({ form });
  } catch (error) {
    return NextResponse.json(
      {
        error: "FORM_ACTIVATION_FAILED",
        message: error instanceof Error ? error.message : "Nao foi possivel ativar o formulario."
      },
      { status: 400 }
    );
  }
}
