"use client";

import { useEffect, useMemo, useState } from "react";
import { recommendationTypes, resourceLevels } from "@/types/diagnostic";
import type { KnowledgeFlag, KnowledgeResource, RecommendationType, ResourceLevel } from "@/types/diagnostic";

type EditableResource = KnowledgeResource & {
  flagText: string;
};

type EditableFlag = KnowledgeFlag;

const pageSize = 9;

const typeLabels: Record<RecommendationType, string> = {
  platform: "Plataforma",
  article: "Artigo",
  blog: "Blog",
  documentation: "Documentacao",
  course: "Curso",
  video: "Video",
  community: "Comunidade",
  tool: "Ferramenta",
  other: "Outro"
};

const levelLabels: Record<ResourceLevel, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediario",
  advanced: "Avancado"
};

function dateToInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

function resourceToEditable(resource: KnowledgeResource): EditableResource {
  return {
    ...resource,
    flagText: resource.flags.map((flag) => flag.key).join("\n")
  };
}

function sortResources(resources: EditableResource[]): EditableResource[] {
  return [...resources].sort((left, right) => {
    if (left.isActive !== right.isActive) {
      return Number(right.isActive) - Number(left.isActive);
    }

    return right.priority - left.priority || left.title.localeCompare(right.title);
  });
}

function newResource(): EditableResource {
  return {
    id: `new-resource-${Date.now()}`,
    title: "",
    subject: "",
    url: "",
    type: "article",
    level: "beginner",
    description: "",
    sourceName: "",
    estimatedMinutes: null,
    priority: 0,
    isActive: true,
    isMainTrack: false,
    isOutdated: false,
    publishedAt: null,
    lastCheckedAt: null,
    flags: [],
    flagText: ""
  };
}

function newFlag(): EditableFlag {
  return {
    id: `new-flag-${Date.now()}`,
    key: "",
    label: "",
    description: ""
  };
}

function flagTextToKeys(value: string): string[] {
  return value
    .split(/[\n,;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function Field({
  label,
  children,
  hint
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-normal uppercase tracking-[0.14em] text-slate-500">{label}</span>
      {children}
      {hint ? <span className="mt-2 block text-xs leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}

function getFlagLabel(flag: KnowledgeFlag): string {
  return flag.label || flag.key;
}

function ResourceCard({
  isSelected,
  onDelete,
  onSelect,
  resource
}: {
  isSelected: boolean;
  onDelete(): void;
  onSelect(): void;
  resource: EditableResource;
}) {
  const flags = flagTextToKeys(resource.flagText).slice(0, 4);

  return (
    <article
      className={`group relative flex min-h-[260px] flex-col rounded-2xl bg-slate-950/60 p-5 ring-1 transition duration-300 hover:-translate-y-0.5 hover:bg-hover ${
        isSelected ? "ring-cyanGlow shadow-glow" : "ring-blue-950/70"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-950 text-sm font-semibold text-skyGlow ring-1 ring-blue-800/50">
            {resource.type.slice(0, 2).toUpperCase()}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
              resource.isActive
                ? "bg-emerald-500/10 text-emerald-200 ring-emerald-400/25"
                : "bg-slate-900 text-slate-400 ring-slate-700"
            }`}
          >
            {resource.isActive ? "ATIVA" : "INATIVA"}
          </span>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-full bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100 opacity-80 transition hover:bg-red-500/20 hover:opacity-100"
        >
          Remover
        </button>
      </div>

      <button type="button" onClick={onSelect} className="mt-5 flex flex-1 flex-col text-left focus:outline-none">
        <p className="text-xs font-normal uppercase tracking-[0.14em] text-skyGlow">{typeLabels[resource.type]}</p>
        <h3 className="mt-3 text-xl font-semibold leading-tight text-white">
          {resource.title || "Referencia sem titulo"}
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
          {resource.description || "Clique para detalhar esta referencia e definir assunto, link, descricao e flags."}
        </p>

        <div className="mt-auto pt-6">
          <div className="h-px bg-blue-950/70" />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-500">
              Assunto: <span className="text-slate-300">{resource.subject || "nao definido"}</span>
            </span>
            <span className="rounded-full bg-blue-950 px-3 py-1 text-xs font-semibold text-skyGlow ring-1 ring-blue-800/40">
              prioridade {resource.priority}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-900 px-2.5 py-1 font-semibold text-slate-300">
              {levelLabels[resource.level]}
            </span>
            {resource.estimatedMinutes ? (
              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-slate-400">
                {resource.estimatedMinutes} min
              </span>
            ) : null}
            {resource.isMainTrack ? (
              <span className="rounded-full bg-amber-500/10 px-2.5 py-1 font-semibold text-amber-100 ring-1 ring-amber-400/20">
                trilha principal
              </span>
            ) : null}
            {resource.isOutdated ? (
              <span className="rounded-full bg-red-500/10 px-2.5 py-1 font-semibold text-red-100 ring-1 ring-red-400/20">
                desatualizada
              </span>
            ) : null}
          </div>
          {flags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {flags.map((flag) => (
                <span key={flag} className="rounded-full bg-slate-900 px-2.5 py-1 text-xs text-slate-400">
                  {flag}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-600">Sem flags selecionadas.</p>
          )}
        </div>
      </button>
    </article>
  );
}

function FlagMiniCard({
  flag,
  isSelected,
  onClick,
  compact = false
}: {
  flag: KnowledgeFlag;
  isSelected: boolean;
  onClick(): void;
  compact?: boolean;
}) {
  const label = getFlagLabel(flag) || "Flag sem titulo";
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[5.5rem] w-full items-start gap-3 rounded-2xl p-3 text-left ring-1 transition duration-300 hover:-translate-y-0.5 hover:bg-hover ${
        isSelected ? "bg-blue-600/18 ring-blue-500/55 shadow-glow" : "bg-slate-950/55 ring-blue-950/70"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs font-bold ring-1 ${
          isSelected ? "bg-blue-600 text-white ring-blue-400/40" : "bg-blue-950 text-skyGlow ring-blue-800/40"
        }`}
      >
        {initials || "#"}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-white">{label}</span>
        <span className="mt-1 block truncate text-xs text-skyGlow">{flag.key || "sem-chave"}</span>
        {!compact ? (
          <span className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
            {flag.description || "Sem descricao cadastrada."}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export function AdminKnowledgeManager({
  initialFlags,
  initialResources
}: {
  initialFlags: KnowledgeFlag[];
  initialResources: KnowledgeResource[];
}) {
  const [resources, setResources] = useState<EditableResource[]>(sortResources(initialResources.map(resourceToEditable)));
  const [flags, setFlags] = useState<EditableFlag[]>(initialFlags);
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [isResourceEditorOpen, setIsResourceEditorOpen] = useState(false);
  const [selectedFlagId, setSelectedFlagId] = useState(flags[0]?.id ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedResource = useMemo(
    () => resources.find((resource) => resource.id === selectedResourceId) ?? null,
    [resources, selectedResourceId]
  );
  const selectedFlag = useMemo(() => flags.find((flag) => flag.id === selectedFlagId) ?? flags[0], [flags, selectedFlagId]);
  const activeCount = resources.filter((resource) => resource.isActive).length;
  const normalizedQuery = normalizeSearch(searchQuery);
  const filteredResources = useMemo(() => {
    if (!normalizedQuery) {
      return resources;
    }

    return resources.filter((resource) => normalizeSearch(resource.title).includes(normalizedQuery));
  }, [normalizedQuery, resources]);
  const pageCount = Math.max(1, Math.ceil(filteredResources.length / pageSize));
  const visibleResources = filteredResources.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedQuery]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount));
  }, [pageCount]);

  function updateSelectedResource(patch: Partial<EditableResource>) {
    if (!selectedResource) {
      return;
    }

    setResources((current) =>
      current.map((resource) => (resource.id === selectedResource.id ? { ...resource, ...patch } : resource))
    );
    setMessage(null);
  }

  function updateSelectedFlag(patch: Partial<EditableFlag>) {
    if (!selectedFlag) {
      return;
    }

    setFlags((current) => current.map((flag) => (flag.id === selectedFlag.id ? { ...flag, ...patch } : flag)));
    setMessage(null);
  }

  function openResourceEditor(resourceId: string) {
    setSelectedResourceId(resourceId);
    setIsResourceEditorOpen(true);
    setMessage(null);
  }

  function closeResourceEditor() {
    setIsResourceEditorOpen(false);
  }

  function createResourceDraft() {
    const resource = newResource();
    setResources((current) => [resource, ...current]);
    setSearchQuery("");
    setCurrentPage(1);
    setSelectedResourceId(resource.id);
    setIsResourceEditorOpen(true);
    setMessage("Nova referencia criada como rascunho. Preencha os dados e salve.");
  }

  function toggleSelectedResourceFlag(flagKey: string) {
    if (!selectedResource) {
      return;
    }

    const currentKeys = flagTextToKeys(selectedResource.flagText);
    const nextKeys = currentKeys.includes(flagKey)
      ? currentKeys.filter((key) => key !== flagKey)
      : [...currentKeys, flagKey];

    updateSelectedResource({ flagText: nextKeys.join("\n") });
  }

  async function saveResource(resource: EditableResource) {
    setIsSaving(true);
    setMessage(null);

    const isNew = resource.id.startsWith("new-resource-");
    const response = await fetch(
      isNew ? "/api/admin/knowledge/resources" : `/api/admin/knowledge/resources/${resource.id}`,
      {
        method: isNew ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...resource,
          flagKeys: flagTextToKeys(resource.flagText)
        })
      }
    );
    const data = (await response.json()) as { resource?: KnowledgeResource; message?: string };

    setIsSaving(false);

    if (!response.ok || !data.resource) {
      setMessage(data.message ?? "Nao foi possivel salvar a referencia.");
      return;
    }

    const saved = resourceToEditable(data.resource);
    setResources((current) =>
      sortResources(
        current
          .map((item) => (item.id === resource.id ? saved : item))
          .filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index)
      )
    );
    setSelectedResourceId(saved.id);
    setIsResourceEditorOpen(false);
    setMessage("Referencia salva.");

    const flagsResponse = await fetch("/api/admin/knowledge/flags");
    const flagsData = (await flagsResponse.json()) as { flags?: KnowledgeFlag[] };
    if (flagsData.flags) {
      setFlags(flagsData.flags);
    }
  }

  async function removeResource(resource: EditableResource) {
    if (resource.id.startsWith("new-resource-")) {
      setResources((current) => current.filter((item) => item.id !== resource.id));
      setSelectedResourceId("");
      setIsResourceEditorOpen(false);
      setMessage("Rascunho removido.");
      return;
    }

    const response = await fetch(`/api/admin/knowledge/resources/${resource.id}`, { method: "DELETE" });

    if (!response.ok) {
      setMessage("Nao foi possivel remover a referencia.");
      return;
    }

    setResources((current) => current.filter((item) => item.id !== resource.id));
    setSelectedResourceId((current) => (current === resource.id ? "" : current));
    setIsResourceEditorOpen(false);
    setMessage("Referencia removida.");
  }

  async function saveFlag(flag: EditableFlag) {
    setIsSaving(true);
    setMessage(null);

    const isNew = flag.id.startsWith("new-flag-");
    const response = await fetch(isNew ? "/api/admin/knowledge/flags" : `/api/admin/knowledge/flags/${flag.id}`, {
      method: isNew ? "POST" : "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(flag)
    });
    const data = (await response.json()) as { flag?: KnowledgeFlag; message?: string };

    setIsSaving(false);

    if (!response.ok || !data.flag) {
      setMessage(data.message ?? "Nao foi possivel salvar a flag.");
      return;
    }

    setFlags((current) =>
      current
        .map((item) => (item.id === flag.id ? data.flag! : item))
        .filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index)
        .sort((left, right) => getFlagLabel(left).localeCompare(getFlagLabel(right)))
    );
    setSelectedFlagId(data.flag.id);
    setMessage("Flag salva.");
  }

  async function removeFlag(flag: EditableFlag) {
    if (flag.id.startsWith("new-flag-")) {
      const remaining = flags.filter((item) => item.id !== flag.id);
      setFlags(remaining);
      setSelectedFlagId(remaining[0]?.id ?? "");
      return;
    }

    const response = await fetch(`/api/admin/knowledge/flags/${flag.id}`, { method: "DELETE" });

    if (!response.ok) {
      setMessage("Nao foi possivel remover a flag.");
      return;
    }

    const remaining = flags.filter((item) => item.id !== flag.id);
    setFlags(remaining);
    setResources((current) =>
      current.map((resource) => ({
        ...resource,
        flagText: flagTextToKeys(resource.flagText)
          .filter((key) => key !== flag.key)
          .join("\n")
      }))
    );
    setSelectedFlagId(remaining[0]?.id ?? "");
    setMessage("Flag removida.");
  }

  const selectedFlagKeys = selectedResource ? flagTextToKeys(selectedResource.flagText) : [];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-5 rounded-3xl bg-slate-950/45 p-5 ring-1 ring-blue-950/70">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-normal uppercase tracking-[0.16em] text-skyGlow">biblioteca curada</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[0.01em] text-white">Referencias de estudo</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Cadastre fontes seguras para a IA recomendar sem depender de busca na web. Cada referencia vira um card
              editavel com assunto, link, prioridade e flags.
            </p>
          </div>
          <button type="button" onClick={createResourceDraft} className="devup-button min-h-12 px-5 text-sm font-semibold">
            + Criar referencia
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <Field label="Pesquisar por titulo" hint="Use para encontrar uma referencia especifica sem navegar por todas as paginas.">
            <input
              className="devup-input text-sm"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Ex: React, Docker, CSS, carreira..."
            />
          </Field>
          <div className="rounded-2xl bg-slate-950/55 px-4 py-3 text-sm text-slate-400 ring-1 ring-blue-950/70">
            <span className="font-semibold text-white">{filteredResources.length}</span> de {resources.length} referencias
          </div>
        </div>
      </div>

      {message && <p className="rounded-2xl bg-blue-950/50 px-4 py-3 text-sm text-skyGlow">{message}</p>}

      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        {visibleResources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            isSelected={resource.id === selectedResourceId}
            onSelect={() => openResourceEditor(resource.id)}
            onDelete={() => removeResource(resource)}
          />
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="devup-panel p-6 text-sm leading-6 text-slate-400">
          Nenhuma referencia encontrada. Ajuste a busca ou crie uma nova fonte curada.
        </div>
      )}

      {filteredResources.length > pageSize && (
        <div className="flex flex-col gap-3 rounded-2xl bg-slate-950/45 p-4 ring-1 ring-blue-950/70 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-400">
            Pagina <span className="font-semibold text-white">{currentPage}</span> de{" "}
            <span className="font-semibold text-white">{pageCount}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="min-h-10 rounded-full bg-slate-950 px-4 text-xs font-semibold text-slate-300 transition hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`min-h-10 min-w-10 rounded-full px-3 text-xs font-semibold transition ${
                  page === currentPage
                    ? "bg-blue-600 text-white shadow-glow"
                    : "bg-slate-950 text-slate-400 hover:bg-hover hover:text-slate-100"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
              disabled={currentPage === pageCount}
              className="min-h-10 rounded-full bg-slate-950 px-4 text-xs font-semibold text-slate-300 transition hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              Proxima
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-slate-950/55 p-5 ring-1 ring-blue-950/70">
          <p className="text-xs font-normal uppercase tracking-[0.14em] text-slate-500">total</p>
          <p className="mt-2 text-3xl font-semibold text-white">{resources.length}</p>
        </div>
        <div className="rounded-2xl bg-slate-950/55 p-5 ring-1 ring-blue-950/70">
          <p className="text-xs font-normal uppercase tracking-[0.14em] text-slate-500">ativas</p>
          <p className="mt-2 text-3xl font-semibold text-white">{activeCount}</p>
        </div>
        <div className="rounded-2xl bg-slate-950/55 p-5 ring-1 ring-blue-950/70">
          <p className="text-xs font-normal uppercase tracking-[0.14em] text-slate-500">flags</p>
          <p className="mt-2 text-3xl font-semibold text-white">{flags.length}</p>
        </div>
      </div>

      <div className="devup-panel p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-normal uppercase tracking-[0.14em] text-slate-500">organizacao</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Flags de referencia</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Minha sugestao e manter flags curtas e reutilizaveis, como frontend, react, css, devops e entrevistas.
              Depois, ao criar uma referencia, voce apenas seleciona as flags ligadas ao assunto.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const flag = newFlag();
              setFlags((current) => [...current, flag]);
              setSelectedFlagId(flag.id);
            }}
            className="min-h-11 rounded-full bg-slate-950 px-5 text-sm font-semibold text-slate-300 transition hover:bg-hover"
          >
            Nova flag
          </button>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.05fr]">
          <div className="self-start rounded-2xl bg-slate-950/35 p-3 ring-1 ring-blue-950/70">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <p className="text-sm font-semibold text-slate-200">Flags cadastradas</p>
              <span className="rounded-full bg-blue-950/70 px-3 py-1 text-xs font-semibold text-skyGlow ring-1 ring-blue-800/40">
                {flags.length}
              </span>
            </div>
            {flags.length > 0 ? (
              <div className="grid max-h-[24rem] gap-3 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
                {flags.map((flag) => (
                  <FlagMiniCard
                    key={flag.id}
                    flag={flag}
                    isSelected={flag.id === selectedFlag?.id}
                    onClick={() => setSelectedFlagId(flag.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-950/55 p-4 text-sm leading-6 text-slate-400 ring-1 ring-blue-950/70">
                Nenhuma flag cadastrada ainda. Crie uma taxonomia simples para organizar suas fontes.
              </div>
            )}
          </div>

          {selectedFlag ? (
            <div className="rounded-2xl bg-slate-950/50 p-5 ring-1 ring-blue-950/70">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-950 text-sm font-bold text-skyGlow ring-1 ring-blue-800/40">
                  {(getFlagLabel(selectedFlag)[0] ?? "#").toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{getFlagLabel(selectedFlag) || "Nova flag"}</p>
                  <p className="text-xs text-slate-500">Edite nome, chave e contexto da flag selecionada.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nome">
                  <input
                    className="devup-input text-sm"
                    value={selectedFlag.label}
                    onChange={(event) => updateSelectedFlag({ label: event.target.value })}
                  />
                </Field>
                <Field label="Chave">
                  <input
                    className="devup-input text-sm"
                    value={selectedFlag.key}
                    onChange={(event) => updateSelectedFlag({ key: event.target.value })}
                    placeholder="ex: devops"
                  />
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Descricao">
                  <textarea
                    className="devup-input text-sm"
                    rows={3}
                    value={selectedFlag.description ?? ""}
                    onChange={(event) => updateSelectedFlag({ description: event.target.value })}
                  />
                </Field>
              </div>
              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => removeFlag(selectedFlag)}
                  className="min-h-10 rounded-full bg-red-500/10 px-4 text-xs font-semibold text-red-100 transition hover:bg-red-500/20"
                >
                  Remover flag
                </button>
                <button
                  type="button"
                  onClick={() => saveFlag(selectedFlag)}
                  disabled={isSaving}
                  className="devup-button min-h-10 px-4 text-xs font-semibold disabled:cursor-wait disabled:opacity-70"
                >
                  {isSaving ? "Salvando..." : "Salvar flag"}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-950/50 p-4 text-sm text-slate-400 ring-1 ring-blue-950/70">
              Crie uma flag para facilitar a busca das referencias.
            </div>
          )}
        </div>
      </div>

      {isResourceEditorOpen && selectedResource ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/82 px-4 py-6 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Fechar editor"
            className="absolute inset-0 cursor-default"
            onClick={closeResourceEditor}
          />
          <div className="devup-panel relative w-full max-w-5xl overflow-hidden p-0">
            <div className="flex flex-col gap-4 border-b border-blue-950/70 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-normal uppercase tracking-[0.14em] text-slate-500">detalhes da referencia</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {selectedResource.title || "Nova referencia de estudo"}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  Preencha a fonte uma vez e selecione as flags que ajudam a IA a encontra-la no contexto certo.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-blue-950 px-3 py-1 text-xs font-medium text-skyGlow ring-1 ring-blue-800/40">
                  {selectedResource.isActive ? "ativa para IA" : "inativa"}
                </span>
                <button
                  type="button"
                  onClick={closeResourceEditor}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-slate-400 transition hover:bg-hover hover:text-white"
                  aria-label="Fechar"
                >
                  x
                </button>
              </div>
            </div>

            <div className="max-h-[calc(100vh-13rem)] overflow-y-auto p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Titulo">
                  <input
                    className="devup-input text-sm"
                    value={selectedResource.title}
                    onChange={(event) => updateSelectedResource({ title: event.target.value })}
                    placeholder="Ex: Documentacao oficial do React"
                  />
                </Field>
                <Field label="Assunto">
                  <input
                    className="devup-input text-sm"
                    value={selectedResource.subject}
                    onChange={(event) => updateSelectedResource({ subject: event.target.value })}
                    placeholder="Ex: React, DevOps, Portfolio, Entrevistas"
                  />
                </Field>
                <Field label="URL">
                  <input
                    className="devup-input text-sm"
                    value={selectedResource.url}
                    onChange={(event) => updateSelectedResource({ url: event.target.value })}
                    placeholder="https://..."
                  />
                </Field>
                <Field label="Tipo">
                  <select
                    className="devup-input text-sm"
                    value={selectedResource.type}
                    onChange={(event) => updateSelectedResource({ type: event.target.value as RecommendationType })}
                  >
                    {recommendationTypes.map((type) => (
                      <option key={type} value={type}>
                        {typeLabels[type]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Nivel">
                  <select
                    className="devup-input text-sm"
                    value={selectedResource.level}
                    onChange={(event) => updateSelectedResource({ level: event.target.value as ResourceLevel })}
                  >
                    {resourceLevels.map((level) => (
                      <option key={level} value={level}>
                        {levelLabels[level]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Fonte">
                  <input
                    className="devup-input text-sm"
                    value={selectedResource.sourceName ?? ""}
                    onChange={(event) => updateSelectedResource({ sourceName: event.target.value })}
                    placeholder="Ex: MDN, Google, Microsoft Learn"
                  />
                </Field>
                <Field label="Tempo estimado em minutos">
                  <input
                    className="devup-input text-sm"
                    type="number"
                    min={1}
                    value={selectedResource.estimatedMinutes ?? ""}
                    onChange={(event) =>
                      updateSelectedResource({
                        estimatedMinutes: event.target.value ? Number(event.target.value) : null
                      })
                    }
                    placeholder="Ex: 12"
                  />
                </Field>
                <Field label="Prioridade" hint="Use valores maiores para fontes que devem ser priorizadas nas recomendacoes.">
                  <input
                    className="devup-input text-sm"
                    type="number"
                    value={selectedResource.priority}
                    onChange={(event) => updateSelectedResource({ priority: Number(event.target.value) })}
                  />
                </Field>
                <Field label="Status">
                  <select
                    className="devup-input text-sm"
                    value={selectedResource.isActive ? "active" : "inactive"}
                    onChange={(event) => updateSelectedResource({ isActive: event.target.value === "active" })}
                  >
                    <option value="active">Ativa para IA</option>
                    <option value="inactive">Inativa</option>
                  </select>
                </Field>
                <Field label="Uso na trilha">
                  <select
                    className="devup-input text-sm"
                    value={selectedResource.isMainTrack ? "main" : "complementary"}
                    onChange={(event) => updateSelectedResource({ isMainTrack: event.target.value === "main" })}
                  >
                    <option value="complementary">Complementar</option>
                    <option value="main">Trilha principal</option>
                  </select>
                </Field>
                <Field label="Atualizacao">
                  <select
                    className="devup-input text-sm"
                    value={selectedResource.isOutdated ? "outdated" : "current"}
                    onChange={(event) => updateSelectedResource({ isOutdated: event.target.value === "outdated" })}
                  >
                    <option value="current">Atualizada</option>
                    <option value="outdated">Desatualizada</option>
                  </select>
                </Field>
                <Field label="Publicado em">
                  <input
                    className="devup-input text-sm"
                    type="date"
                    value={dateToInputValue(selectedResource.publishedAt)}
                    onChange={(event) => updateSelectedResource({ publishedAt: event.target.value || null })}
                  />
                </Field>
                <Field label="Ultima verificacao">
                  <input
                    className="devup-input text-sm"
                    type="date"
                    value={dateToInputValue(selectedResource.lastCheckedAt)}
                    onChange={(event) => updateSelectedResource({ lastCheckedAt: event.target.value || null })}
                  />
                </Field>
              </div>

              <div className="mt-4 grid gap-4">
                <Field label="Descricao do conteudo">
                  <textarea
                    className="devup-input text-sm"
                    rows={4}
                    value={selectedResource.description}
                    onChange={(event) => updateSelectedResource({ description: event.target.value })}
                    placeholder="Explique quando essa fonte deve ser recomendada e que problema ela resolve."
                  />
                </Field>

                <div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-normal uppercase tracking-[0.14em] text-slate-500">Flags relacionadas</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        Selecione as flags cadastradas que descrevem o assunto desta fonte.
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      {selectedFlagKeys.length} selecionadas
                    </span>
                  </div>

                  {flags.length > 0 ? (
                    <div className="mt-3 grid max-h-72 gap-3 overflow-y-auto rounded-2xl bg-slate-950/45 p-3 ring-1 ring-blue-950/70 sm:grid-cols-2 lg:grid-cols-3">
                      {flags.map((flag) => (
                        <FlagMiniCard
                          key={flag.id}
                          flag={flag}
                          compact
                          isSelected={selectedFlagKeys.includes(flag.key)}
                          onClick={() => toggleSelectedResourceFlag(flag.key)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-2xl bg-slate-950/45 p-4 text-sm leading-6 text-slate-400 ring-1 ring-blue-950/70">
                      Crie suas primeiras flags abaixo para poder marcar as referencias por assunto.
                    </div>
                  )}
                </div>
              </div>

              {message && <p className="mt-4 rounded-2xl bg-blue-950/50 px-4 py-3 text-sm text-skyGlow">{message}</p>}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-blue-950/70 p-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => removeResource(selectedResource)}
                className="min-h-11 rounded-full bg-red-500/10 px-5 text-sm font-semibold text-red-100 transition hover:bg-red-500/20"
              >
                Remover referencia
              </button>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={closeResourceEditor}
                  className="min-h-11 rounded-full bg-slate-950 px-5 text-sm font-semibold text-slate-300 transition hover:bg-hover"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => saveResource(selectedResource)}
                  disabled={isSaving}
                  className="devup-button min-h-11 px-5 text-sm font-semibold disabled:cursor-wait disabled:opacity-70"
                >
                  {isSaving ? "Salvando..." : "Salvar referencia"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
