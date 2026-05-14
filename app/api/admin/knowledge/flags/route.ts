import { NextResponse } from "next/server";
import { hasAdminRequestAccess } from "@/lib/services/adminAuth";
import { createKnowledgeFlag, getAllKnowledgeFlags } from "@/lib/services/knowledgeService";

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

  const flags = await getAllKnowledgeFlags();
  return NextResponse.json({ flags });
}

export async function POST(request: Request) {
  if (!(await hasAdminRequestAccess(request))) {
    return unauthorized();
  }

  try {
    const flag = await createKnowledgeFlag(await request.json());
    return NextResponse.json({ flag }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "INVALID_FLAG",
        message: error instanceof Error ? error.message : "Flag invalida."
      },
      { status: 400 }
    );
  }
}
