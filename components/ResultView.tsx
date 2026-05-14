import Link from "next/link";
import type { DiagnosticResult, StoredDiagnostic } from "@/types/diagnostic";

function Section({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-blue-950/70 py-8">
      <h2 className="text-2xl font-semibold tracking-[0.01em] text-white">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3 text-sm leading-6 text-slate-300">
      {items.map((item) => (
        <li key={item} className="rounded-2xl bg-slate-950/55 p-4 transition duration-300 hover:bg-hover">
          {item}
        </li>
      ))}
    </ul>
  );
}

function Direction({ direction }: { direction: DiagnosticResult["direction"] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div>
        <h3 className="mb-3 text-sm font-normal uppercase tracking-[0.14em] text-skyGlow">Foco agora</h3>
        <List items={direction.focus_now} />
      </div>
      <div>
        <h3 className="mb-3 text-sm font-normal uppercase tracking-[0.15em] text-skyGlow">Evitar agora</h3>
        <List items={direction.avoid_now} />
      </div>
      <div>
        <h3 className="mb-3 text-sm font-normal uppercase tracking-[0.15em] text-slate-300">Proximos passos</h3>
        <List items={direction.next_steps} />
      </div>
    </div>
  );
}

function FocusMap({ preferences }: { preferences: StoredDiagnostic["input"]["area_preferences"] }) {
  if (!preferences?.length) {
    return null;
  }

  return (
    <Section title="Mapa de foco">
      <div className="grid gap-4 md:grid-cols-3">
        {preferences.map((preference) => (
          <article key={preference.area} className="rounded-2xl bg-slate-950/55 p-5 transition duration-300 hover:bg-hover">
            <p className="text-xs font-normal uppercase tracking-[0.14em] text-skyGlow">
              {preference.priority === "primary"
                ? "trilha principal"
                : preference.priority === "secondary"
                  ? "trilha secundaria"
                  : "apoio"}
            </p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <h3 className="text-lg font-semibold text-white">{preference.label}</h3>
              <span className="text-2xl font-semibold text-white">{preference.percentage}%</span>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-900">
              <div
                className="h-full rounded-full bg-cyanGlow shadow-glow"
                style={{ width: `${preference.percentage}%` }}
              />
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

export function ResultView({ diagnostic }: { diagnostic: StoredDiagnostic }) {
  const result = diagnostic.result;
  const preferences = diagnostic.input.area_preferences ?? [];

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-col gap-6 py-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/" className="devup-brand">
              Dev<span>Up</span>
            </Link>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight tracking-[0.01em] text-white sm:text-5xl">
              Seu plano personalizado esta pronto.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
              Criado com base no seu momento atual, objetivo e tempo disponivel de estudo.
            </p>
          </div>
          <a
            href={`/api/diagnostics/${diagnostic.id}/pdf`}
            className="devup-button inline-flex min-h-11 shrink-0 items-center justify-center px-5 text-sm font-semibold"
          >
            Baixar Plano
          </a>
        </header>

        <section className="devup-panel p-4 sm:p-6">
          <FocusMap preferences={preferences} />

          <Section title="Diagnostico">
            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
              <div className="rounded-2xl bg-blue-950/40 p-5 ring-1 ring-blue-900/40">
                <h3 className="text-sm font-normal uppercase tracking-[0.14em] text-skyGlow">Nivel estimado</h3>
                <p className="mt-4 text-base leading-7 text-slate-100">{result.diagnosis.level_estimation}</p>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-normal uppercase tracking-[0.15em] text-skyGlow">Forcas</h3>
                <List items={result.diagnosis.strengths} />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-normal uppercase tracking-[0.15em] text-slate-300">
                  Pontos de melhoria
                </h3>
                <List items={result.diagnosis.weaknesses} />
              </div>
            </div>
          </Section>

          <Section title="Direcao">
            <Direction direction={result.direction} />
          </Section>

          <Section title="Plano de estudos">
            <ol className="grid gap-4">
              {result.study_plan.map((day) => (
                <li key={day.day} className="rounded-2xl bg-slate-950/55 p-4 transition duration-300 hover:bg-hover">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="text-lg font-semibold text-white">Dia {day.day}</h3>
                    <div className="flex flex-wrap gap-2">
                      {day.topics.map((topic) => (
                        <span
                          key={topic}
                          className="rounded-full bg-blue-950 px-2.5 py-1 text-xs font-medium text-skyGlow ring-1 ring-blue-900/40"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{day.description}</p>
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Recomendacoes">
            <div className="grid gap-4 md:grid-cols-2">
              {result.recommendations.map((recommendation) => (
                <article key={recommendation.title} className="rounded-2xl bg-slate-950/55 p-5 transition duration-300 hover:bg-hover">
                  <p className="text-xs font-normal uppercase tracking-[0.14em] text-skyGlow">
                    {recommendation.type}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-white">{recommendation.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{recommendation.reason}</p>
                  {recommendation.url && (
                    <a
                      href={recommendation.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex min-h-10 items-center rounded-full bg-blue-950 px-4 text-xs font-semibold text-skyGlow ring-1 ring-blue-800/40 transition hover:bg-blue-900"
                    >
                      Abrir fonte curada
                    </a>
                  )}
                </article>
              ))}
            </div>
          </Section>

          <Section title="Insights">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-normal uppercase tracking-[0.14em] text-skyGlow">
                  Erros provaveis
                </h3>
                <List items={result.insights.likely_mistakes} />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-normal uppercase tracking-[0.15em] text-skyGlow">Bloqueios</h3>
                <List items={result.insights.blocking_points} />
              </div>
            </div>
          </Section>
        </section>
      </div>
    </main>
  );
}
