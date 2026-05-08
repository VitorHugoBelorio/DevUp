import { NextResponse } from "next/server";
import { hasAdminRequestAccess } from "@/lib/services/adminAuth";
import { createQuestion, getAllQuestions } from "@/lib/services/questionService";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json(
    {
      error: "UNAUTHORIZED",
      message: "Acesso de administrador necessario."
    },
    { status: 401 }
  );
}

export async function GET(request: Request) {
  if (!hasAdminRequestAccess(request)) {
    return unauthorized();
  }

  const questions = await getAllQuestions();
  return NextResponse.json({ questions });
}

export async function POST(request: Request) {
  if (!hasAdminRequestAccess(request)) {
    return unauthorized();
  }

  try {
    const question = await createQuestion(await request.json());
    return NextResponse.json({ question }, { status: 201 });
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
