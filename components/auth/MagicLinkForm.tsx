"use client";

import { useState } from "react";

type Mode = "login" | "register";

type ApiResponse = {
  message?: string;
  devMagicLink?: string;
};

export function MagicLinkForm({
  initialMode,
  error
}: {
  initialMode: Mode;
  error: string | null;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(error);
  const [devMagicLink, setDevMagicLink] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setDevMagicLink(null);
    setIsSubmitting(true);

    const endpoint = mode === "login" ? "/api/auth/magic-link" : "/api/auth/register";
    const payload = mode === "login" ? { email } : { name, email };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as ApiResponse;

      setMessage(data.message ?? "Verifique seu e-mail para continuar.");

      if (data.devMagicLink) {
        setDevMagicLink(data.devMagicLink);
      }
    } catch {
      setMessage("Nao foi possivel conectar com o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-slate-950/35 p-8 sm:p-10">
      <div className="mb-7">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
          {mode === "login" ? "entrar" : "criar conta"}
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-white">
          {mode === "login" ? "Receber magic link" : "Comecar no DevUp"}
        </h2>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === "register" && (
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Nome</span>
            <input
              className="devup-input text-sm"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Seu nome"
              required
            />
          </label>
        )}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">E-mail</span>
          <input
            className="devup-input text-sm"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@email.com"
            required
          />
        </label>

        {message && (
          <div className="rounded-2xl bg-blue-950/40 p-4 text-sm leading-6 text-slate-300 ring-1 ring-blue-900/40">
            {message}
            {devMagicLink && (
              <a href={devMagicLink} className="mt-3 block break-all text-skyGlow underline decoration-blue-700 underline-offset-4">
                Abrir magic link de desenvolvimento
              </a>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="devup-button min-h-12 w-full px-5 text-sm font-semibold disabled:cursor-wait disabled:opacity-70"
        >
          {isSubmitting ? "Enviando..." : mode === "login" ? "Enviar magic link" : "Criar e verificar e-mail"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-500">
        {mode === "login" ? (
          <button type="button" onClick={() => setMode("register")} className="text-skyGlow transition hover:text-white">
            Ainda nao tenho cadastro
          </button>
        ) : (
          <button type="button" onClick={() => setMode("login")} className="text-skyGlow transition hover:text-white">
            Ja tenho cadastro
          </button>
        )}
      </div>
    </div>
  );
}
