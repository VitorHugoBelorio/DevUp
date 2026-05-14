"use client";

import { useMemo, useState } from "react";
import type {
  DiagnosticFormWithQuestions,
  DiagnosticQuestion,
  QuestionOption,
  QuestionType
} from "@/types/diagnostic";

type EditableForm = DiagnosticFormWithQuestions;
type EditableQuestion = DiagnosticQuestion;

const questionTypes: Array<{ value: QuestionType; label: string }> = [
  { value: "short_text", label: "Texto curto" },
  { value: "long_text", label: "Texto longo" },
  { value: "number", label: "Numero" },
  { value: "scale", label: "Escala 1 a 10" },
  { value: "single_select", label: "Selecao unica" },
  { value: "multi_select", label: "Selecao multipla" }
];

function newForm(): EditableForm {
  const timestamp = Date.now();

  return {
    id: `new-form-${timestamp}`,
    slug: `novo_formulario_${timestamp}`,
    name: "Novo diagnostico",
    description: "Descreva o objetivo deste formulario.",
    isActive: false,
    isArchived: false,
    questions: []
  };
}

function newQuestion(order: number, formId: string): EditableQuestion {
  return {
    id: `new-${Date.now()}`,
    formId,
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

export function AdminQuestionsManager({ initialForms }: { initialForms: DiagnosticFormWithQuestions[] }) {
  const [forms, setForms] = useState<EditableForm[]>(initialForms);
  const [selectedFormId, setSelectedFormId] = useState(initialForms[0]?.id ?? "");
  const [selectedQuestionId, setSelectedQuestionId] = useState(initialForms[0]?.questions[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedForm = useMemo(
    () => forms.find((form) => form.id === selectedFormId) ?? forms[0],
    [forms, selectedFormId]
  );
  const questions = selectedForm?.questions ?? [];
  const selected = useMemo(
    () => questions.find((question) => question.id === selectedQuestionId) ?? questions[0],
    [questions, selectedQuestionId]
  );
  const isUnsavedForm = selectedForm?.id.startsWith("new-form-") ?? false;

  function upsertForm(form: EditableForm) {
    setForms((current) => {
      const exists = current.some((item) => item.id === form.id);
      const next = exists ? current.map((item) => (item.id === form.id ? form : item)) : [...current, form];
      return next.sort((left, right) => Number(right.isActive) - Number(left.isActive));
    });
  }

  function updateSelectedForm(patch: Partial<EditableForm>) {
    if (!selectedForm) {
      return;
    }

    setForms((current) => current.map((form) => (form.id === selectedForm.id ? { ...form, ...patch } : form)));
    setMessage(null);
  }

  function updateSelectedQuestion(patch: Partial<EditableQuestion>) {
    if (!selectedForm || !selected) {
      return;
    }

    setForms((current) =>
      current.map((form) =>
        form.id === selectedForm.id
          ? {
              ...form,
              questions: form.questions.map((question) =>
                question.id === selected.id ? { ...question, ...patch } : question
              )
            }
          : form
      )
    );
    setMessage(null);
  }

  async function saveForm(form: EditableForm) {
    setIsSaving(true);
    setMessage(null);

    const isNew = form.id.startsWith("new-form-");
    const response = await fetch(isNew ? "/api/admin/forms" : `/api/admin/forms/${form.id}`, {
      method: isNew ? "POST" : "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    });
    const data = (await response.json()) as { form?: DiagnosticFormWithQuestions; message?: string };

    setIsSaving(false);

    if (!response.ok || !data.form) {
      setMessage(data.message ?? "Nao foi possivel salvar o formulario.");
      return;
    }

    setForms((current) =>
      current
        .map((item) => (item.id === form.id ? data.form! : item))
        .filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index)
        .sort((left, right) => Number(right.isActive) - Number(left.isActive))
    );
    setSelectedFormId(data.form.id);
    setSelectedQuestionId(data.form.questions[0]?.id ?? "");
    setMessage("Formulario salvo.");
  }

  async function activateForm(form: EditableForm) {
    if (form.id.startsWith("new-form-")) {
      setMessage("Salve o formulario antes de ativa-lo.");
      return;
    }

    const response = await fetch(`/api/admin/forms/${form.id}/activate`, { method: "POST" });
    const data = (await response.json()) as { form?: DiagnosticFormWithQuestions; message?: string };

    if (!response.ok || !data.form) {
      setMessage(data.message ?? "Nao foi possivel ativar o formulario.");
      return;
    }

    setForms((current) =>
      current.map((item) => ({
        ...item,
        isActive: item.id === data.form!.id
      }))
    );
    setSelectedFormId(data.form.id);
    setMessage("Formulario ativo no diagnostico publico.");
  }

  async function removeForm(form: EditableForm) {
    if (form.id.startsWith("new-form-")) {
      const remaining = forms.filter((item) => item.id !== form.id);
      setForms(remaining);
      setSelectedFormId(remaining[0]?.id ?? "");
      setSelectedQuestionId(remaining[0]?.questions[0]?.id ?? "");
      return;
    }

    const response = await fetch(`/api/admin/forms/${form.id}`, { method: "DELETE" });
    const data = (await response.json()) as { message?: string };

    if (!response.ok) {
      setMessage(data.message ?? "Nao foi possivel remover o formulario.");
      return;
    }

    const remaining = forms.filter((item) => item.id !== form.id);
    setForms(remaining);
    setSelectedFormId(remaining[0]?.id ?? "");
    setSelectedQuestionId(remaining[0]?.questions[0]?.id ?? "");
    setMessage("Formulario removido.");
  }

  async function saveQuestion(question: EditableQuestion) {
    if (!selectedForm || isUnsavedForm) {
      setMessage("Salve o formulario antes de cadastrar perguntas.");
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const payload = { ...question, formId: selectedForm.id };
    const isNew = question.id.startsWith("new-");
    const response = await fetch(isNew ? "/api/admin/questions" : `/api/admin/questions/${question.id}`, {
      method: isNew ? "POST" : "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = (await response.json()) as { question?: DiagnosticQuestion; message?: string };

    setIsSaving(false);

    if (!response.ok || !data.question) {
      setMessage(data.message ?? "Nao foi possivel salvar.");
      return;
    }

    setForms((current) =>
      current.map((form) =>
        form.id === selectedForm.id
          ? {
              ...form,
              questions: form.questions
                .map((item) => (item.id === question.id ? data.question! : item))
                .sort((left, right) => left.order - right.order)
            }
          : form
      )
    );
    setSelectedQuestionId(data.question.id);
    setMessage("Pergunta salva.");
  }

  async function removeQuestion(question: EditableQuestion) {
    if (!selectedForm) {
      return;
    }

    if (question.id.startsWith("new-")) {
      const remaining = questions.filter((item) => item.id !== question.id);
      updateSelectedForm({ questions: remaining });
      setSelectedQuestionId(remaining[0]?.id ?? "");
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
    updateSelectedForm({ questions: remaining });
    setSelectedQuestionId(remaining[0]?.id ?? "");
    setMessage("Pergunta removida.");
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  if (!selectedForm) {
    return (
      <section className="devup-panel p-6">
        <button
          type="button"
          onClick={() => {
            const form = newForm();
            setForms([form]);
            setSelectedFormId(form.id);
          }}
          className="devup-button min-h-11 px-5 text-sm font-semibold"
        >
          Criar primeiro formulario
        </button>
      </section>
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
      <aside className="space-y-4">
        <div className="devup-panel p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-[0.01em] text-white">Formularios</h2>
            <button type="button" onClick={logout} className="rounded-full bg-slate-950 px-4 py-2 text-xs text-slate-300">
              sair
            </button>
          </div>
          <div className="mt-4 grid gap-2">
            {forms.map((form) => (
              <button
                key={form.id}
                type="button"
                onClick={() => {
                  setSelectedFormId(form.id);
                  setSelectedQuestionId(form.questions[0]?.id ?? "");
                }}
                className={`rounded-2xl px-4 py-3 text-left text-sm transition duration-300 ${
                  form.id === selectedForm.id
                    ? "bg-cyanGlow text-white shadow-glow"
                    : "bg-slate-950/60 text-slate-300 hover:bg-hover"
                }`}
              >
                <span className="block font-semibold">{form.name || "Formulario sem titulo"}</span>
                <span className={form.id === selectedForm.id ? "text-blue-100" : "text-slate-500"}>
                  {form.isActive ? "ativo" : "rascunho"} - {form.questions.length} perguntas
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              const form = newForm();
              setForms((current) => [...current, form]);
              setSelectedFormId(form.id);
              setSelectedQuestionId("");
            }}
            className="devup-button mt-4 min-h-11 w-full px-5 text-sm font-semibold"
          >
            Novo formulario
          </button>
        </div>

        <div className="devup-panel p-4">
          <h2 className="text-lg font-semibold tracking-[0.01em] text-white">Perguntas</h2>
          <div className="mt-4 grid gap-2">
            {questions.map((question) => (
              <button
                key={question.id}
                type="button"
                onClick={() => setSelectedQuestionId(question.id)}
                className={`rounded-2xl px-4 py-3 text-left text-sm transition duration-300 ${
                  question.id === selected?.id
                    ? "bg-blue-950/80 text-white"
                    : "bg-slate-950/60 text-slate-300 hover:bg-hover"
                }`}
              >
                <span className="block font-semibold">{question.label || "Pergunta sem titulo"}</span>
                <span className={question.id === selected?.id ? "text-blue-100" : "text-slate-500"}>
                  {question.step} - ordem {question.order}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              if (isUnsavedForm) {
                setMessage("Salve o formulario antes de adicionar perguntas.");
                return;
              }

              const question = newQuestion((questions.at(-1)?.order ?? 0) + 10, selectedForm.id);
              updateSelectedForm({ questions: [...questions, question] });
              setSelectedQuestionId(question.id);
            }}
            className="devup-button mt-4 min-h-11 w-full px-5 text-sm font-semibold"
          >
            Nova pergunta
          </button>
        </div>
      </aside>

      <div className="space-y-6">
        <div className="devup-panel p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-normal uppercase tracking-[0.14em] text-slate-500">formulario selecionado</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{selectedForm.name}</h2>
            </div>
            <span className="rounded-full bg-blue-950 px-3 py-1 text-xs font-medium text-skyGlow ring-1 ring-blue-800/40">
              {selectedForm.isActive ? "ativo no publico" : "rascunho"}
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Nome">
              <input
                className="devup-input text-sm"
                value={selectedForm.name}
                onChange={(event) => updateSelectedForm({ name: event.target.value })}
              />
            </Field>
            <Field label="Slug">
              <input
                className="devup-input text-sm"
                value={selectedForm.slug}
                onChange={(event) => updateSelectedForm({ slug: event.target.value })}
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Descricao">
              <textarea
                className="devup-input text-sm"
                rows={3}
                value={selectedForm.description ?? ""}
                onChange={(event) => updateSelectedForm({ description: event.target.value })}
              />
            </Field>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => removeForm(selectedForm)}
              className="min-h-11 rounded-full bg-red-500/10 px-5 text-sm font-semibold text-red-100 transition hover:bg-red-500/20"
            >
              Remover formulario
            </button>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => activateForm(selectedForm)}
                disabled={selectedForm.isActive}
                className="min-h-11 rounded-full bg-slate-950 px-5 text-sm font-semibold text-slate-300 transition hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                Tornar ativo
              </button>
              <button
                type="button"
                onClick={() => saveForm(selectedForm)}
                disabled={isSaving}
                className="devup-button min-h-11 px-5 text-sm font-semibold disabled:cursor-wait disabled:opacity-70"
              >
                {isSaving ? "Salvando..." : "Salvar formulario"}
              </button>
            </div>
          </div>
        </div>

        {selected ? (
          <div className="devup-panel p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Pergunta">
                <input
                  className="devup-input text-sm"
                  value={selected.label}
                  onChange={(event) => updateSelectedQuestion({ label: event.target.value })}
                />
              </Field>
              <Field label="Chave tecnica">
                <input
                  className="devup-input text-sm"
                  value={selected.key}
                  onChange={(event) => updateSelectedQuestion({ key: event.target.value })}
                  placeholder="ex: current_stack"
                />
              </Field>
              <Field label="Etapa">
                <input
                  className="devup-input text-sm"
                  value={selected.step}
                  onChange={(event) => updateSelectedQuestion({ step: event.target.value })}
                />
              </Field>
              <Field label="Tipo">
                <select
                  className="devup-input text-sm"
                  value={selected.type}
                  onChange={(event) => updateSelectedQuestion({ type: event.target.value as QuestionType })}
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
                  onChange={(event) => updateSelectedQuestion({ order: Number(event.target.value) })}
                />
              </Field>
              <Field label="Placeholder">
                <input
                  className="devup-input text-sm"
                  value={selected.placeholder ?? ""}
                  onChange={(event) => updateSelectedQuestion({ placeholder: event.target.value })}
                />
              </Field>
            </div>

            <div className="mt-4 grid gap-4">
              <Field label="Descricao">
                <textarea
                  className="devup-input text-sm"
                  rows={3}
                  value={selected.description ?? ""}
                  onChange={(event) => updateSelectedQuestion({ description: event.target.value })}
                />
              </Field>
              <Field label="Contexto para IA">
                <textarea
                  className="devup-input text-sm"
                  rows={3}
                  value={selected.aiHint ?? ""}
                  onChange={(event) => updateSelectedQuestion({ aiHint: event.target.value })}
                />
              </Field>
              {(selected.type === "single_select" || selected.type === "multi_select") && (
                <Field label="Opcoes, uma por linha: valor|rotulo">
                  <textarea
                    className="devup-input text-sm"
                    rows={5}
                    value={optionsToText(selected.options)}
                    onChange={(event) => updateSelectedQuestion({ options: textToOptions(event.target.value) })}
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
                  onChange={(event) => updateSelectedQuestion({ required: event.target.checked })}
                />
                Obrigatoria
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.isActive}
                  onChange={(event) => updateSelectedQuestion({ isActive: event.target.checked })}
                />
                Ativa neste formulario
              </label>
            </div>

            {message && <p className="mt-4 rounded-2xl bg-blue-950/50 px-4 py-3 text-sm text-skyGlow">{message}</p>}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => removeQuestion(selected)}
                className="min-h-11 rounded-full bg-red-500/10 px-5 text-sm font-semibold text-red-100 transition hover:bg-red-500/20"
              >
                Remover pergunta
              </button>
              <button
                type="button"
                onClick={() => saveQuestion(selected)}
                disabled={isSaving}
                className="devup-button min-h-11 px-5 text-sm font-semibold disabled:cursor-wait disabled:opacity-70"
              >
                {isSaving ? "Salvando..." : "Salvar pergunta"}
              </button>
            </div>
          </div>
        ) : (
          <div className="devup-panel p-6">
            {message && <p className="mb-4 rounded-2xl bg-blue-950/50 px-4 py-3 text-sm text-skyGlow">{message}</p>}
            <p className="text-sm leading-6 text-slate-400">
              Este formulario ainda nao tem perguntas. Salve o formulario e crie a primeira pergunta para disponibilizar
              um fluxo completo.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
