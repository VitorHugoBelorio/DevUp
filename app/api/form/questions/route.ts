import { NextResponse } from "next/server";
import { getActiveDiagnosticForm } from "@/lib/services/questionService";

export const runtime = "nodejs";

export async function GET() {
  const form = await getActiveDiagnosticForm();
  return NextResponse.json({
    form: {
      id: form.id,
      slug: form.slug,
      name: form.name,
      description: form.description,
      isActive: form.isActive
    },
    questions: form.questions
  });
}
