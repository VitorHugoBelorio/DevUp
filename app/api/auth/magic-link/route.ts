import { NextResponse } from "next/server";
import { EmailDeliveryError } from "@/lib/services/emailService";
import { requestLoginMagicLink } from "@/lib/services/userAuth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
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

    if (!result.ok && result.reason === "USER_BLOCKED") {
      return NextResponse.json(
        {
          error: "USER_BLOCKED",
          message: "Seu acesso esta bloqueado. Fale com o administrador do DevUp."
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Enviamos um magic link para seu e-mail.",
      devMagicLink: result.devMagicLink
    });
  } catch (error) {
    console.error("[DevUp] Magic link request failed", error);

    if (error instanceof EmailDeliveryError) {
      return NextResponse.json(
        {
          error: "EMAIL_DELIVERY_FAILED",
          message: error.message
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error: "MAGIC_LINK_FAILED",
        message: "Nao foi possivel enviar o magic link agora."
      },
      { status: 500 }
    );
  }
}
