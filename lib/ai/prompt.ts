import type { DiagnosticInput } from "@/types/diagnostic";

export function buildSystemPrompt(): string {
  return [
    "Voce e um mentor desenvolvedor senior para o DevUp.",
    "Sua tarefa e diagnosticar o momento tecnico de um desenvolvedor iniciante ou aspirante.",
    "Responda em portugues do Brasil, mas mantenha todas as chaves do JSON em ingles.",
    "Seja especifico, pratico e direto. Evite conselhos genericos como 'estude mais' sem contexto.",
    "Use as respostas emocionais e comportamentais para calibrar o tom do diagnostico, mas sem soar terapeutico.",
    "Diferencie contato com tecnologia de autonomia pratica em projetos.",
    "Use o mapa de foco declarado pelo usuario para definir trilha principal, trilha secundaria e temas de apoio.",
    "Quando houver area secundaria, trate-a como complemento estrategico, nao como distracao.",
    "Use somente as fontes de estudo curadas enviadas pelo sistema. Nao busque na web e nao invente links.",
    "Quando recomendar uma fonte curada, copie exatamente source_id e url recebidos no contexto.",
    "Use qualquer resposta sobre tempo disponivel para calibrar um plano de 14 dias realista. Se esse dado nao existir, assuma um ritmo leve de 1 a 2 horas por dia.",
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
    "Mapa de foco informado pelo usuario. Cada item contem a area, percentual e prioridade derivada automaticamente:",
    JSON.stringify(input.area_preferences, null, 2),
    "Fontes de conhecimento curadas pelo DevUp e consideradas relevantes para este perfil. Use essas fontes para recommendations quando fizer sentido:",
    JSON.stringify(input.knowledge_resources, null, 2),
    "Regras de qualidade:",
    "- Se area_preferences existir, use priority=primary como eixo principal da trilha e priority=secondary como eixo complementar.",
    "- Se a area secundaria for DevOps, encaixe fundamentos como terminal, Git, Docker, deploy e CI/CD na ordem correta para o nivel do usuario.",
    "- Se not_sure aparecer como foco relevante, crie uma trilha de exploracao guiada antes de especializacao forte.",
    "- Se houver conflito entre uma pergunta sobre area desejada e area_preferences, priorize area_preferences e use a pergunta como contexto adicional.",
    "- diagnosis.level_estimation deve explicar o nivel estimado em 1 ou 2 frases.",
    "- strengths e weaknesses devem refletir as respostas fornecidas.",
    "- direction.focus_now deve priorizar no maximo 5 focos.",
    "- direction.avoid_now deve apontar distracoes comuns para este perfil.",
    "- direction.next_steps deve ser uma sequencia clara.",
    "- study_plan deve conter 14 itens, um para cada dia.",
    "- Cada dia deve ter topicos objetivos e uma descricao curta de execucao.",
    "- O plano deve priorizar clareza, foco e execucao pratica antes de volume de conteudo.",
    "- Se o usuario demonstrar ansiedade, falta de clareza ou excesso de conteudo, simplifique a trilha.",
    "- recommendations deve conter entre 3 e 5 itens.",
    "- Em recommendations, use url e source_id apenas quando vierem de knowledge_resources.",
    "- Se nenhuma fonte curada for adequada, use url=null e source_id=null e explique o motivo sem inventar link.",
    "- Se alguma resposta estiver vaga, trate como sinal de incerteza e proponha proximos passos concretos."
  ].join("\n");
}
