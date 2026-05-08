export const recommendationTypes = ["article", "course", "documentation"] as const;

export type RecommendationType = (typeof recommendationTypes)[number];

export const questionTypes = ["short_text", "long_text", "number", "scale", "single_select", "multi_select"] as const;

export type QuestionType = (typeof questionTypes)[number];

export type QuestionOption = {
  label: string;
  value: string;
};

export type DiagnosticQuestion = {
  id: string;
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
  answers: DiagnosticAnswer[];
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
  questions: DiagnosticQuestion[];
  result: DiagnosticResult;
  aiModel: string;
  createdAt: string;
};
