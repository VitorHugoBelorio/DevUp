"use client";

import { useEffect, useMemo, useState } from "react";
import type { RecommendedResource, ResourceInteractionStatus, ResourceLevel } from "@/types/diagnostic";

type ApiResponse =
  | {
      reason: "OK";
      items: RecommendedResource[];
    }
  | {
      reason: "NO_DIAGNOSTIC";
      items: [];
    };

const levelLabels: Record<ResourceLevel, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediario",
  advanced: "Avancado"
};

function ResourceSkeleton() {
  return (
    <div className="min-h-[18rem] animate-pulse rounded-2xl bg-slate-950/55 p-5 ring-1 ring-blue-950/70">
      <div className="h-4 w-24 rounded-full bg-blue-950/70" />
      <div className="mt-5 h-6 w-3/4 rounded-full bg-slate-800" />
      <div className="mt-4 space-y-2">
        <div className="h-3 rounded-full bg-slate-800" />
        <div className="h-3 w-5/6 rounded-full bg-slate-800" />
      </div>
      <div className="mt-6 h-16 rounded-2xl bg-slate-900" />
    </div>
  );
}

function ResourceCard({
  item,
  onDismiss,
  onOpen,
  onSave
}: {
  item: RecommendedResource;
  onDismiss(resourceId: string): void;
  onOpen(resource: RecommendedResource): void;
  onSave(resourceId: string): void;
}) {
  const isSaved = item.interactionStatus === "SAVED";

  return (
    <article className="flex min-h-[21rem] flex-col rounded-2xl bg-slate-950/55 p-5 ring-1 ring-blue-950/70 transition duration-300 hover:-translate-y-0.5 hover:bg-hover">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-normal uppercase tracking-[0.14em] text-skyGlow">{item.type}</p>
          <h3 className="mt-3 text-lg font-semibold leading-tight text-white">{item.title}</h3>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(item.id)}
          className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-red-500/10 hover:text-red-100"
        >
          Dispensar
        </button>
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">{item.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-blue-950/70 px-2.5 py-1 text-xs font-semibold text-blue-100 ring-1 ring-blue-800/40">
          {levelLabels[item.level]}
        </span>
        {item.estimatedMinutes ? (
          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs text-slate-400">
            {item.estimatedMinutes} min
          </span>
        ) : null}
        {item.sourceName ? (
          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs text-slate-400">{item.sourceName}</span>
        ) : null}
      </div>

      {item.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-full bg-slate-900 px-2.5 py-1 text-xs text-slate-500">
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 rounded-2xl bg-blue-950/25 p-4 ring-1 ring-blue-900/30">
        <p className="text-xs font-normal uppercase tracking-[0.14em] text-skyGlow">Por que apareceu para voce?</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{item.recommendationReason}</p>
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-5 sm:flex-row">
        <button
          type="button"
          onClick={() => onOpen(item)}
          className="devup-button inline-flex min-h-11 flex-1 items-center justify-center px-4 text-sm font-semibold"
        >
          Acessar conteudo
        </button>
        <button
          type="button"
          onClick={() => onSave(item.id)}
          className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-4 text-sm font-semibold transition ${
            isSaved
              ? "bg-emerald-500/12 text-emerald-100 ring-1 ring-emerald-400/25"
              : "bg-slate-950 text-slate-300 ring-1 ring-blue-950/70 hover:bg-hover"
          }`}
        >
          {isSaved ? "Salvo" : "Salvar para depois"}
        </button>
      </div>
    </article>
  );
}

export function RecommendedResourcesSection({ diagnosticId }: { diagnosticId: string }) {
  const [items, setItems] = useState<RecommendedResource[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "unauthorized" | "error">("loading");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadRecommendations() {
      setStatus("loading");

      try {
        const response = await fetch(`/api/dashboard/recommended-resources?diagnosticId=${diagnosticId}&limit=6`);

        if (response.status === 401) {
          if (isMounted) {
            setStatus("unauthorized");
          }
          return;
        }

        const data = (await response.json()) as ApiResponse;

        if (!isMounted) {
          return;
        }

        setItems(data.items);
        setStatus(data.items.length > 0 ? "ready" : "empty");
      } catch {
        if (isMounted) {
          setStatus("error");
        }
      }
    }

    loadRecommendations();

    return () => {
      isMounted = false;
    };
  }, [diagnosticId]);

  const visibleItems = useMemo(() => (showAll ? items : items.slice(0, 3)), [items, showAll]);

  async function updateInteraction(resourceId: string, action: "save" | "dismiss", statusValue: ResourceInteractionStatus) {
    const response = await fetch(`/api/resources/${resourceId}/${action}`, {
      method: "POST"
    });

    if (!response.ok) {
      return;
    }

    if (statusValue === "DISMISSED") {
      setItems((current) => current.filter((item) => item.id !== resourceId));
      return;
    }

    setItems((current) =>
      current.map((item) => (item.id === resourceId ? { ...item, interactionStatus: statusValue } : item))
    );
  }

  async function handleOpen(resource: RecommendedResource) {
    await fetch(`/api/resources/${resource.id}/open`, {
      method: "POST"
    }).catch(() => null);

    window.open(resource.url, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="border-t border-blue-950/70 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-normal uppercase tracking-[0.14em] text-skyGlow">conteudo complementar</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[0.01em] text-white">Vale a pena conferir</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Conteudos extras que combinam com seu perfil. Eles nao substituem sua trilha principal, mas podem ampliar
            sua visao.
          </p>
        </div>
        {items.length > 3 ? (
          <button
            type="button"
            onClick={() => setShowAll((current) => !current)}
            className="min-h-11 rounded-full bg-slate-950 px-5 text-sm font-semibold text-slate-300 ring-1 ring-blue-950/70 transition hover:bg-hover"
          >
            {showAll ? "Ver menos" : "Ver mais recomendacoes"}
          </button>
        ) : null}
      </div>

      {status === "loading" ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <ResourceSkeleton />
          <ResourceSkeleton />
          <ResourceSkeleton />
        </div>
      ) : status === "unauthorized" ? (
        <div className="mt-5 rounded-2xl bg-slate-950/55 p-5 text-sm leading-6 text-slate-400 ring-1 ring-blue-950/70">
          Entre novamente para receber conteudos complementares personalizados.
        </div>
      ) : status === "error" ? (
        <div className="mt-5 rounded-2xl bg-slate-950/55 p-5 text-sm leading-6 text-slate-400 ring-1 ring-blue-950/70">
          Nao foi possivel carregar suas recomendacoes agora.
        </div>
      ) : status === "empty" || visibleItems.length === 0 ? (
        <div className="mt-5 rounded-2xl bg-slate-950/55 p-5 text-sm leading-6 text-slate-400 ring-1 ring-blue-950/70">
          Ainda nao encontramos conteudos complementares para o seu perfil.
        </div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {visibleItems.map((item) => (
            <ResourceCard
              key={item.id}
              item={item}
              onDismiss={(resourceId) => updateInteraction(resourceId, "dismiss", "DISMISSED")}
              onOpen={handleOpen}
              onSave={(resourceId) => updateInteraction(resourceId, "save", "SAVED")}
            />
          ))}
        </div>
      )}
    </section>
  );
}
