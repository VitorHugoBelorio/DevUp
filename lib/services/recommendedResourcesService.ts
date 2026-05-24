import { prisma } from "@/lib/prisma";
import { uniqueStable } from "@/lib/utils/text";
import type {
  DiagnosticAnswer,
  DiagnosticAnswerValue,
  DiagnosticInput,
  DiagnosticResult,
  RecommendedResource,
  ResourceInteractionStatus,
  ResourceLevel
} from "@/types/diagnostic";

type DiagnosticRecord = {
  id: string;
  input: unknown;
  aiResult: unknown;
};

type ResourceRecord = {
  id: string;
  title: string;
  subject: string;
  url: string;
  type: RecommendedResource["type"];
  level: ResourceLevel;
  description: string;
  sourceName: string | null;
  estimatedMinutes: number | null;
  priority: number;
  flags: Array<{
    flag: {
      key: string;
      label: string;
    };
  }>;
  interactions: Array<{
    status: ResourceInteractionStatus;
  }>;
};

type UserTags = {
  all: string[];
  area: string | null;
  level: ResourceLevel;
};

type RecommendationResult =
  | {
      reason: "NO_DIAGNOSTIC";
      items: [];
    }
  | {
      reason: "OK";
      items: RecommendedResource[];
    };

const tagSynonyms: Record<string, string> = {
  "c#": "csharp",
  "asp.net": "asp-net-core",
  "aspnet": "asp-net-core",
  "asp-net": "asp-net-core",
  "api-rest": "api",
  "apis": "api",
  "back-end": "backend",
  "front-end": "frontend",
  "full-stack": "fullstack",
  "júnior": "junior",
  "junior": "junior",
  "primeiro-emprego": "primeira-vaga",
  "primeira-vaga-junior": "primeira-vaga"
};

function normalizeTag(value: string): string {
  const cleaned = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\+/g, "plus")
    .replace(/#/g, "sharp")
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return tagSynonyms[cleaned] ?? cleaned;
}

function splitTerms(value: string): string[] {
  const normalized = normalizeTag(value);
  const terms = normalized.split("-").filter((term) => term.length >= 3);

  return [normalized, ...terms];
}

function collectAnswerTerms(value: DiagnosticAnswerValue): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(collectAnswerTerms);
  }

  return splitTerms(String(value));
}

function extractAnswerTags(answers: DiagnosticAnswer[]): string[] {
  return answers.flatMap((answer) => [
    ...splitTerms(answer.key),
    ...splitTerms(answer.label),
    ...(answer.aiHint ? splitTerms(answer.aiHint) : []),
    ...collectAnswerTerms(answer.value)
  ]);
}

function inferUserLevel(result: DiagnosticResult): ResourceLevel {
  const text = normalizeTag(
    [
      result.diagnosis.level_estimation,
      ...result.diagnosis.strengths,
      ...result.diagnosis.weaknesses,
      ...result.insights.blocking_points
    ].join(" ")
  );

  if (text.includes("avancado")) {
    return "advanced";
  }

  if (text.includes("intermediario")) {
    return "intermediate";
  }

  return "beginner";
}

function extractUserTags(diagnostic: DiagnosticRecord): UserTags {
  const input = diagnostic.input as DiagnosticInput;
  const result = diagnostic.aiResult as DiagnosticResult;
  const primaryArea = input.area_preferences.find((preference) => preference.priority === "primary") ?? input.area_preferences[0];
  const areaTags = input.area_preferences.flatMap((preference) => [
    preference.area,
    preference.label,
    preference.priority
  ]);
  const planTags = result.study_plan.flatMap((day) => day.topics.flatMap(splitTerms));
  const directionTags = [
    ...result.direction.focus_now,
    ...result.direction.next_steps,
    ...result.diagnosis.weaknesses,
    ...result.insights.blocking_points
  ].flatMap(splitTerms);
  const tags = uniqueStable(
    [...areaTags.flatMap(splitTerms), ...extractAnswerTags(input.answers), ...planTags, ...directionTags]
      .map(normalizeTag)
      .filter((tag) => tag.length >= 3)
  );

  return {
    all: tags,
    area: primaryArea ? normalizeTag(primaryArea.area) : null,
    level: inferUserLevel(result)
  };
}

function isLevelCompatible(resourceLevel: ResourceLevel, userLevel: ResourceLevel): boolean {
  if (userLevel === "beginner") {
    return resourceLevel === "beginner";
  }

  if (userLevel === "intermediate") {
    return resourceLevel === "beginner" || resourceLevel === "intermediate";
  }

  return resourceLevel === "intermediate" || resourceLevel === "advanced";
}

function scoreResource(resource: ResourceRecord, userTags: UserTags): { score: number; matchedTags: string[] } {
  const resourceTags = uniqueStable(
    [
      resource.subject,
      resource.title,
      resource.description,
      ...resource.flags.flatMap((item) => [item.flag.key, item.flag.label])
    ]
      .flatMap(splitTerms)
      .map(normalizeTag)
      .filter((tag) => tag.length >= 3)
  );
  let score = Math.max(0, resource.priority);
  const matchedTags: string[] = [];

  for (const tag of userTags.all) {
    if (resourceTags.includes(tag)) {
      score += tag === userTags.area ? 3 : 2;
      matchedTags.push(tag);
    }
  }

  if (isLevelCompatible(resource.level, userTags.level)) {
    score += 1;
  } else {
    score -= 3;
  }

  const interaction = resource.interactions[0];

  if (interaction?.status === "OPENED") {
    score -= 2;
  }

  if (interaction?.status === "DISMISSED") {
    score -= 3;
  }

  return {
    score,
    matchedTags: uniqueStable(matchedTags)
  };
}

function buildRecommendationReason(resource: ResourceRecord, userTags: UserTags, matchedTags: string[]): string {
  const mainTag = matchedTags[0] ?? normalizeTag(resource.subject);

  if (userTags.area && matchedTags.includes(userTags.area)) {
    return `Recomendado porque seu diagnostico indicou interesse em ${userTags.area} e este conteudo aprofunda esse caminho sem competir com sua trilha principal.`;
  }

  if (mainTag) {
    return `Recomendado porque seu diagnostico trouxe sinais relacionados a ${mainTag}, e este conteudo pode ampliar sua visao com seguranca.`;
  }

  return "Recomendado como complemento leve para enriquecer sua evolucao sem tirar o foco da trilha principal.";
}

function toRecommendedResource(
  resource: ResourceRecord,
  score: number,
  matchedTags: string[],
  userTags: UserTags
): RecommendedResource {
  return {
    id: resource.id,
    title: resource.title,
    description: resource.description,
    url: resource.url,
    type: resource.type,
    level: resource.level,
    sourceName: resource.sourceName,
    estimatedMinutes: resource.estimatedMinutes,
    tags: resource.flags.map((item) => item.flag.label || item.flag.key).slice(0, 4),
    recommendationReason: buildRecommendationReason(resource, userTags, matchedTags),
    score,
    interactionStatus: resource.interactions[0]?.status ?? null
  };
}

async function getDiagnosticForRecommendations(userId: string, diagnosticId?: string): Promise<DiagnosticRecord | null> {
  if (diagnosticId) {
    return prisma.diagnostic.findFirst({
      where: {
        id: diagnosticId,
        userId
      },
      select: {
        id: true,
        input: true,
        aiResult: true
      }
    });
  }

  return prisma.diagnostic.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      input: true,
      aiResult: true
    }
  });
}

async function markResourcesAsViewed(userId: string, resourceIds: string[]): Promise<void> {
  const now = new Date();

  await Promise.all(
    resourceIds.map((resourceId) =>
      prisma.userResourceInteraction.upsert({
        where: {
          userId_resourceId: {
            userId,
            resourceId
          }
        },
        create: {
          userId,
          resourceId,
          status: "VIEWED",
          viewedAt: now
        },
        update: {
          viewedAt: now
        }
      })
    )
  );
}

export async function getRecommendedResources(input: {
  userId: string;
  diagnosticId?: string;
  limit?: number;
}): Promise<RecommendationResult> {
  const diagnostic = await getDiagnosticForRecommendations(input.userId, input.diagnosticId);

  if (!diagnostic) {
    return {
      reason: "NO_DIAGNOSTIC",
      items: []
    };
  }

  const limit = Math.min(Math.max(input.limit ?? 6, 1), 12);
  const userTags = extractUserTags(diagnostic);
  const resources = await prisma.knowledgeResource.findMany({
    where: {
      isActive: true,
      isMainTrack: false,
      isOutdated: false
    },
    include: {
      flags: {
        include: {
          flag: true
        }
      },
      interactions: {
        where: {
          userId: input.userId
        },
        select: {
          status: true
        }
      }
    }
  });
  const items = resources
    .map((resource) => {
      const { score, matchedTags } = scoreResource(resource, userTags);

      return toRecommendedResource(resource, score, matchedTags, userTags);
    })
    .filter((resource) => resource.score > 0 && resource.interactionStatus !== "DISMISSED")
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);

  await markResourcesAsViewed(
    input.userId,
    items.map((item) => item.id)
  );

  return {
    reason: "OK",
    items: items.map((item) => ({
      ...item,
      interactionStatus: item.interactionStatus ?? "VIEWED"
    }))
  };
}

export async function recordResourceInteraction(input: {
  userId: string;
  resourceId: string;
  status: Exclude<ResourceInteractionStatus, "VIEWED">;
}): Promise<{ status: ResourceInteractionStatus }> {
  const now = new Date();
  const timestampPatch =
    input.status === "OPENED"
      ? { clickedAt: now }
      : input.status === "SAVED"
        ? { savedAt: now }
        : { dismissedAt: now };

  const interaction = await prisma.userResourceInteraction.upsert({
    where: {
      userId_resourceId: {
        userId: input.userId,
        resourceId: input.resourceId
      }
    },
    create: {
      userId: input.userId,
      resourceId: input.resourceId,
      status: input.status,
      viewedAt: now,
      ...timestampPatch
    },
    update: {
      status: input.status,
      ...timestampPatch
    },
    select: {
      status: true
    }
  });

  return {
    status: interaction.status
  };
}

export async function getSavedResources(userId: string): Promise<RecommendedResource[]> {
  const resources = await prisma.knowledgeResource.findMany({
    where: {
      isActive: true,
      interactions: {
        some: {
          userId,
          status: "SAVED"
        }
      }
    },
    include: {
      flags: {
        include: { flag: true }
      },
      interactions: {
        where: { userId },
        select: { status: true }
      }
    }
  });

  const fallbackTags: UserTags = {
    all: [],
    area: null,
    level: "beginner"
  };

  return resources.map((resource) => toRecommendedResource(resource, 0, [], fallbackTags));
}
