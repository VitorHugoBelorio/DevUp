import { NextResponse } from "next/server";
import { consumeMagicLink, userSessionCookieName } from "@/lib/services/userAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid_magic_link", url.origin));
  }

  try {
    const session = await consumeMagicLink(token);
    const response = NextResponse.redirect(new URL("/diagnostico", url.origin));

    response.cookies.set(userSessionCookieName, session.sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: session.sessionExpiresAt
    });

    return response;
  } catch {
    return NextResponse.redirect(new URL("/login?error=invalid_magic_link", url.origin));
  }
}
