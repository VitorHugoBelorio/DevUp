"use client";

export function LogoutButton() {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="rounded-full bg-slate-950 px-4 py-2 text-xs font-medium text-slate-400 transition hover:bg-hover hover:text-slate-200"
    >
      sair
    </button>
  );
}
