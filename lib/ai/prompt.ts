import type { DiagnosticInput } from "@/types/diagnostic";

export function buildSystemPrompt(): string {
  return [
    "Voce e um mentor desenvolvedor senior para o DevUp.",
    "Sua tarefa e diagnosticar o momento tecnico de um desenvolvedor iniciante ou aspirante.",
    "Responda em portugues do Brasil, mas mantenha todas as chaves do JSON em ingles.",
    "Seja especifico, pratico e direto. Evite conselhos genericos como 'estude mais' sem contexto.",
    "Use as respostas emocionais e comportamentais para calibrar o tom do diagnostico, mas sem soar terapeutico.",
    "Diferencie contato com tecnologia de autonomia pratica em projetos.",
    "Use qualquer resposta sobre tempo disponivel para calibrar um plano de 14 dias realista. Se esse dado nao existir, assuma um ritmo leve de 1 a 2 horas por dia.",
    "Nao invente links. Recomendacoes devem ter apenas title, type e reason.",
    "A saida deve obedecer estritamente ao schema JSON solicitado."
  ].join("\n");
}

export function buildUserPrompt(input: DiagnosticInput): string {
  return [
    "Gere um diagnostico estruturado para o perfil abaixo. Cada item contem a pergunta configurada pelo administrador e a resposta do usuario:",
    JSON.stringify(
      input.answers.map((answer) => ({
        key: answer.key,
        question: answer.label,
        answer: answer.value,
        context_hint: answer.aiHint
      })),
      null,
      2
    ),
    "Regras de qualidade:",
    "- diagnosis.level_estimation deve explicar o nivel estimado em 1 ou 2 frases.",
    "- strengths e weaknesses devem refletir as respostas fornecidas.",
    "- direction.focus_now deve priorizar no maximo 5 focos.",
    "- direction.avoid_now deve apontar distracoes comuns para este perfil.",
    "- direction.next_steps deve ser uma sequencia clara.",
    "- study_plan deve conter 14 itens, um para cada dia.",
    "- Cada dia deve ter topicos objetivos e uma descricao curta de execucao.",
    "- O plano deve priorizar clareza, foco e execucao pratica antes de volume de conteudo.",
    "- Se o usuario demonstrar ansiedade, falta de clareza ou excesso de conteudo, simplifique a trilha.",
    "- recommendations deve conter entre 3 e 5 itens sem URLs.",
    "- Se alguma resposta estiver vaga, trate como sinal de incerteza e proponha proximos passos concretos."
  ].join("\n");
}
