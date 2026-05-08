"use client";

import { useMemo, useState } from "react";
import type { DiagnosticQuestion, QuestionOption, QuestionType } from "@/types/diagnostic";

type EditableQuestion = DiagnosticQuestion;

const questionTypes: Array<{ value: QuestionType; label: string }> = [
  { value: "short_text", label: "Texto curto" },
  { value: "long_text", label: "Texto longo" },
  { value: "number", label: "Numero" },
  { value: "scale", label: "Escala 1 a 10" },
  { value: "single_select", label: "Selecao unica" },
  { value: "multi_select", label: "Selecao multipla" }
];

function newQuestion(order: number): EditableQuestion {
  return {
    id: `new-${Date.now()}`,
    key: "",
    label: "",
    description: "",
    placeholder: "",
    type: "short_text",
    required: true,
    options: [],
    step: "Perfil",
    order,
    aiHint: "",
    isActive: true
  };
}

function optionsToText(options: QuestionOption[]): string {
  return options.map((option) => `${option.value}|${option.label}`).join("\n");
}

function textToOptions(value: string): QuestionOption[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawValue, ...labelParts] = line.split("|");
      const optionValue = rawValue.trim();
      const label = labelParts.join("|").trim() || optionValue;

      return {
        value: optionValue,
        label
      };
    });
}

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-normal uppercase tracking-[0.14em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export function AdminQuestionsManager({ initialQuestions }: { initialQuestions: DiagnosticQuestion[] }) {
  const [questions, setQuestions] = useState<EditableQuestion[]>(initialQuestions);
  const [selectedId, setSelectedId] = useState(initialQuestions[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selected = useMemo(
    () => questions.find((question) => question.id === selectedId) ?? questions[0],
    [questions, selectedId]
  );

  function updateSelected(patch: Partial<EditableQuestion>) {
    setQuestions((current) =>
      current.map((question) => (question.id === selected.id ? { ...question, ...patch } : question))
    );
    setMessage(null);
  }

  async function save(question: EditableQuestion) {
    setIsSaving(true);
    setMessage(null);

    const isNew = question.id.startsWith("new-");
    const response = await fetch(isNew ? "/api/admin/questions" : `/api/admin/questions/${question.id}`, {
      method: isNew ? "POST" : "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(question)
    });
    const data = (await response.json()) as { question?: DiagnosticQuestion; message?: string };

    setIsSaving(false);

    if (!response.ok || !data.question) {
      setMessage(data.message ?? "Nao foi possivel salvar.");
      return;
    }

    setQuestions((current) =>
      current.map((item) => (item.id === question.id ? data.question! : item)).sort((left, right) => left.order - right.order)
    );
    setSelectedId(data.question.id);
    setMessage("Pergunta salva.");
  }

  async function remove(question: EditableQuestion) {
    if (question.id.startsWith("new-")) {
      setQuestions((current) => current.filter((item) => item.id !== question.id));
      setSelectedId(questions[0]?.id ?? "");
      return;
    }

    const response = await fetch(`/api/admin/questions/${question.id}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      setMessage("Nao foi possivel remover.");
      return;
    }

    const remaining = questions.filter((item) => item.id !== question.id);
    setQuestions(remaining);
    setSelectedId(remaining[0]?.id ?? "");
    setMessage("Pergunta removida.");
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  if (!selected) {
    return (
      <section className="devup-panel p-6">
        <button
          type="button"
          onClick={() => {
            const question = newQuestion(10);
            setQuestions([question]);
            setSelectedId(question.id);
          }}
          className="devup-button min-h-11 px-5 text-sm font-semibold"
        >
          Criar primeira pergunta
        </button>
      </section>
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <aside className="devup-panel p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-[0.01em] text-white">Perguntas</h2>
          <button type="button" onClick={logout} className="rounded-full bg-slate-950 px-4 py-2 text-xs text-slate-300">
            sair
          </button>
        </div>
        <div className="mt-4 grid gap-2">
          {questions.map((question) => (
            <button
              key={question.id}
              type="button"
              onClick={() => setSelectedId(question.id)}
              className={`rounded-2xl px-4 py-3 text-left text-sm transition duration-300 ${
                question.id === selected.id ? "bg-cyanGlow text-white shadow-glow" : "bg-slate-950/60 text-slate-300 hover:bg-hover"
              }`}
            >
              <span className="block font-semibold">{question.label || "Pergunta sem titulo"}</span>
              <span className={question.id === selected.id ? "text-blue-100" : "text-slate-500"}>
                {question.step} - ordem {question.order}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            const question = newQuestion((questions.at(-1)?.order ?? 0) + 10);
            setQuestions((current) => [...current, question]);
            setSelectedId(question.id);
          }}
          className="devup-button mt-4 min-h-11 w-full px-5 text-sm font-semibold"
        >
          Nova pergunta
        </button>
      </aside>

      <div className="devup-panel p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Pergunta">
            <input
              className="devup-input text-sm"
              value={selected.label}
              onChange={(event) => updateSelected({ label: event.target.value })}
            />
          </Field>
          <Field label="Chave tecnica">
            <input
              className="devup-input text-sm"
              value={selected.key}
              onChange={(event) => updateSelected({ key: event.target.value })}
              placeholder="ex: current_stack"
            />
          </Field>
          <Field label="Etapa">
            <input
              className="devup-input text-sm"
              value={selected.step}
              onChange={(event) => updateSelected({ step: event.target.value })}
            />
          </Field>
          <Field label="Tipo">
            <select
              className="devup-input text-sm"
              value={selected.type}
              onChange={(event) => updateSelected({ type: event.target.value as QuestionType })}
            >
              {questionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ordem">
            <input
              className="devup-input text-sm"
              type="number"
              value={selected.order}
              onChange={(event) => updateSelected({ order: Number(event.target.value) })}
            />
          </Field>
          <Field label="Placeholder">
            <input
              className="devup-input text-sm"
              value={selected.placeholder ?? ""}
              onChange={(event) => updateSelected({ placeholder: event.target.value })}
            />
          </Field>
        </div>

        <div className="mt-4 grid gap-4">
          <Field label="Descricao">
            <textarea
              className="devup-input text-sm"
              rows={3}
              value={selected.description ?? ""}
              onChange={(event) => updateSelected({ description: event.target.value })}
            />
          </Field>
          <Field label="Contexto para IA">
            <textarea
              className="devup-input text-sm"
              rows={3}
              value={selected.aiHint ?? ""}
              onChange={(event) => updateSelected({ aiHint: event.target.value })}
            />
          </Field>
          {(selected.type === "single_select" || selected.type === "multi_select") && (
            <Field label="Opcoes, uma por linha: valor|rotulo">
              <textarea
                className="devup-input text-sm"
                rows={5}
                value={optionsToText(selected.options)}
                onChange={(event) => updateSelected({ options: textToOptions(event.target.value) })}
                placeholder={"first_job|Primeiro emprego\nimprove|Melhorar como dev"}
              />
            </Field>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-300">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selected.required}
              onChange={(event) => updateSelected({ required: event.target.checked })}
            />
            Obrigatoria
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selected.isActive}
              onChange={(event) => updateSelected({ isActive: event.target.checked })}
            />
            Ativa no formulario publico
          </label>
        </div>

        {message && <p className="mt-4 rounded-2xl bg-blue-950/50 px-4 py-3 text-sm text-skyGlow">{message}</p>}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => remove(selected)}
            className="min-h-11 rounded-full bg-red-500/10 px-5 text-sm font-semibold text-red-100 transition hover:bg-red-500/20"
          >
            Remover
          </button>
          <button
            type="button"
            onClick={() => save(selected)}
            disabled={isSaving}
            className="devup-button min-h-11 px-5 text-sm font-semibold disabled:cursor-wait disabled:opacity-70"
          >
            {isSaving ? "Salvando..." : "Salvar pergunta"}
          </button>
        </div>
      </div>
    </section>
  );
}
