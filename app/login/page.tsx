import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
import { getCurrentUserFromCookies } from "@/lib/services/userAuth";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{
    mode?: string;
    error?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const user = await getCurrentUserFromCookies(cookieStore);

  if (user) {
    redirect(params.next || "/diagnostico");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 text-slate-100 sm:px-6 lg:px-10">
      <div className="w-full max-w-5xl">
        <nav className="mb-6 flex items-center justify-between text-sm lowercase tracking-[0.18em] text-slate-500">
          <Link href="/" className="devup-brand">
            Dev<span>Up</span>
          </Link>
          <span>magic link</span>
        </nav>

        <section className="devup-panel grid overflow-hidden lg:grid-cols-[1fr_0.92fr]">
          <div className="relative min-h-[420px] overflow-hidden bg-blue-950/20 p-8 sm:p-10">
            <div className="login-circuit" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">acesso simples</p>
                <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
                  Entre sem senha. Continue com um link seguro.
                </h1>
                <p className="mt-5 max-w-md text-sm leading-6 text-slate-400">
                  Informe seu e-mail, receba um magic link e volte direto para seu diagnostico. Se ainda nao tiver conta, crie uma em poucos segundos.
                </p>
              </div>

              <div className="mt-10 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                {["E-mail", "Verificacao", "Diagnostico"].map((item, index) => (
                  <div key={item} className="rounded-2xl bg-slate-950/50 p-4">
                    <span className="text-skyGlow">0{index + 1}</span>
                    <p className="mt-2">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <MagicLinkForm
            initialMode={params.mode === "register" ? "register" : "login"}
            error={params.error === "invalid_magic_link" ? "Magic link invalido ou expirado. Solicite um novo link." : null}
          />
        </section>
      </div>
    </main>
  );
}
