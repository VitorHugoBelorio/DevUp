import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 text-slate-100">
      <section className="devup-panel w-full max-w-lg p-8 text-center">
        <p className="devup-brand">Dev<span>Up</span></p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[0.01em] text-white">Diagnostico nao encontrado</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          O link pode estar incorreto ou o plano ainda nao foi gerado.
        </p>
        <Link
          href="/"
          className="devup-button mt-6 inline-flex min-h-11 items-center justify-center px-5 text-sm font-semibold"
        >
          Criar novo plano
        </Link>
      </section>
    </main>
  );
}
