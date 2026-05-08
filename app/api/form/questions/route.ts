import { NextResponse } from "next/server";
import { getActiveQuestions } from "@/lib/services/questionService";

export const runtime = "nodejs";

export async function GET() {
  const questions = await getActiveQuestions();
  return NextResponse.json({ questions });
}
