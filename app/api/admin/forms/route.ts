import { NextResponse } from "next/server";
import { hasAdminRequestAccess } from "@/lib/services/adminAuth";
import { createForm, getAllFormsWithQuestions } from "@/lib/services/questionService";

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

  const forms = await getAllFormsWithQuestions();
  return NextResponse.json({ forms });
}

export async function POST(request: Request) {
  if (!(await hasAdminRequestAccess(request))) {
    return unauthorized();
  }

  try {
    const form = await createForm(await request.json());
    return NextResponse.json({ form }, { status: 201 });
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
