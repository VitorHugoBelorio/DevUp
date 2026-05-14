import { NextResponse } from "next/server";
import { EmailDeliveryError } from "@/lib/services/emailService";
import { registerWithMagicLink } from "@/lib/services/userAuth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { name?: string; email?: string };

    if (!payload.name || !payload.email) {
      return NextResponse.json(
        {
          error: "INVALID_REGISTER_INPUT",
          message: "Informe nome e e-mail para criar sua conta."
        },
        { status: 400 }
      );
    }

    const result = await registerWithMagicLink({
      name: payload.name,
      email: payload.email,
      origin: request.headers.get("origin") ?? undefined
    });

    if (!result.ok && result.reason === "USER_ALREADY_EXISTS") {
      return NextResponse.json(
        {
          error: "USER_ALREADY_EXISTS",
          message: "Esse e-mail ja tem uma conta verificada. Use entrar para receber o magic link."
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Conta criada. Enviamos um magic link para verificar seu e-mail.",
      devMagicLink: result.devMagicLink
    });
  } catch (error) {
    console.error("[DevUp] Register request failed", error);

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
        error: "REGISTER_FAILED",
        message: "Nao foi possivel criar sua conta agora."
      },
      { status: 500 }
    );
  }
}
