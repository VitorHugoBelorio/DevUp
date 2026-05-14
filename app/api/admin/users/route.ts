import { NextResponse } from "next/server";
import { hasAdminRequestAccess } from "@/lib/services/adminAuth";
import { getAccessDashboardReport } from "@/lib/services/accessControlService";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json(
    {
      error: "UNAUTHORIZED",
      message: "Acesso root necessario."
    },
    { status: 401 }
  );
}

export async function GET(request: Request) {
  if (!(await hasAdminRequestAccess(request))) {
    return unauthorized();
  }

  const report = await getAccessDashboardReport();
  return NextResponse.json({ report });
}
