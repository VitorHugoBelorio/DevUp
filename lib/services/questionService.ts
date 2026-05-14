import { prisma } from "@/lib/prisma";
import { diagnosticQuestionSchema, parseQuestionOptions, questionOptionSchema } from "@/lib/services/diagnosticSchemas";
import type {
  DiagnosticFormConfig,
  DiagnosticFormWithQuestions,
  DiagnosticQuestion,
  QuestionOption,
  QuestionType
} from "@/types/diagnostic";
import { normalizeText, toQuestionKey, uniqueStable } from "@/lib/utils/text";

export const defaultDiagnosticFormId = "default-diagnostic-form";
export const defaultDiagnosticFormSlug = "devup-diagnostic";

export const defaultDiagnosticForm: DiagnosticFormConfig = {
  id: defaultDiagnosticFormId,
  slug: defaultDiagnosticFormSlug,
  name: "Diagnostico DevUp",
  description: "Formulario principal para diagnostico, direcionamento e plano de estudos.",
  isActive: true,
  isArchived: false
};

type FormRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isArchived: boolean;
};

type QuestionRecord = {
  id: string;
  formId: string;
  key: string;
  label: string;
  description: string | null;
  placeholder: string | null;
  type: QuestionType;
  required: boolean;
  options: unknown;
  step: string;
  order: number;
  aiHint: string | null;
  isActive: boolean;
};

export type QuestionUpsertPayload = {
  id?: string;
  formId?: string;
  key: string;
  label: string;
  description?: string | null;
  placeholder?: string | null;
  type: QuestionType;
  required: boolean;
  options?: QuestionOption[];
  step: string;
  order: number;
  aiHint?: string | null;
  isActive: boolean;
};

type QuestionTemplate = Omit<DiagnosticQuestion, "formId">;

const defaultQuestionTemplates: QuestionTemplate[] = [
  {
    id: "target_area",
    key: "target_area",
    label: "Qual area mais chama sua atencao hoje?",
    description: "Nao precisa ter certeza absoluta. A ideia e entender para onde sua curiosidade aponta agora.",
    placeholder: null,
    type: "single_select",
    required: true,
    options: [
      { label: "Frontend", value: "frontend" },
      { label: "Backend", value: "backend" },
      { label: "Fullstack", value: "fullstack" },
      { label: "Mobile", value: "mobile" },
      { label: "Dados", value: "data" },
      { label: "IA / Machine Learning", value: "ai_ml" },
      { label: "DevOps", value: "devops" },
      { label: "QA / Testes", value: "qa" },
      { label: "Cyberseguranca", value: "cybersecurity" },
      { label: "Ainda nao sei", value: "not_sure" }
    ],
    step: "Seu momento",
    order: 10,
    aiHint: "Use para orientar a trilha principal, mas nao force uma especializacao se o usuario ainda estiver indeciso.",
    isActive: true
  },
  {
    id: "study_time",
    key: "study_time",
    label: "Ha quanto tempo voce estuda programacao?",
    description: "Considere estudos, pratica, faculdade, bootcamp ou projetos pessoais.",
    placeholder: null,
    type: "single_select",
    required: true,
    options: [
      { label: "Menos de 3 meses", value: "less_than_3_months" },
      { label: "3 a 6 meses", value: "3_to_6_months" },
      { label: "6 meses a 1 ano", value: "6_to_12_months" },
      { label: "1 a 2 anos", value: "1_to_2_years" },
      { label: "Mais de 2 anos", value: "more_than_2_years" }
    ],
    step: "Seu momento",
    order: 20,
    aiHint: "Calibre profundidade, vocabulario e exigencia do plano conforme o tempo de estudo.",
    isActive: true
  },
  {
    id: "work_status",
    key: "work_status",
    label: "Hoje voce ja trabalha com tecnologia?",
    description: "Isso ajuda a ajustar o plano para vaga, rotina ou evolucao profissional.",
    placeholder: null,
    type: "single_select",
    required: true,
    options: [
      { label: "Ainda nao trabalho com tecnologia", value: "not_in_tech" },
      { label: "Sou estagiario", value: "intern" },
      { label: "Sou junior", value: "junior" },
      { label: "Trabalho em outra area de tecnologia", value: "other_tech_area" },
      { label: "Trabalho fora da tecnologia", value: "outside_tech" }
    ],
    step: "Seu momento",
    order: 30,
    aiHint: "Use para diferenciar plano de entrada no mercado, transicao ou evolucao dentro da area.",
    isActive: true
  },
  {
    id: "current_feeling",
    key: "current_feeling",
    label: "Qual frase mais parece com voce hoje?",
    description: "Essa resposta ajuda o DevUp a entender sua dor central, nao so sua stack.",
    placeholder: null,
    type: "single_select",
    required: true,
    options: [
      { label: "Nao sei por onde continuar", value: "dont_know_next" },
      { label: "Estudo muito e evoluo pouco", value: "study_without_progress" },
      { label: "Tenho ideias, mas nao termino projetos", value: "dont_finish_projects" },
      { label: "Quero minha primeira vaga", value: "want_first_job" },
      { label: "Quero organizar minha rotina", value: "need_routine" },
      { label: "Quero trocar de area", value: "want_transition" }
    ],
    step: "Seu momento",
    order: 40,
    aiHint: "Use como principal sinal emocional para tom, priorizacao e aconselhamento.",
    isActive: true
  },
  {
    id: "main_goal",
    key: "main_goal",
    label: "Qual resultado voce quer alcancar agora?",
    description: "Escolha o objetivo que mais faria voce sentir que esta evoluindo de verdade.",
    placeholder: null,
    type: "single_select",
    required: true,
    options: [
      { label: "Conseguir minha primeira vaga", value: "first_job" },
      { label: "Criar projetos melhores para portfolio", value: "better_portfolio" },
      { label: "Evoluir na stack que ja estudo", value: "improve_current_stack" },
      { label: "Descobrir qual caminho seguir", value: "find_path" },
      { label: "Voltar a estudar com consistencia", value: "return_with_consistency" },
      { label: "Migrar para outra area tech", value: "transition_area" },
      { label: "Me preparar para entrevistas", value: "interviews" }
    ],
    step: "Objetivo",
    order: 50,
    aiHint: "Use como criterio principal de sucesso do plano.",
    isActive: true
  },
  {
    id: "progress_horizon",
    key: "progress_horizon",
    label: "Em quanto tempo voce gostaria de sentir evolucao real?",
    description: "Nao e promessa de resultado. E um horizonte para calibrar foco e ritmo.",
    placeholder: null,
    type: "single_select",
    required: true,
    options: [
      { label: "30 dias", value: "30_days" },
      { label: "3 meses", value: "3_months" },
      { label: "6 meses", value: "6_months" },
      { label: "Sem prazo definido", value: "no_deadline" }
    ],
    step: "Objetivo",
    order: 60,
    aiHint: "Use para calibrar intensidade, granularidade e expectativas do plano.",
    isActive: true
  },
  {
    id: "known_technologies",
    key: "known_technologies",
    label: "Quais tecnologias voce ja teve contato?",
    description: "Marque o que voce conhece, mesmo que ainda esteja no comeco.",
    placeholder: null,
    type: "multi_select",
    required: true,
    options: [
      { label: "HTML", value: "html" },
      { label: "CSS", value: "css" },
      { label: "JavaScript", value: "javascript" },
      { label: "TypeScript", value: "typescript" },
      { label: "React", value: "react" },
      { label: "Next.js", value: "nextjs" },
      { label: "Node.js", value: "nodejs" },
      { label: "C#", value: "csharp" },
      { label: "Java", value: "java" },
      { label: "Python", value: "python" },
      { label: "Laravel", value: "laravel" },
      { label: "PostgreSQL", value: "postgresql" },
      { label: "Docker", value: "docker" },
      { label: "Git/GitHub", value: "git_github" },
      { label: "AWS", value: "aws" },
      { label: "Ainda estou comecando", value: "just_starting" }
    ],
    step: "Base tecnica",
    order: 70,
    aiHint: "Mapeie repertorio tecnico inicial sem superestimar profundidade.",
    isActive: true
  },
  {
    id: "practical_technologies",
    key: "practical_technologies",
    label: "Quais dessas voce consegue usar em um projeto sem copiar tudo?",
    description: "Aqui vale ser honesto. Essa pergunta melhora muito o diagnostico.",
    placeholder: null,
    type: "multi_select",
    required: false,
    options: [
      { label: "HTML", value: "html" },
      { label: "CSS", value: "css" },
      { label: "JavaScript", value: "javascript" },
      { label: "TypeScript", value: "typescript" },
      { label: "React", value: "react" },
      { label: "Next.js", value: "nextjs" },
      { label: "Node.js", value: "nodejs" },
      { label: "C#", value: "csharp" },
      { label: "Java", value: "java" },
      { label: "Python", value: "python" },
      { label: "PostgreSQL", value: "postgresql" },
      { label: "Docker", value: "docker" },
      { label: "Git/GitHub", value: "git_github" },
      { label: "Nenhuma ainda", value: "none_yet" }
    ],
    step: "Base tecnica",
    order: 80,
    aiHint: "Compare contato versus capacidade pratica para identificar lacunas reais.",
    isActive: true
  },
  {
    id: "technology_to_master",
    key: "technology_to_master",
    label: "Qual tecnologia ou tema voce mais quer dominar agora?",
    description: "Se nao souber, escreva algo como 'ainda nao sei'.",
    placeholder: "Ex: JavaScript, React, backend, logica, banco de dados",
    type: "short_text",
    required: true,
    options: [],
    step: "Base tecnica",
    order: 90,
    aiHint: "Use para conectar desejo do usuario com prioridades realistas.",
    isActive: true
  },
  {
    id: "project_experience",
    key: "project_experience",
    label: "Voce ja construiu projetos proprios?",
    description: "Pense em projetos fora de aulas copiadas passo a passo.",
    placeholder: null,
    type: "single_select",
    required: true,
    options: [
      { label: "Nao ainda", value: "none" },
      { label: "Exercicios pequenos", value: "small_exercises" },
      { label: "Projetos simples", value: "simple_projects" },
      { label: "Projetos completos", value: "complete_projects" },
      { label: "Projetos reais ou para clientes", value: "real_projects" }
    ],
    step: "Base tecnica",
    order: 100,
    aiHint: "Use para avaliar autonomia, portfolio e maturidade pratica.",
    isActive: true
  },
  {
    id: "most_complex_project",
    key: "most_complex_project",
    label: "Qual foi o projeto mais completo que voce ja tentou construir?",
    description: "Opcional, mas ajuda a IA a entender seu nivel real de pratica.",
    placeholder: "Ex: uma landing page, um CRUD, um app de tarefas, um bot, uma API...",
    type: "long_text",
    required: false,
    options: [],
    step: "Base tecnica",
    order: 110,
    aiHint: "Use como evidencia concreta de experiencia pratica.",
    isActive: true
  },
  {
    id: "technical_gaps",
    key: "technical_gaps",
    label: "Onde voce mais trava tecnicamente hoje?",
    description: "Marque tudo que aparece com frequencia nos seus estudos.",
    placeholder: null,
    type: "multi_select",
    required: true,
    options: [
      { label: "Logica de programacao", value: "logic" },
      { label: "Linguagem base", value: "base_language" },
      { label: "Frontend", value: "frontend" },
      { label: "Backend", value: "backend" },
      { label: "Banco de dados", value: "database" },
      { label: "Git/GitHub", value: "git_github" },
      { label: "Deploy", value: "deploy" },
      { label: "Arquitetura", value: "architecture" },
      { label: "Organizar projetos", value: "project_organization" },
      { label: "Criar portfolio", value: "portfolio" },
      { label: "Entrevistas", value: "interviews" },
      { label: "Saber o que estudar", value: "what_to_study" },
      { label: "Manter consistencia", value: "consistency" }
    ],
    step: "Lacunas e bloqueios",
    order: 120,
    aiHint: "Use para definir fraquezas, prioridades e pontos de bloqueio tecnico.",
    isActive: true
  },
  {
    id: "main_blockers",
    key: "main_blockers",
    label: "O que mais atrapalha sua evolucao?",
    description: "Isso ajuda o plano a ser realista, nao apenas tecnicamente correto.",
    placeholder: null,
    type: "multi_select",
    required: true,
    options: [
      { label: "Falta de clareza", value: "lack_of_clarity" },
      { label: "Pouco tempo", value: "low_time" },
      { label: "Excesso de conteudo", value: "too_much_content" },
      { label: "Comparacao com outros devs", value: "comparison" },
      { label: "Ansiedade", value: "anxiety" },
      { label: "Procrastinacao", value: "procrastination" },
      { label: "Falta de rotina", value: "lack_of_routine" },
      { label: "Medo de nao conseguir vaga", value: "fear_no_job" }
    ],
    step: "Lacunas e bloqueios",
    order: 130,
    aiHint: "Use para ajustar tom, expectativas e recomendacoes praticas.",
    isActive: true
  },
  {
    id: "learning_preference",
    key: "learning_preference",
    label: "Como voce costuma aprender melhor?",
    description: "O plano sera mais util se respeitar seu jeito de estudar.",
    placeholder: null,
    type: "single_select",
    required: true,
    options: [
      { label: "Construindo projetos", value: "projects" },
      { label: "Seguindo aulas", value: "classes" },
      { label: "Lendo documentacao", value: "docs" },
      { label: "Misturando teoria e pratica", value: "mixed" },
      { label: "Ainda nao descobri", value: "not_sure" }
    ],
    step: "Lacunas e bloqueios",
    order: 140,
    aiHint: "Use para adaptar formato das atividades e recomendacoes.",
    isActive: true
  },
  {
    id: "daily_study_time",
    key: "daily_study_time",
    label: "Quanto tempo real voce consegue estudar por dia?",
    description: "Melhor ser realista do que prometer uma rotina impossivel.",
    placeholder: null,
    type: "single_select",
    required: true,
    options: [
      { label: "30 minutos", value: "30_min" },
      { label: "1 hora", value: "1_hour" },
      { label: "2 horas", value: "2_hours" },
      { label: "3 horas", value: "3_hours" },
      { label: "4 horas ou mais", value: "4_plus_hours" }
    ],
    step: "Rotina e clareza",
    order: 150,
    aiHint: "Use para calibrar carga diaria do plano de estudos.",
    isActive: true
  },
  {
    id: "study_days_per_week",
    key: "study_days_per_week",
    label: "Quantos dias por semana voce consegue manter?",
    description: "Consistencia vale mais que intensidade por poucos dias.",
    placeholder: null,
    type: "single_select",
    required: true,
    options: [
      { label: "2 dias", value: "2_days" },
      { label: "3 dias", value: "3_days" },
      { label: "4 dias", value: "4_days" },
      { label: "5 dias", value: "5_days" },
      { label: "6 dias", value: "6_days" },
      { label: "Todos os dias", value: "7_days" }
    ],
    step: "Rotina e clareza",
    order: 160,
    aiHint: "Use para distribuir atividades em uma rotina sustentavel.",
    isActive: true
  },
  {
    id: "clarity_score",
    key: "clarity_score",
    label: "Hoje, sua clareza sobre o que estudar esta em qual nivel?",
    description: "1 significa totalmente perdido. 10 significa muito claro.",
    placeholder: null,
    type: "scale",
    required: true,
    options: [],
    step: "Rotina e clareza",
    order: 170,
    aiHint: "Use para medir o grau de direcao percebida e reforcar clareza no diagnostico.",
    isActive: true
  },
  {
    id: "confidence_score",
    key: "confidence_score",
    label: "Sua confianca para evoluir nos proximos meses esta em qual nivel?",
    description: "1 significa sem confianca. 10 significa muito confiante.",
    placeholder: null,
    type: "scale",
    required: true,
    options: [],
    step: "Rotina e clareza",
    order: 180,
    aiHint: "Use para ajustar encorajamento, riscos e proximos passos.",
    isActive: true
  }
];

export const defaultQuestions: DiagnosticQuestion[] = defaultQuestionTemplates.map((question) => ({
  ...question,
  formId: defaultDiagnosticFormId
}));

const legacyDefaultKeys = [
  "current_stack",
  "experience_time",
  "self_level",
  "known_technologies",
  "desired_technologies",
  "goal",
  "daily_time_available",
  "main_difficulties"
];

function toQuestion(record: QuestionRecord): DiagnosticQuestion {
  return diagnosticQuestionSchema.parse({
    ...record,
    options: parseQuestionOptions(record.options)
  });
}

function toForm(record: FormRecord): DiagnosticFormConfig {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    description: record.description,
    isActive: record.isActive,
    isArchived: record.isArchived
  };
}

function toFormWithQuestions(record: FormRecord & { questions: QuestionRecord[] }): DiagnosticFormWithQuestions {
  return {
    ...toForm(record),
    questions: record.questions.map(toQuestion)
  };
}

export async function getActiveDiagnosticForm(): Promise<DiagnosticFormWithQuestions> {
  try {
    await ensureDefaultQuestions();

    const record = await prisma.diagnosticForm.findFirst({
      where: {
        isActive: true,
        isArchived: false
      },
      orderBy: { updatedAt: "desc" },
      include: {
        questions: {
          where: { isActive: true },
          orderBy: [{ order: "asc" }, { createdAt: "asc" }]
        }
      }
    });

    if (record) {
      return toFormWithQuestions(record);
    }

    return {
      ...defaultDiagnosticForm,
      questions: defaultQuestions
    };
  } catch {
    return {
      ...defaultDiagnosticForm,
      questions: defaultQuestions
    };
  }
}

export async function getActiveQuestions(): Promise<DiagnosticQuestion[]> {
  const form = await getActiveDiagnosticForm();
  return form.questions.length > 0 ? form.questions : defaultQuestions;
}

export async function getAllFormsWithQuestions(): Promise<DiagnosticFormWithQuestions[]> {
  await ensureDefaultQuestions();

  const records = await prisma.diagnosticForm.findMany({
    where: { isArchived: false },
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
    include: {
      questions: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }]
      }
    }
  });

  return records.map(toFormWithQuestions);
}

export async function getAllQuestions(formId?: string): Promise<DiagnosticQuestion[]> {
  await ensureDefaultQuestions();

  const records = await prisma.diagnosticQuestion.findMany({
    where: formId ? { formId } : undefined,
    orderBy: [{ formId: "asc" }, { order: "asc" }, { createdAt: "asc" }]
  });

  return records.map(toQuestion);
}

export async function ensureDefaultQuestions(): Promise<void> {
  await prisma.diagnosticForm.upsert({
    where: { id: defaultDiagnosticFormId },
    create: defaultDiagnosticForm,
    update: {
      slug: defaultDiagnosticForm.slug,
      name: defaultDiagnosticForm.name,
      description: defaultDiagnosticForm.description,
      isArchived: false
    }
  });
  const activeForms = await prisma.diagnosticForm.count({
    where: {
      isActive: true,
      isArchived: false
    }
  });

  if (activeForms === 0) {
    await prisma.diagnosticForm.update({
      where: { id: defaultDiagnosticFormId },
      data: { isActive: true }
    });
  }

  const existingQuestions = await prisma.diagnosticQuestion.findMany({
    where: { formId: defaultDiagnosticFormId },
    select: { key: true }
  });
  const existingKeys = existingQuestions.map((question) => question.key);
  const hasOnlyLegacyDefaults =
    existingKeys.length > 0 &&
    existingKeys.every((key) => legacyDefaultKeys.includes(key)) &&
    existingKeys.length <= legacyDefaultKeys.length;

  if (existingKeys.length > 0 && !hasOnlyLegacyDefaults) {
    return;
  }

  if (hasOnlyLegacyDefaults) {
    await prisma.diagnosticQuestion.deleteMany({
      where: {
        key: {
          in: legacyDefaultKeys
        }
      }
    });
  }

  await prisma.diagnosticQuestion.createMany({
    data: defaultQuestions.map(({ id: _id, options, ...question }) => ({
      ...question,
      options
    })),
    skipDuplicates: true
  });
}

export function normalizeFormPayload(payload: unknown): Omit<DiagnosticFormConfig, "id"> & { id?: string } {
  const raw = payload as Partial<DiagnosticFormConfig>;
  const name = normalizeText(String(raw.name ?? ""));
  const slug = toQuestionKey(String(raw.slug || raw.name || ""));

  if (!name) {
    throw new Error("Nome do formulario e obrigatorio.");
  }

  if (!slug) {
    throw new Error("Slug do formulario e obrigatorio.");
  }

  return {
    id: raw.id,
    slug,
    name,
    description: raw.description ? normalizeText(raw.description) : null,
    isActive: Boolean(raw.isActive),
    isArchived: Boolean(raw.isArchived)
  };
}

export async function createForm(payload: unknown): Promise<DiagnosticFormWithQuestions> {
  const form = normalizeFormPayload(payload);

  if (form.isActive) {
    await prisma.diagnosticForm.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });
  }

  const hasAnyForm = await prisma.diagnosticForm.count({
    where: { isArchived: false }
  });

  const record = await prisma.diagnosticForm.create({
    data: {
      slug: form.slug,
      name: form.name,
      description: form.description,
      isActive: form.isActive || hasAnyForm === 0,
      isArchived: false
    },
    include: {
      questions: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }]
      }
    }
  });

  return toFormWithQuestions(record);
}

export async function updateForm(id: string, payload: unknown): Promise<DiagnosticFormWithQuestions> {
  const form = normalizeFormPayload({ ...(payload as object), id });

  if (form.isActive) {
    await prisma.diagnosticForm.updateMany({
      where: { isActive: true, id: { not: id } },
      data: { isActive: false }
    });
  }

  const record = await prisma.diagnosticForm.update({
    where: { id },
    data: {
      slug: form.slug,
      name: form.name,
      description: form.description,
      isActive: form.isActive,
      isArchived: form.isArchived
    },
    include: {
      questions: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }]
      }
    }
  });

  return toFormWithQuestions(record);
}

export async function activateForm(id: string): Promise<DiagnosticFormWithQuestions> {
  await prisma.diagnosticForm.updateMany({
    where: { isActive: true },
    data: { isActive: false }
  });

  const record = await prisma.diagnosticForm.update({
    where: { id },
    data: {
      isActive: true,
      isArchived: false
    },
    include: {
      questions: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }]
      }
    }
  });

  return toFormWithQuestions(record);
}

export async function deleteForm(id: string): Promise<void> {
  const forms = await prisma.diagnosticForm.findMany({
    where: { isArchived: false },
    select: { id: true, isActive: true },
    orderBy: { updatedAt: "desc" }
  });

  if (forms.length <= 1) {
    throw new Error("Mantenha pelo menos um formulario disponivel.");
  }

  const deleted = forms.find((form) => form.id === id);
  await prisma.diagnosticForm.delete({ where: { id } });

  if (deleted?.isActive) {
    const nextForm = forms.find((form) => form.id !== id);

    if (nextForm) {
      await activateForm(nextForm.id);
    }
  }
}

export function normalizeQuestionPayload(payload: unknown): QuestionUpsertPayload {
  const raw = payload as Partial<QuestionUpsertPayload>;
  const options = questionOptionSchema.array().parse(raw.options ?? []);
  const type = raw.type;
  const key = toQuestionKey(String(raw.key || raw.label || ""));

  if (!type || !["short_text", "long_text", "number", "scale", "single_select", "multi_select"].includes(type)) {
    throw new Error("Tipo de pergunta invalido.");
  }

  const normalizedOptions =
    type === "single_select" || type === "multi_select"
      ? uniqueStable(options.map((option) => option.value)).map((value) => {
          const option = options.find((item) => item.value === value);
          return {
            label: option?.label ?? value,
            value
          };
        })
      : [];

  return {
    id: raw.id,
    formId: raw.formId || defaultDiagnosticFormId,
    key,
    label: normalizeText(String(raw.label ?? "")),
    description: raw.description ? normalizeText(raw.description) : null,
    placeholder: raw.placeholder ? normalizeText(raw.placeholder) : null,
    type,
    required: Boolean(raw.required),
    options: normalizedOptions,
    step: normalizeText(String(raw.step ?? "Perfil")),
    order: Number(raw.order ?? 0),
    aiHint: raw.aiHint ? normalizeText(raw.aiHint) : null,
    isActive: raw.isActive ?? true
  };
}

export async function createQuestion(payload: unknown): Promise<DiagnosticQuestion> {
  const question = normalizeQuestionPayload(payload);
  const record = await prisma.diagnosticQuestion.create({
    data: {
      formId: question.formId ?? defaultDiagnosticFormId,
      key: question.key,
      label: question.label,
      description: question.description,
      placeholder: question.placeholder,
      type: question.type,
      required: question.required,
      options: question.options,
      step: question.step,
      order: question.order,
      aiHint: question.aiHint,
      isActive: question.isActive
    }
  });

  return toQuestion(record);
}

export async function updateQuestion(id: string, payload: unknown): Promise<DiagnosticQuestion> {
  const question = normalizeQuestionPayload({ ...(payload as object), id });
  const record = await prisma.diagnosticQuestion.update({
    where: { id },
    data: {
      formId: question.formId ?? defaultDiagnosticFormId,
      key: question.key,
      label: question.label,
      description: question.description,
      placeholder: question.placeholder,
      type: question.type,
      required: question.required,
      options: question.options,
      step: question.step,
      order: question.order,
      aiHint: question.aiHint,
      isActive: question.isActive
    }
  });

  return toQuestion(record);
}

export async function deleteQuestion(id: string): Promise<void> {
  await prisma.diagnosticQuestion.delete({
    where: { id }
  });
}
