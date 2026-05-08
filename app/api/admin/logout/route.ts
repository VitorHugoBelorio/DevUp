import { NextResponse } from "next/server";
import { adminCookieName } from "@/lib/services/adminAuth";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(adminCookieName);
  return response;
}
