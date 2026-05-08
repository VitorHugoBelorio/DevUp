"use client";

import { useState } from "react";

export function AdminLoginForm() {
  const [accessKey, setAccessKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ accessKey })
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(data.message ?? "Nao foi possivel entrar.");
        return;
      }

      window.location.reload();
    } catch {
      setError("Nao foi possivel conectar com o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="devup-panel max-w-xl p-6">
      <label htmlFor="admin-key" className="mb-2 block text-sm font-medium text-slate-200">
        Chave de administrador
      </label>
      <input
        id="admin-key"
        className="devup-input text-sm"
        type="password"
        value={accessKey}
        onChange={(event) => setAccessKey(event.target.value)}
        placeholder="ADMIN_ACCESS_KEY"
      />
      {error && <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="devup-button mt-5 min-h-11 px-5 text-sm font-semibold disabled:cursor-wait disabled:opacity-70"
      >
        {isSubmitting ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
