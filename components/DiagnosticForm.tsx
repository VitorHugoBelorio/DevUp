"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { careerAreaOptions } from "@/types/diagnostic";
import type { CareerAreaSlug, DiagnosticAnswerValue, DiagnosticQuestion } from "@/types/diagnostic";

type FormState = Record<string, DiagnosticAnswerValue>;
type AreaPreferenceState = Record<CareerAreaSlug, number>;
type FormStep = {
  step: string;
  questions: DiagnosticQuestion[];
  isFocusStep?: boolean;
};

const processingMessages = [
  "Analisando seu momento atual...",
  "Identificando lacunas tecnicas...",
  "Priorizando o que mais impacta sua evolucao...",
  "Montando uma trilha realista para sua rotina..."
];

function fieldClassName(): string {
  return "devup-input text-sm";
}

function Label({
  children,
  htmlFor
}: {
  children: React.ReactNode;
  htmlFor: string;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-slate-200">
      {children}
    </label>
  );
}

function initialValue(question: DiagnosticQuestion): DiagnosticAnswerValue {
  if (question.type === "scale") {
    return 5;
  }

  if (question.type === "number") {
    return "";
  }

  if (question.type === "multi_select") {
    return [];
  }

  return "";
}

function hasValue(value: DiagnosticAnswerValue): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  return value.trim().length > 0;
}

function groupQuestions(questions: DiagnosticQuestion[]): Array<{ step: string; questions: DiagnosticQuestion[] }> {
  const groups = new Map<string, DiagnosticQuestion[]>();

  for (const question of questions) {
    groups.set(question.step, [...(groups.get(question.step) ?? []), question]);
  }

  return Array.from(groups.entries()).map(([step, stepQuestions]) => ({
    step,
    questions: stepQuestions
  }));
}

function createInitialAreaPreferences(): AreaPreferenceState {
  return Object.fromEntries(careerAreaOptions.map((area) => [area.value, 0])) as AreaPreferenceState;
}

function getAreaPreferenceTotal(preferences: AreaPreferenceState): number {
  return Object.values(preferences).reduce((total, value) => total + value, 0);
}

function getRankedAreaPreferences(preferences: AreaPreferenceState) {
  return careerAreaOptions
    .map((area) => ({
      ...area,
      percentage: preferences[area.value] ?? 0
    }))
    .filter((area) => area.percentage > 0)
    .sort((left, right) => right.percentage - left.percentage);
}

function buildAreaPreferencePayload(preferences: AreaPreferenceState) {
  return getRankedAreaPreferences(preferences).map((area) => ({
    area: area.value,
    percentage: area.percentage
  }));
}

function FocusPreferencePanel({
  preferences,
  onChange,
  onClear
}: {
  preferences: AreaPreferenceState;
  onChange(area: CareerAreaSlug, value: number): void;
  onClear(): void;
}) {
  const total = getAreaPreferenceTotal(preferences);
  const ranked = getRankedAreaPreferences(preferences);
  const primary = ranked[0];
  const secondary = ranked[1];

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-blue-950/25 p-5 ring-1 ring-blue-900/45">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-normal uppercase tracking-[0.15em] text-skyGlow">mapa de foco</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[0.01em] text-white">
              Distribua seu interesse entre as areas.
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Use ate 100 pontos para mostrar o peso de cada vertente na sua trilha. O DevUp vai usar isso para
              definir uma direcao principal, uma direcao secundaria e temas de apoio sem forcar uma escolha unica.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950/65 px-4 py-3 text-right ring-1 ring-blue-900/40">
            <p className="text-xs text-slate-500">distribuido</p>
            <p className="text-2xl font-semibold text-white">{total}%</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-950/45 p-4">
            <p className="text-xs font-normal uppercase tracking-[0.14em] text-slate-500">trilha principal</p>
            <p className="mt-2 text-sm font-semibold text-white">
              {primary ? `${primary.label} (${primary.percentage}%)` : "Aguardando seu foco"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950/45 p-4">
            <p className="text-xs font-normal uppercase tracking-[0.14em] text-slate-500">trilha secundaria</p>
            <p className="mt-2 text-sm font-semibold text-white">
              {secondary ? `${secondary.label} (${secondary.percentage}%)` : "Opcional, mas recomendado"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {careerAreaOptions.map((area) => {
          const value = preferences[area.value] ?? 0;
          const remaining = 100 - total;
          const max = Math.max(value, Math.min(100, value + remaining));

          return (
            <div key={area.value} className="rounded-2xl bg-slate-950/55 p-4 transition duration-300 hover:bg-hover">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">{area.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{area.description}</p>
                </div>
                <span className="shrink-0 rounded-full bg-blue-950 px-3 py-1 text-xs font-semibold text-skyGlow ring-1 ring-blue-800/40">
                  {value}%
                </span>
              </div>
              <input
                aria-label={`Peso para ${area.label}`}
                type="range"
                min={0}
                max={max}
                step={10}
                value={value}
                onChange={(event) => onChange(area.value, Number(event.target.value))}
                className="mt-4 w-full accent-blue-600"
              />
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-slate-950/45 p-4 text-sm leading-6 text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Exemplo: 70% Backend e 30% DevOps gera uma trilha principal de backend com fundamentos de deploy,
          infraestrutura e entrega como apoio.
        </p>
        <button
          type="button"
          onClick={onClear}
          className="min-h-10 shrink-0 rounded-full bg-slate-900 px-4 text-xs font-semibold text-slate-300 transition duration-300 hover:bg-blue-950/70"
        >
          Limpar mapa
        </button>
      </div>
    </div>
  );
}

function QuestionField({
  question,
  value,
  onChange
}: {
  question: DiagnosticQuestion;
  value: DiagnosticAnswerValue;
  onChange(value: DiagnosticAnswerValue): void;
}) {
  const id = `question-${question.id}`;
  const optionGridClass =
    question.options.length > 8 ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3" : "grid gap-3 sm:grid-cols-2";

  if (question.type === "scale") {
    const numericValue = Number(value || 5);

    return (
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Label htmlFor={id}>{question.label}</Label>
            {question.description && <p className="mb-3 text-xs leading-5 text-slate-400">{question.description}</p>}
          </div>
          <span className="rounded-full bg-blue-950 px-3 py-1 text-sm font-semibold text-skyGlow ring-1 ring-blue-800/40">
            {numericValue}/10
          </span>
        </div>
        <input
          id={id}
          type="range"
          min={1}
          max={10}
          step={1}
          value={numericValue}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full accent-blue-600"
        />
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>baixo</span>
          <span>alto</span>
        </div>
      </div>
    );
  }

  if (question.type === "long_text") {
    return (
      <div>
        <Label htmlFor={id}>{question.label}</Label>
        {question.description && <p className="mb-3 text-xs leading-5 text-slate-400">{question.description}</p>}
        <textarea
          id={id}
          className={fieldClassName()}
          rows={5}
          placeholder={question.placeholder ?? undefined}
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    );
  }

  if (question.type === "number") {
    return (
      <div>
        <Label htmlFor={id}>{question.label}</Label>
        {question.description && <p className="mb-3 text-xs leading-5 text-slate-400">{question.description}</p>}
        <input
          id={id}
          className={fieldClassName()}
          type="number"
          min={0}
          placeholder={question.placeholder ?? undefined}
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    );
  }

  if (question.type === "single_select") {
    return (
      <div>
        <p className="mb-2 block text-sm font-medium text-slate-200">{question.label}</p>
        {question.description && <p className="mb-3 text-xs leading-5 text-slate-400">{question.description}</p>}
        <div className={optionGridClass}>
          {question.options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`min-h-16 rounded-2xl px-4 text-left text-sm font-medium transition duration-300 ${
                value === option.value ? "bg-cyanGlow text-white shadow-glow" : "bg-slate-950/60 text-slate-300 hover:bg-hover"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (question.type === "multi_select") {
    const selected = Array.isArray(value) ? value : [];

    return (
      <div>
        <p className="mb-2 block text-sm font-medium text-slate-200">{question.label}</p>
        {question.description && <p className="mb-3 text-xs leading-5 text-slate-400">{question.description}</p>}
        <div className={optionGridClass}>
          {question.options.map((option) => {
            const isSelected = selected.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onChange(
                    isSelected ? selected.filter((item) => item !== option.value) : [...selected, option.value]
                  )
                }
                className={`min-h-16 rounded-2xl px-4 text-left text-sm font-medium transition duration-300 ${
                  isSelected ? "bg-cyanGlow text-white shadow-glow" : "bg-slate-950/60 text-slate-300 hover:bg-hover"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor={id}>{question.label}</Label>
      {question.description && <p className="mb-3 text-xs leading-5 text-slate-400">{question.description}</p>}
      <input
        id={id}
        className={fieldClassName()}
        placeholder={question.placeholder ?? undefined}
        value={String(value)}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function DiagnosticForm({ formName, questions }: { formName?: string; questions: DiagnosticQuestion[] }) {
  const router = useRouter();
  const activeQuestions = useMemo(
    () => questions.filter((question) => question.isActive).sort((left, right) => left.order - right.order),
    [questions]
  );
  const groupedSteps = useMemo(() => groupQuestions(activeQuestions), [activeQuestions]);
  const formSteps = useMemo<FormStep[]>(
    () => [
      {
        step: "Mapa de foco",
        questions: [],
        isFocusStep: true
      },
      ...groupedSteps
    ],
    [groupedSteps]
  );
  const [step, setStep] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [form, setForm] = useState<FormState>(() =>
    Object.fromEntries(activeQuestions.map((question) => [question.id, initialValue(question)]))
  );
  const [areaPreferences, setAreaPreferences] = useState<AreaPreferenceState>(() => createInitialAreaPreferences());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = useMemo(() => ((step + 1) / formSteps.length) * 100, [formSteps.length, step]);
  const currentStep = formSteps[step];
  const areaPreferenceTotal = getAreaPreferenceTotal(areaPreferences);

  function updateField(question: DiagnosticQuestion, value: DiagnosticAnswerValue) {
    setForm((current) => ({ ...current, [question.id]: value }));
    setError(null);
  }

  function updateAreaPreference(area: CareerAreaSlug, value: number) {
    setAreaPreferences((current) => {
      const currentValue = current[area] ?? 0;
      const otherTotal = getAreaPreferenceTotal(current) - currentValue;
      const safeValue = Math.min(Math.max(value, 0), 100 - otherTotal);

      return {
        ...current,
        [area]: safeValue
      };
    });
    setError(null);
  }

  function clearAreaPreferences() {
    setAreaPreferences(createInitialAreaPreferences());
    setError(null);
  }

  function getCurrentStepError(): string | null {
    if (!currentStep) {
      return "Nenhuma etapa ativa foi encontrada.";
    }

    if (currentStep.isFocusStep && areaPreferenceTotal <= 0) {
      return "Distribua pelo menos um foco para o DevUp entender sua direcao principal.";
    }

    const hasRequiredAnswers = currentStep.questions.every((question) => {
      if (!question.required) {
        return true;
      }

      return hasValue(form[question.id] ?? initialValue(question));
    });

    return hasRequiredAnswers ? null : "Preencha os campos obrigatorios desta etapa.";
  }

  function canAdvance(): boolean {
    return getCurrentStepError() === null;
  }

  async function submit() {
    const validationMessage = getCurrentStepError();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const payload = {
      area_preferences: buildAreaPreferencePayload(areaPreferences),
      answers: activeQuestions.map((question) => ({
        question_id: question.id,
        key: question.key,
        value: form[question.id] ?? initialValue(question)
      }))
    };

    try {
      const response = await fetch("/api/diagnostics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as { id?: string; message?: string };

      if (!response.ok || !data.id) {
        setError(data.message ?? "Nao foi possivel gerar o plano.");
        return;
      }

      router.push(`/result/${data.id}`);
    } catch {
      setError("Nao foi possivel conectar com o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!activeQuestions.length || !currentStep) {
    return (
      <section className="devup-panel p-6">
        <p className="text-sm text-slate-300">Nenhuma pergunta ativa foi configurada ainda.</p>
      </section>
    );
  }

  if (!hasStarted) {
    return (
      <section className="devup-panel p-5 sm:p-7">
        <p className="text-xs font-normal uppercase tracking-[0.15em] text-slate-500">diagnostico devup</p>
        <h2 className="mt-3 text-3xl font-semibold leading-tight text-white">
          {formName ?? "Estudar mais nem sempre e evoluir melhor."}
        </h2>
        <p className="mt-4 text-sm leading-6 text-slate-400">
          Em poucos minutos, vamos entender seu momento, suas lacunas e sua rotina para montar uma direcao clara de estudo.
        </p>

        <div className="mt-6 grid gap-3 text-sm text-slate-300">
          {[
            "Sem respostas certas ou erradas.",
            "O plano sera calibrado para sua realidade.",
            "Quanto mais honesto voce for, melhor o diagnostico."
          ].map((item) => (
            <div key={item} className="rounded-2xl bg-slate-950/55 p-4">
              {item}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setHasStarted(true)}
          className="devup-button mt-7 min-h-12 w-full px-5 text-sm font-semibold"
        >
          Montar meu direcionamento
        </button>
      </section>
    );
  }

  if (isSubmitting) {
    return (
      <section className="devup-panel p-5 sm:p-7">
        <p className="text-xs font-normal uppercase tracking-[0.15em] text-slate-500">processando</p>
        <h2 className="mt-3 text-3xl font-semibold leading-tight text-white">Preparando seu diagnostico.</h2>
        <p className="mt-4 text-sm leading-6 text-slate-400">
          O DevUp esta cruzando suas respostas para criar uma direcao mais clara, sem roteiro generico.
        </p>
        <div className="mt-7 grid gap-3">
          {processingMessages.map((message, index) => (
            <div
              key={message}
              className="flex items-center gap-3 rounded-2xl bg-slate-950/55 p-4 text-sm text-slate-300"
              style={{ animationDelay: `${index * 180}ms` }}
            >
              <span className="h-2 w-2 rounded-full bg-skyGlow shadow-glow" />
              {message}
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="devup-panel p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-normal uppercase tracking-[0.15em] text-slate-500">
              Etapa {step + 1} de {formSteps.length}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[0.01em] text-white">{currentStep.step}</h2>
          </div>
          <span className="rounded-full bg-blue-950 px-3 py-1 text-xs font-medium text-skyGlow ring-1 ring-blue-800/40">
            {currentStep.isFocusStep ? "personalizacao" : "configuravel"}
          </span>
        </div>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-900">
          <div
            className="h-full rounded-full bg-cyanGlow shadow-glow transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="min-h-[430px] space-y-5">
        {currentStep.isFocusStep ? (
          <FocusPreferencePanel
            preferences={areaPreferences}
            onChange={updateAreaPreference}
            onClear={clearAreaPreferences}
          />
        ) : (
          currentStep.questions.map((question) => (
            <QuestionField
              key={question.id}
              question={question}
              value={form[question.id] ?? initialValue(question)}
              onChange={(value) => updateField(question, value)}
            />
          ))
        )}
      </div>

      {error && <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p>}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(current - 1, 0))}
          disabled={step === 0 || isSubmitting}
          className="min-h-11 rounded-full bg-slate-950 px-5 text-sm font-semibold text-slate-300 transition duration-300 hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Voltar
        </button>

        {step < formSteps.length - 1 ? (
          <button
            type="button"
            onClick={() => {
              const validationMessage = getCurrentStepError();

              if (validationMessage) {
                setError(validationMessage);
                return;
              }

              setStep((current) => current + 1);
            }}
            className="devup-button min-h-11 px-5 text-sm font-semibold"
          >
            Continuar
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={isSubmitting}
            className="devup-button min-h-11 px-5 text-sm font-semibold disabled:cursor-wait disabled:opacity-70"
          >
            Gerar meu plano DevUp
          </button>
        )}
      </div>
    </section>
  );
}
