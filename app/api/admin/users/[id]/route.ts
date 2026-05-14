import { NextResponse } from "next/server";
import { hasAdminRequestAccess } from "@/lib/services/adminAuth";
import { updateUserAccess } from "@/lib/services/accessControlService";

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

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await hasAdminRequestAccess(request))) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    const user = await updateUserAccess(id, await request.json(), request);
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      {
        error: "USER_UPDATE_FAILED",
        message: error instanceof Error ? error.message : "Nao foi possivel atualizar o usuario."
      },
      { status: 400 }
    );
  }
}
