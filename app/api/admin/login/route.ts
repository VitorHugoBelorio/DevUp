import { NextResponse } from "next/server";
import { adminCookieName, createAdminSessionToken, isAdminKeyValid } from "@/lib/services/adminAuth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = (await request.json()) as { accessKey?: string };

  if (!payload.accessKey || !isAdminKeyValid(payload.accessKey)) {
    return NextResponse.json(
      {
        error: "INVALID_ADMIN_KEY",
        message: "Chave de administrador invalida."
      },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName, createAdminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });

  return response;
}
