"use client";

import { useMemo, useState } from "react";
import type { AccessDashboardReport, AccessEventType, AccessUserOverview, AccessUserRole, AccessUserStatus } from "@/types/access";

const eventLabels: Record<AccessEventType, string> = {
  MAGIC_LINK_REQUESTED: "Magic link solicitado",
  MAGIC_LINK_SENT: "Magic link enviado",
  LOGIN_SUCCESS: "Login realizado",
  LOGIN_BLOCKED: "Login bloqueado",
  LOGOUT: "Logout",
  ADMIN_UPDATED_USER: "Usuario atualizado"
};

function formatDate(value: string | null): string {
  if (!value) {
    return "Nunca";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-950/55 p-5 ring-1 ring-blue-950/70">
      <p className="text-xs font-normal uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function UserStatusBadge({ status }: { status: AccessUserStatus }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
        status === "ACTIVE"
          ? "bg-emerald-500/10 text-emerald-200 ring-emerald-400/25"
          : "bg-red-500/10 text-red-100 ring-red-400/25"
      }`}
    >
      {status === "ACTIVE" ? "ATIVO" : "BLOQUEADO"}
    </span>
  );
}

export function AdminUsersManager({ initialReport }: { initialReport: AccessDashboardReport }) {
  const [report, setReport] = useState(initialReport);
  const [selectedUserId, setSelectedUserId] = useState(initialReport.users[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedUser = useMemo(
    () => report.users.find((user) => user.id === selectedUserId) ?? report.users[0] ?? null,
    [report.users, selectedUserId]
  );

  async function updateUser(user: AccessUserOverview, patch: Partial<Pick<AccessUserOverview, "name" | "role" | "status">>) {
    setIsSaving(true);
    setMessage(null);

    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: patch.name ?? user.name,
        role: patch.role ?? user.role,
        status: patch.status ?? user.status
      })
    });
    const data = (await response.json()) as { user?: AccessUserOverview; message?: string };

    setIsSaving(false);

    if (!response.ok || !data.user) {
      setMessage(data.message ?? "Nao foi possivel atualizar o usuario.");
      return;
    }

    setReport((current) => ({
      ...current,
      summary: {
        ...current.summary,
        admins:
          current.summary.admins +
          (data.user!.role === "ADMIN" && user.role !== "ADMIN" ? 1 : 0) -
          (data.user!.role !== "ADMIN" && user.role === "ADMIN" ? 1 : 0),
        blockedUsers:
          current.summary.blockedUsers +
          (data.user!.status === "BLOCKED" && user.status !== "BLOCKED" ? 1 : 0) -
          (data.user!.status !== "BLOCKED" && user.status === "BLOCKED" ? 1 : 0)
      },
      users: current.users.map((item) => (item.id === user.id ? data.user! : item))
    }));
    setSelectedUserId(data.user.id);
    setMessage("Usuario atualizado.");
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-slate-950/45 p-5 ring-1 ring-blue-950/70">
        <p className="text-xs font-normal uppercase tracking-[0.16em] text-skyGlow">controle de acesso</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[0.01em] text-white">Usuarios e relatorios</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Acompanhe acesso, sessoes, diagnosticos, magic links e altere permissoes dos usuarios do DevUp.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="usuarios" value={report.summary.totalUsers} />
        <StatCard label="admins" value={report.summary.admins} />
        <StatCard label="bloqueados" value={report.summary.blockedUsers} />
        <StatCard label="verificados" value={report.summary.verifiedUsers} />
        <StatCard label="sessoes ativas" value={report.summary.activeSessions} />
        <StatCard label="logins 7 dias" value={report.summary.loginsLast7Days} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="devup-panel p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">Usuarios</h3>
            <span className="text-xs text-slate-500">{report.users.length} cadastrados</span>
          </div>
          <div className="mt-4 grid gap-3">
            {report.users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  setSelectedUserId(user.id);
                  setMessage(null);
                }}
                className={`rounded-2xl p-4 text-left transition duration-300 ${
                  user.id === selectedUser?.id
                    ? "bg-cyanGlow text-white shadow-glow"
                    : "bg-slate-950/60 text-slate-300 hover:bg-hover"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{user.name || user.email}</p>
                    <p className={user.id === selectedUser?.id ? "text-blue-100" : "text-slate-500"}>{user.email}</p>
                  </div>
                  <UserStatusBadge status={user.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-blue-950 px-2.5 py-1 text-skyGlow">{user.role}</span>
                  <span className="rounded-full bg-slate-900 px-2.5 py-1 text-slate-400">
                    {user.diagnosticsCount} diagnosticos
                  </span>
                  <span className="rounded-full bg-slate-900 px-2.5 py-1 text-slate-400">
                    ultimo login: {formatDate(user.lastLoginAt)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedUser ? (
          <div className="devup-panel p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-normal uppercase tracking-[0.14em] text-slate-500">usuario selecionado</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{selectedUser.name || selectedUser.email}</h3>
                <p className="mt-2 text-sm text-slate-400">{selectedUser.email}</p>
              </div>
              <UserStatusBadge status={selectedUser.status} />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-normal uppercase tracking-[0.14em] text-slate-500">Nome</span>
                <input
                  className="devup-input text-sm"
                  value={selectedUser.name ?? ""}
                  onChange={(event) =>
                    setReport((current) => ({
                      ...current,
                      users: current.users.map((user) =>
                        user.id === selectedUser.id ? { ...user, name: event.target.value } : user
                      )
                    }))
                  }
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-normal uppercase tracking-[0.14em] text-slate-500">Role</span>
                <select
                  className="devup-input text-sm"
                  value={selectedUser.role}
                  onChange={(event) => updateUser(selectedUser, { role: event.target.value as AccessUserRole })}
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-normal uppercase tracking-[0.14em] text-slate-500">Status</span>
                <select
                  className="devup-input text-sm"
                  value={selectedUser.status}
                  onChange={(event) => updateUser(selectedUser, { status: event.target.value as AccessUserStatus })}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="BLOCKED">BLOCKED</option>
                </select>
              </label>
              <div className="rounded-2xl bg-slate-950/55 p-4">
                <p className="text-xs font-normal uppercase tracking-[0.14em] text-slate-500">Verificacao</p>
                <p className="mt-2 text-sm text-slate-300">{formatDate(selectedUser.emailVerifiedAt)}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <StatCard label="sessoes" value={selectedUser.activeSessions} />
              <StatCard label="diagnosticos" value={selectedUser.diagnosticsCount} />
              <StatCard label="eventos" value={selectedUser.accessEventsCount} />
            </div>

            {message && <p className="mt-4 rounded-2xl bg-blue-950/50 px-4 py-3 text-sm text-skyGlow">{message}</p>}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => updateUser(selectedUser, { name: selectedUser.name })}
                disabled={isSaving}
                className="devup-button min-h-11 px-5 text-sm font-semibold disabled:cursor-wait disabled:opacity-70"
              >
                {isSaving ? "Salvando..." : "Salvar nome"}
              </button>
            </div>
          </div>
        ) : (
          <div className="devup-panel p-6 text-sm text-slate-400">Nenhum usuario cadastrado ainda.</div>
        )}
      </div>

      <div className="devup-panel p-5">
        <h3 className="text-lg font-semibold text-white">Eventos recentes</h3>
        <div className="mt-4 grid gap-3">
          {report.recentEvents.map((event) => (
            <div key={event.id} className="rounded-2xl bg-slate-950/55 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{eventLabels[event.type]}</p>
                  <p className="mt-1 text-xs text-slate-500">{event.email ?? event.userName ?? "sem usuario"}</p>
                </div>
                <span className="text-xs text-slate-500">{formatDate(event.createdAt)}</span>
              </div>
            </div>
          ))}
          {report.recentEvents.length === 0 && (
            <p className="rounded-2xl bg-slate-950/55 p-4 text-sm text-slate-400">
              Nenhum evento de acesso registrado ainda.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
