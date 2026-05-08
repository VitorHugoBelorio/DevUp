import { cookies } from "next/headers";
import Link from "next/link";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { AdminQuestionsManager } from "@/components/admin/AdminQuestionsManager";
import { hasAdminCookie } from "@/lib/services/adminAuth";
import { getAllQuestions } from "@/lib/services/questionService";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isAdmin = hasAdminCookie(cookieStore);
  const questions = isAdmin ? await getAllQuestions() : [];

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <nav className="flex items-center justify-between py-3 text-sm lowercase tracking-[0.18em] text-slate-500">
          <Link href="/" className="devup-brand">
            Dev<span>Up</span>
          </Link>
          <span>admin</span>
        </nav>

        <header className="py-8">
          <p className="text-xs font-normal uppercase tracking-[0.18em] text-slate-500">configuracao</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight tracking-[0.01em] text-white sm:text-5xl">
            Perguntas do diagnostico
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
            Adicione, edite, desative ou remova perguntas sem alterar o codigo do formulario publico.
          </p>
        </header>

        {isAdmin ? <AdminQuestionsManager initialQuestions={questions} /> : <AdminLoginForm />}
      </div>
    </main>
  );
}
