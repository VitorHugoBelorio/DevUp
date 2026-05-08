import Link from "next/link";

export const dynamic = "force-dynamic";

const welcomeMessages = [
  "Preparado para direcionar sua carreira?",
  "Seu proximo passo pode ficar mais claro hoje.",
  "Menos duvida, mais foco no que importa.",
  "Transforme estudo solto em plano de evolucao.",
  "Voce nao precisa descobrir tudo sozinho."
];

const features = [
  {
    title: "Diagnostico estruturado",
    description: "Responda perguntas guiadas e transforme seu momento atual em uma leitura clara."
  },
  {
    title: "Direcao personalizada",
    description: "Receba foco, proximos passos e alertas sobre o que pode te travar agora."
  },
  {
    title: "Plano acionavel",
    description: "Saia com um plano de estudos objetivo, exportavel e pensado para sua rotina."
  }
];

const storyPoints = [
  "Eu tambem ja estive no inicio da jornada, como dev JR, sem saber exatamente o que estudar.",
  "Tambem senti aquela duvida sobre qual area seguir e em qual tecnologia valia a pena focar.",
  "Com o avanco da IA, essa inseguranca ficou ainda mais comum: muitos devs sentem medo de ficar para tras.",
  "O DevUp nasceu para transformar essa confusao em um diagnostico claro, uma direcao e proximos passos praticos.",
  "Ele nao substitui uma mentoria com devs mais experientes. Se voce tem acesso a bons mentores, faca mentoria.",
  "A ideia e apoiar quem precisa de direcao, mas ainda nao consegue ter acesso a devs com mais bagagem para orientar de perto."
];

function TechAnimation() {
  return (
    <div className="tech-stage" aria-hidden="true">
      <div className="tech-frame">
        <div className="tech-line tech-line-a" />
        <div className="tech-line tech-line-b" />
        <div className="tech-line tech-line-c" />
        <div className="tech-node tech-node-a" />
        <div className="tech-node tech-node-b" />
        <div className="tech-node tech-node-c" />
        <div className="code-chip code-chip-a">const focus = true</div>
        <div className="code-chip code-chip-b">career.map(next)</div>
        <div className="code-chip code-chip-c">AI + roadmap</div>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  const message = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col">
        <nav className="flex items-center justify-between py-4 text-base lowercase tracking-[0.18em] text-slate-500">
          <span className="devup-brand">
            Dev<span>Up</span>
          </span>
          <div className="flex items-center gap-5 text-sm font-medium sm:text-base">
            <Link href="/login" className="transition hover:text-slate-200">
              entrar
            </Link>
            <Link href="/login?mode=register" className="rounded-full bg-blue-950 px-5 py-2.5 text-skyGlow ring-1 ring-blue-800/40 transition hover:bg-hover">
              cadastrar
            </Link>
          </div>
        </nav>

        <section className="flex flex-1 flex-col items-center justify-center gap-10 py-10 text-center">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs font-normal uppercase tracking-[0.18em] text-slate-500">mentor inteligente para devs iniciantes</p>
            <h1 className="mx-auto mt-5 max-w-4xl text-[clamp(3.4rem,9vw,7.5rem)] font-semibold leading-[0.92] tracking-[-0.03em] text-white">
              Fala dev, seja bem vindo.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl leading-8 text-skyGlow">{message}</p>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-400">
              O DevUp existe para quem se sente perdido na programacao, sem saber o que estudar, em qual ordem evoluir ou para qual area da tecnologia apontar sua energia.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/login" className="devup-button inline-flex min-h-12 items-center justify-center px-6 text-sm font-semibold">
                Comecar agora
              </Link>
              <Link
                href="#proposta"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-semibold text-slate-300 transition hover:bg-hover hover:text-white"
              >
                Conhecer proposta
              </Link>
            </div>
          </div>

          <div className="w-full max-w-4xl">
            <TechAnimation />
          </div>
        </section>

        <section id="proposta" className="scroll-mt-8 grid gap-5 pb-10 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="devup-panel devup-proposal-card p-7">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-500">por que isso existe</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-white">
              O DevUp nasceu de uma dor real.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-400">
              Eu comecei a desenvolver este sistema a partir de uma dor que tambem vivi como desenvolvedor junior:
              me sentir perdido, estudar muita coisa ao mesmo tempo e nao saber qual caminho seguir dentro da tecnologia.
            </p>
            <p className="mt-4 text-base leading-8 text-slate-400">
              A proposta nao e vender curso nem empilhar conteudo. E ajudar voce a entender seu momento, enxergar lacunas e transformar ansiedade em direcao pratica.
            </p>
            <p className="mt-4 text-base leading-8 text-slate-400">
              O DevUp tambem nao existe para substituir mentores humanos. Pelo contrario: se voce puder conversar com devs mais experientes, faca isso. O sistema existe para ser uma ponte de clareza para quem ainda nao tem esse acesso.
            </p>
          </article>

          <div className="grid gap-3">
            {storyPoints.map((point, index) => (
              <article
                key={point}
                className="devup-proposal-card rounded-2xl bg-slate-950/55 p-5 ring-1 ring-blue-950/70"
                style={{ animationDelay: `${index * 600}ms` }}
              >
                <span className="text-sm font-semibold text-skyGlow">0{index + 1}</span>
                <p className="mt-2 text-base leading-7 text-slate-300">{point}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 pb-10 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="devup-panel devup-proposal-card p-6">
              <p className="text-base font-semibold text-white">{feature.title}</p>
              <p className="mt-3 text-base leading-7 text-slate-400">{feature.description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
