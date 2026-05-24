"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminKnowledgeManager } from "@/components/admin/AdminKnowledgeManager";
import { AdminQuestionsManager } from "@/components/admin/AdminQuestionsManager";
import { AdminUsersManager } from "@/components/admin/AdminUsersManager";
import type { AccessDashboardReport } from "@/types/access";
import type { DiagnosticFormWithQuestions, KnowledgeFlag, KnowledgeResource } from "@/types/diagnostic";

type AdminTab = "forms" | "knowledge" | "users";

const navigationItems: Array<{
  value: AdminTab;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: "forms",
    label: "Formularios",
    description: "Perguntas e versoes",
    icon: "F"
  },
  {
    value: "knowledge",
    label: "Fontes curadas",
    description: "Referencias seguras",
    icon: "R"
  },
  {
    value: "users",
    label: "Usuarios e acessos",
    description: "Relatorios e permissoes",
    icon: "U"
  }
];

export function AdminRootWorkspace({
  initialAccessReport,
  initialFlags,
  initialForms,
  initialResources
}: {
  initialAccessReport: AccessDashboardReport;
  initialFlags: KnowledgeFlag[];
  initialForms: DiagnosticFormWithQuestions[];
  initialResources: KnowledgeResource[];
}) {
  const [tab, setTab] = useState<AdminTab>("forms");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const activeItem = navigationItems.find((item) => item.value === tab) ?? navigationItems[0];
  const showSidebarText = isSidebarExpanded || isMobileSidebarOpen;

  async function handleLogout() {
    await Promise.allSettled([
      fetch("/api/admin/logout", { method: "POST" }),
      fetch("/api/auth/logout", { method: "POST" })
    ]);

    window.location.href = "/";
  }

  function handleMenuToggle() {
    setIsSidebarExpanded((current) => !current);
    setIsMobileSidebarOpen((current) => !current);
  }

  return (
    <div className="min-h-screen lg:flex">
      {isMobileSidebarOpen ? (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen flex-col border-r border-blue-950/70 bg-slate-950/95 shadow-2xl shadow-black/40 transition-all duration-300 lg:translate-x-0 ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${isSidebarExpanded ? "w-72" : "w-72 lg:w-24"}`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-blue-950/70 px-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600/15 text-lg font-black text-skyGlow ring-1 ring-blue-500/30">
              D
            </span>
            {showSidebarText ? (
              <span className="devup-brand truncate">
                Dev<span>Up</span>
              </span>
            ) : null}
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className={`mb-3 px-3 text-sm font-semibold text-slate-500 ${showSidebarText ? "" : "sr-only"}`}>
            Admin
          </p>

          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = item.value === tab;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setTab(item.value);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`group flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 text-left transition duration-300 ${
                    isActive
                      ? "bg-blue-600/20 text-white ring-1 ring-blue-500/35"
                      : "text-slate-400 hover:bg-hover hover:text-slate-100"
                  } ${showSidebarText ? "" : "justify-center"}`}
                  title={showSidebarText ? undefined : item.label}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ring-1 transition ${
                      isActive
                        ? "bg-blue-600 text-white ring-blue-400/40 shadow-glow"
                        : "bg-slate-900 text-skyGlow ring-blue-950/70 group-hover:bg-blue-950"
                    }`}
                  >
                    {item.icon}
                  </span>
                  {showSidebarText ? (
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">{item.description}</span>
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-blue-950/70 px-5 py-4">
          {showSidebarText ? (
            <p className="text-xs leading-5 text-slate-600">Painel de configuracao do DevUp.</p>
          ) : (
            <div className="mx-auto h-1.5 w-8 rounded-full bg-blue-950" />
          )}
        </div>
      </aside>

      <div className={`min-w-0 flex-1 transition-[padding] duration-300 ${isSidebarExpanded ? "lg:pl-72" : "lg:pl-24"}`}>
        <header className="sticky top-0 z-20 border-b border-blue-950/60 bg-slate-950/72 px-4 backdrop-blur-xl sm:px-5 lg:px-6">
          <div className="flex h-20 w-full items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleMenuToggle}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-xl text-slate-300 ring-1 ring-blue-950/70 transition hover:bg-hover hover:text-white"
                aria-label="Alternar menu lateral"
              >
                <span className="flex w-5 flex-col gap-1.5">
                  <span className="h-0.5 rounded-full bg-current" />
                  <span className="h-0.5 rounded-full bg-current" />
                  <span className="h-0.5 rounded-full bg-current" />
                </span>
              </button>
              <div>
                <p className="text-sm font-semibold text-slate-100">{activeItem.label}</p>
                <p className="text-sm text-slate-400">{activeItem.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-blue-950/55 px-4 py-2 text-sm font-semibold text-blue-100 ring-1 ring-blue-800/40">
                Administrador
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="min-h-10 rounded-full bg-red-500/10 px-4 text-sm font-semibold text-red-100 ring-1 ring-red-400/15 transition hover:bg-red-500/18"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-8 sm:px-5 lg:px-6">
          <div className="w-full max-w-[90rem]">
            <section className="mb-8">
              <p className="text-sm font-semibold text-slate-500">Acesso root</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight tracking-[0.01em] text-white sm:text-5xl">
                Controle do diagnostico
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
                Configure formularios, perguntas e fontes seguras de estudo sem alterar o codigo do fluxo publico.
              </p>
            </section>

            {tab === "forms" ? (
              <AdminQuestionsManager initialForms={initialForms} />
            ) : tab === "knowledge" ? (
              <AdminKnowledgeManager initialFlags={initialFlags} initialResources={initialResources} />
            ) : (
              <AdminUsersManager initialReport={initialAccessReport} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
