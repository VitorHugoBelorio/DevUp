export function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function splitListValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => splitListValue(item));
  }

  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(/[\n,;]/)
    .map(normalizeText)
    .filter(Boolean);
}

export function uniqueStable(values: string[]): string[] {
  const seen = new Set<string>();

  return values.filter((value) => {
    const key = value.toLocaleLowerCase("pt-BR");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function toQuestionKey(value: string): string {
  const normalized = normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return /^[a-z]/.test(normalized) ? normalized : `question_${normalized || "item"}`;
}
