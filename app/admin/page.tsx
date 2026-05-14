import { cookies } from "next/headers";
import Link from "next/link";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { AdminRootWorkspace } from "@/components/admin/AdminRootWorkspace";
import { hasAdminAccessFromCookies } from "@/lib/services/adminAuth";
import { getAccessDashboardReport } from "@/lib/services/accessControlService";
import { getAllKnowledgeFlags, getAllKnowledgeResources } from "@/lib/services/knowledgeService";
import { getAllFormsWithQuestions } from "@/lib/services/questionService";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isAdmin = await hasAdminAccessFromCookies(cookieStore);
  const forms = isAdmin ? await getAllFormsWithQuestions() : [];
  const resources = isAdmin ? await getAllKnowledgeResources() : [];
  const flags = isAdmin ? await getAllKnowledgeFlags() : [];
  const accessReport = isAdmin
    ? await getAccessDashboardReport()
    : {
        summary: {
          totalUsers: 0,
          admins: 0,
          blockedUsers: 0,
          verifiedUsers: 0,
          activeSessions: 0,
          loginsLast7Days: 0
        },
        users: [],
        recentEvents: []
      };

  return (
    <main className="relative min-h-screen overflow-hidden text-slate-100">
      {isAdmin ? (
        <AdminRootWorkspace
          initialAccessReport={accessReport}
          initialFlags={flags}
          initialForms={forms}
          initialResources={resources}
        />
      ) : (
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10">
          <nav className="flex items-center justify-between py-3 text-sm lowercase tracking-[0.18em] text-slate-500">
            <Link href="/" className="devup-brand">
              Dev<span>Up</span>
            </Link>
            <span>admin</span>
          </nav>

          <header className="py-8">
            <p className="text-xs font-normal uppercase tracking-[0.18em] text-slate-500">acesso root</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight tracking-[0.01em] text-white sm:text-5xl">
              Controle do diagnostico
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
              Configure formularios, perguntas e fontes seguras de estudo sem alterar o codigo do fluxo publico.
            </p>
          </header>

          <AdminLoginForm />
        </div>
      )}
    </main>
  );
}
