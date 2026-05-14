import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recommendationTypes } from "@/types/diagnostic";
import type {
  CuratedKnowledgeResource,
  DiagnosticAnswerValue,
  DiagnosticInput,
  KnowledgeFlag,
  KnowledgeResource,
  RecommendationType
} from "@/types/diagnostic";
import { normalizeText, toQuestionKey, uniqueStable } from "@/lib/utils/text";

type FlagRecord = {
  id: string;
  key: string;
  label: string;
  description: string | null;
};

type ResourceRecord = {
  id: string;
  title: string;
  subject: string;
  url: string;
  type: RecommendationType;
  description: string;
  priority: number;
  isActive: boolean;
  flags: Array<{
    flag: FlagRecord;
  }>;
};

type KnowledgeResourcePayload = {
  id?: string;
  title?: string;
  subject?: string;
  url?: string;
  type?: RecommendationType;
  description?: string;
  priority?: number;
  isActive?: boolean;
  flagKeys?: string[];
  flags?: Array<Partial<KnowledgeFlag> | string>;
};

type KnowledgeFlagPayload = {
  id?: string;
  key?: string;
  label?: string;
  description?: string | null;
};

const urlSchema = z.string().url();

function toFlag(record: FlagRecord): KnowledgeFlag {
  return {
    id: record.id,
    key: record.key,
    label: record.label,
    description: record.description
  };
}

function toResource(record: ResourceRecord): KnowledgeResource {
  return {
    id: record.id,
    title: record.title,
    subject: record.subject,
    url: record.url,
    type: record.type,
    description: record.description,
    priority: record.priority,
    isActive: record.isActive,
    flags: record.flags.map((item) => toFlag(item.flag)).sort((left, right) => left.label.localeCompare(right.label))
  };
}

function toSearchText(value: string): string {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function collectValueTerms(value: DiagnosticAnswerValue): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(collectValueTerms);
  }

  return String(value)
    .split(/[^a-zA-Z0-9_./#+-]+/)
    .map(toSearchText)
    .filter((item) => item.length >= 3);
}

function extractSearchTerms(input: DiagnosticInput): string[] {
  const areaTerms = input.area_preferences.flatMap((preference) => [
    preference.area,
    preference.label,
    preference.priority
  ]);
  const answerTerms = input.answers.flatMap((answer) => [
    answer.key,
    answer.label,
    ...(answer.aiHint ? [answer.aiHint] : []),
    ...collectValueTerms(answer.value)
  ]);

  return uniqueStable([...areaTerms, ...answerTerms].map(toSearchText).filter((item) => item.length >= 3));
}

function scoreResource(resource: KnowledgeResource, terms: string[]): number {
  const flags = resource.flags.map((flag) => toSearchText(`${flag.key} ${flag.label}`));
  const subject = toSearchText(resource.subject);
  const title = toSearchText(resource.title);
  const description = toSearchText(resource.description);
  let score = 0;

  for (const term of terms) {
    if (flags.some((flag) => flag.includes(term) || term.includes(flag))) {
      score += 8;
    }

    if (subject.includes(term) || term.includes(subject)) {
      score += 6;
    }

    if (title.includes(term)) {
      score += 3;
    }

    if (description.includes(term)) {
      score += 1;
    }
  }

  return score + Math.max(0, resource.priority);
}

function toCuratedResource(resource: KnowledgeResource): CuratedKnowledgeResource {
  return {
    source_id: resource.id,
    title: resource.title,
    subject: resource.subject,
    url: resource.url,
    type: resource.type,
    description: resource.description,
    flags: resource.flags.map((flag) => flag.key)
  };
}

export function normalizeFlagPayload(payload: unknown): Omit<KnowledgeFlag, "id"> & { id?: string } {
  const raw = payload as KnowledgeFlagPayload;
  const label = normalizeText(String(raw.label ?? raw.key ?? ""));
  const key = toQuestionKey(String(raw.key || label));

  if (!label) {
    throw new Error("Nome da flag e obrigatorio.");
  }

  return {
    id: raw.id,
    key,
    label,
    description: raw.description ? normalizeText(raw.description) : null
  };
}

function normalizeResourcePayload(payload: unknown): Omit<KnowledgeResource, "id" | "flags"> & {
  id?: string;
  flagKeys: string[];
} {
  const raw = payload as KnowledgeResourcePayload;
  const type = raw.type ?? "other";

  if (!recommendationTypes.includes(type)) {
    throw new Error("Tipo de fonte invalido.");
  }

  const title = normalizeText(String(raw.title ?? ""));
  const subject = normalizeText(String(raw.subject ?? ""));
  const description = normalizeText(String(raw.description ?? ""));
  const url = urlSchema.parse(String(raw.url ?? ""));
  const rawFlags = [
    ...(raw.flagKeys ?? []),
    ...(raw.flags ?? []).map((flag) => (typeof flag === "string" ? flag : flag.key ?? flag.label ?? ""))
  ];
  const flagKeys = uniqueStable(rawFlags.map((flag) => toQuestionKey(String(flag))).filter(Boolean));

  if (!title) {
    throw new Error("Titulo da fonte e obrigatorio.");
  }

  if (!subject) {
    throw new Error("Assunto da fonte e obrigatorio.");
  }

  if (!description) {
    throw new Error("Descricao da fonte e obrigatoria.");
  }

  return {
    id: raw.id,
    title,
    subject,
    url,
    type,
    description,
    priority: Number(raw.priority ?? 0),
    isActive: raw.isActive ?? true,
    flagKeys
  };
}

async function ensureFlags(flagKeys: string[]): Promise<KnowledgeFlag[]> {
  const flags = await Promise.all(
    flagKeys.map((key) =>
      prisma.knowledgeFlag.upsert({
        where: { key },
        create: {
          key,
          label: key
        },
        update: {}
      })
    )
  );

  return flags.map(toFlag);
}

export async function getAllKnowledgeFlags(): Promise<KnowledgeFlag[]> {
  const records = await prisma.knowledgeFlag.findMany({
    orderBy: [{ label: "asc" }]
  });

  return records.map(toFlag);
}

export async function createKnowledgeFlag(payload: unknown): Promise<KnowledgeFlag> {
  const flag = normalizeFlagPayload(payload);
  const record = await prisma.knowledgeFlag.create({
    data: {
      key: flag.key,
      label: flag.label,
      description: flag.description
    }
  });

  return toFlag(record);
}

export async function updateKnowledgeFlag(id: string, payload: unknown): Promise<KnowledgeFlag> {
  const flag = normalizeFlagPayload({ ...(payload as object), id });
  const record = await prisma.knowledgeFlag.update({
    where: { id },
    data: {
      key: flag.key,
      label: flag.label,
      description: flag.description
    }
  });

  return toFlag(record);
}

export async function deleteKnowledgeFlag(id: string): Promise<void> {
  await prisma.knowledgeFlag.delete({
    where: { id }
  });
}

export async function getAllKnowledgeResources(): Promise<KnowledgeResource[]> {
  const records = await prisma.knowledgeResource.findMany({
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    include: {
      flags: {
        include: { flag: true }
      }
    }
  });

  return records.map(toResource);
}

export async function createKnowledgeResource(payload: unknown): Promise<KnowledgeResource> {
  const resource = normalizeResourcePayload(payload);
  const flags = await ensureFlags(resource.flagKeys);
  const record = await prisma.knowledgeResource.create({
    data: {
      title: resource.title,
      subject: resource.subject,
      url: resource.url,
      type: resource.type,
      description: resource.description,
      priority: resource.priority,
      isActive: resource.isActive,
      flags: {
        create: flags.map((flag) => ({
          flagId: flag.id
        }))
      }
    },
    include: {
      flags: {
        include: { flag: true }
      }
    }
  });

  return toResource(record);
}

export async function updateKnowledgeResource(id: string, payload: unknown): Promise<KnowledgeResource> {
  const resource = normalizeResourcePayload({ ...(payload as object), id });
  const flags = await ensureFlags(resource.flagKeys);

  await prisma.knowledgeResourceFlag.deleteMany({
    where: { resourceId: id }
  });

  const record = await prisma.knowledgeResource.update({
    where: { id },
    data: {
      title: resource.title,
      subject: resource.subject,
      url: resource.url,
      type: resource.type,
      description: resource.description,
      priority: resource.priority,
      isActive: resource.isActive,
      flags: {
        create: flags.map((flag) => ({
          flagId: flag.id
        }))
      }
    },
    include: {
      flags: {
        include: { flag: true }
      }
    }
  });

  return toResource(record);
}

export async function deleteKnowledgeResource(id: string): Promise<void> {
  await prisma.knowledgeResource.delete({
    where: { id }
  });
}

export async function getRelevantKnowledgeResources(input: DiagnosticInput, limit = 8): Promise<CuratedKnowledgeResource[]> {
  const resources = (await getAllKnowledgeResources()).filter((resource) => resource.isActive);
  const terms = extractSearchTerms(input);
  const scored = resources
    .map((resource) => ({
      resource,
      score: scoreResource(resource, terms)
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || right.resource.priority - left.resource.priority);

  return scored.slice(0, limit).map((item) => toCuratedResource(item.resource));
}
