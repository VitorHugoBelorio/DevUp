export const recommendationTypes = [
  "platform",
  "article",
  "blog",
  "documentation",
  "course",
  "video",
  "community",
  "tool",
  "other"
] as const;

export type RecommendationType = (typeof recommendationTypes)[number];

export const questionTypes = ["short_text", "long_text", "number", "scale", "single_select", "multi_select"] as const;

export type QuestionType = (typeof questionTypes)[number];

export const careerAreaSlugs = [
  "frontend",
  "backend",
  "fullstack",
  "mobile",
  "devops",
  "data",
  "ai_ml",
  "cybersecurity",
  "qa",
  "software_engineering",
  "not_sure"
] as const;

export type CareerAreaSlug = (typeof careerAreaSlugs)[number];

export const careerAreaOptions: Array<{
  value: CareerAreaSlug;
  label: string;
  description: string;
}> = [
  {
    value: "frontend",
    label: "Frontend",
    description: "Interfaces, experiencia do usuario e produtos web."
  },
  {
    value: "backend",
    label: "Backend",
    description: "APIs, regras de negocio, banco de dados e integracoes."
  },
  {
    value: "fullstack",
    label: "Fullstack",
    description: "Visao ponta a ponta entre interface, backend e entrega."
  },
  {
    value: "mobile",
    label: "Mobile",
    description: "Aplicativos, experiencia mobile e publicacao em lojas."
  },
  {
    value: "devops",
    label: "DevOps",
    description: "Deploy, infraestrutura, Docker, CI/CD e operacao."
  },
  {
    value: "data",
    label: "Dados",
    description: "SQL, analise, pipelines, BI e fundamentos de dados."
  },
  {
    value: "ai_ml",
    label: "IA / Machine Learning",
    description: "Modelos, automacoes, prompts, dados e aplicacoes com IA."
  },
  {
    value: "cybersecurity",
    label: "Cyberseguranca",
    description: "Seguranca, riscos, redes, boas praticas e defesa."
  },
  {
    value: "qa",
    label: "QA / Testes",
    description: "Qualidade, automacao, testes e confiabilidade."
  },
  {
    value: "software_engineering",
    label: "Engenharia de Software",
    description: "Arquitetura, boas praticas, manutencao e qualidade tecnica."
  },
  {
    value: "not_sure",
    label: "Ainda nao sei",
    description: "Explorar possibilidades antes de escolher uma direcao."
  }
];

export type AreaPreferencePriority = "primary" | "secondary" | "support";

export type AreaPreference = {
  area: CareerAreaSlug;
  label: string;
  percentage: number;
  priority: AreaPreferencePriority;
};

export type QuestionOption = {
  label: string;
  value: string;
};

export type DiagnosticQuestion = {
  id: string;
  formId: string;
  key: string;
  label: string;
  description: string | null;
  placeholder: string | null;
  type: QuestionType;
  required: boolean;
  options: QuestionOption[];
  step: string;
  order: number;
  aiHint: string | null;
  isActive: boolean;
};

export type DiagnosticFormConfig = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isArchived: boolean;
};

export type DiagnosticFormWithQuestions = DiagnosticFormConfig & {
  questions: DiagnosticQuestion[];
};

export type KnowledgeFlag = {
  id: string;
  key: string;
  label: string;
  description: string | null;
};

export type KnowledgeResource = {
  id: string;
  title: string;
  subject: string;
  url: string;
  type: RecommendationType;
  description: string;
  priority: number;
  isActive: boolean;
  flags: KnowledgeFlag[];
};

export type CuratedKnowledgeResource = {
  source_id: string;
  title: string;
  subject: string;
  url: string;
  type: RecommendationType;
  description: string;
  flags: string[];
};

export type DiagnosticAnswerValue = string | number | string[];

export type DiagnosticAnswerInput = {
  question_id: string;
  key: string;
  value: DiagnosticAnswerValue;
};

export type DiagnosticAnswer = {
  question_id: string;
  key: string;
  label: string;
  type: QuestionType;
  value: DiagnosticAnswerValue;
  aiHint: string | null;
};

export type DiagnosticInput = {
  form_id: string;
  form_slug: string;
  answers: DiagnosticAnswer[];
  area_preferences: AreaPreference[];
  knowledge_resources: CuratedKnowledgeResource[];
};

export type DiagnosticResult = {
  diagnosis: {
    level_estimation: string;
    strengths: string[];
    weaknesses: string[];
  };
  direction: {
    focus_now: string[];
    avoid_now: string[];
    next_steps: string[];
  };
  study_plan: Array<{
    day: number;
    topics: string[];
    description: string;
  }>;
  recommendations: Array<{
    title: string;
    type: RecommendationType;
    url: string | null;
    source_id: string | null;
    reason: string;
  }>;
  insights: {
    likely_mistakes: string[];
    blocking_points: string[];
  };
};

export type StoredDiagnostic = {
  id: string;
  input: DiagnosticInput;
  form: DiagnosticFormConfig | null;
  questions: DiagnosticQuestion[];
  result: DiagnosticResult;
  aiModel: string;
  createdAt: string;
};
