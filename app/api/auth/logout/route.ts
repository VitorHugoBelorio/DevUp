import { NextResponse } from "next/server";
import { revokeSession, userSessionCookieName } from "@/lib/services/userAuth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${userSessionCookieName}=`))
    ?.split("=")[1];

  await revokeSession(token ? decodeURIComponent(token) : undefined);

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(userSessionCookieName);

  return response;
}
