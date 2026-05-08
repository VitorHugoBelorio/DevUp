import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DiagnosticForm } from "@/components/DiagnosticForm";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getCurrentUserFromCookies } from "@/lib/services/userAuth";
import { getActiveQuestions } from "@/lib/services/questionService";

export const dynamic = "force-dynamic";

export default async function DiagnosticPage() {
  const cookieStore = await cookies();
  const user = await getCurrentUserFromCookies(cookieStore);

  if (!user) {
    redirect("/login?next=/diagnostico");
  }

  const questions = await getActiveQuestions();
  const steps = Array.from(new Set(questions.filter((question) => question.isActive).map((question) => question.step)));

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col">
        <nav className="flex items-center justify-between py-3 text-sm lowercase tracking-[0.18em] text-slate-500">
          <span className="devup-brand">
            Dev<span>Up</span>
          </span>
          <div className="flex items-center gap-4 tracking-normal">
            <span className="hidden text-slate-500 sm:inline">{user.name ?? user.email}</span>
            <LogoutButton />
          </div>
        </nav>

        <header className="max-w-4xl py-8 sm:py-10">
          <p className="text-xs font-normal uppercase tracking-[0.18em] text-slate-500">diagnostico guiado</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-[0.01em] text-white sm:text-6xl">
            Clareza para decidir o que estudar agora.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">
            O DevUp organiza suas respostas, identifica seu momento e transforma o diagnostico em um plano de estudo acionavel.
          </p>
        </header>

        <section className="grid flex-1 items-start gap-8 pb-10 lg:grid-cols-[0.85fr_1.25fr]">
          <aside className="space-y-6 pt-2">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-skyGlow">fluxo simples</p>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                Perguntas configuraveis, resposta estruturada da IA e um resultado pronto para exportar.
              </p>
            </div>

            <div className="grid gap-3 text-sm text-slate-300">
              {[...steps, "Plano personalizado"].map((item, index) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-950 text-xs font-semibold text-skyGlow ring-1 ring-blue-800/50">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </aside>

          <DiagnosticForm questions={questions} />
        </section>
      </div>
    </main>
  );
}
