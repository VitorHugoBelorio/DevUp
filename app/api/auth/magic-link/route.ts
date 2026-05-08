import { NextResponse } from "next/server";
import { requestLoginMagicLink } from "@/lib/services/userAuth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = (await request.json()) as { email?: string };

  if (!payload.email) {
    return NextResponse.json(
      {
        error: "INVALID_EMAIL",
        message: "Informe um e-mail valido."
      },
      { status: 400 }
    );
  }

  const result = await requestLoginMagicLink(payload.email, request.headers.get("origin") ?? undefined);

  if (!result.ok && result.reason === "USER_NOT_FOUND") {
    return NextResponse.json(
      {
        error: "USER_NOT_FOUND",
        message: "Nao encontramos uma conta com esse e-mail. Crie sua conta para continuar."
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Enviamos um magic link para seu e-mail.",
    devMagicLink: result.devMagicLink
  });
}
