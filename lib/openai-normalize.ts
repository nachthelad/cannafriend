export type OpenAIResponseMessage = {
  role: string;
  content?: unknown;
  [key: string]: unknown;
};

function collectText(
  value: unknown,
  allowAnyKey = false,
  seen = new WeakSet<object>()
): string[] {
  if (value == null) {
    return [];
  }

  if (typeof value === "string") {
    return [value];
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectText(item, allowAnyKey, seen));
  }

  if (typeof value === "object") {
    if (seen.has(value as object)) {
      return [];
    }
    seen.add(value as object);

    const obj = value as Record<string, unknown>;
    const TEXT_KEYS = [
      "text",
      "output_text",
      "value",
      "content",
      "message",
      "message_text",
    ];

    const keysToExplore = allowAnyKey
      ? Object.keys(obj)
      : Object.keys(obj).filter((key) => TEXT_KEYS.includes(key));

    let results: string[] = [];
    for (const key of keysToExplore) {
      results.push(...collectText(obj[key], allowAnyKey, seen));
    }

    if (!allowAnyKey && results.length === 0) {
      for (const key of Object.keys(obj)) {
        if (keysToExplore.includes(key)) {
          continue;
        }
        results.push(...collectText(obj[key], true, seen));
      }
    }

    return results;
  }

  return [];
}

export function normalizeOpenAIContent(
  message: OpenAIResponseMessage | null | undefined
): string {
  if (!message) {
    return "";
  }

  const fromContent = collectText(message.content);
  let parts = fromContent;

  if (!parts.length) {
    parts = collectText(message);
  }

  const filtered: string[] = [];
  for (const raw of parts) {
    const candidate = typeof raw === "string" ? raw : String(raw ?? "");
    const trimmed = candidate.trim();
    if (!trimmed) {
      continue;
    }

    const lower = trimmed.toLowerCase();
    if (lower === "assistant" || lower === "system" || lower === "user") {
      continue;
    }

    if (!filtered.includes(trimmed)) {
      filtered.push(trimmed);
    }
  }

  if (!filtered.length) {
    const fallback =
      typeof message.content === "string" ? message.content.trim() : "";
    return fallback;
  }

  const containerCandidate = filtered.find((candidate) =>
    filtered.every(
      (part) => part === candidate || candidate.includes(part)
    )
  );
  if (containerCandidate) {
    return containerCandidate;
  }

  const joined = filtered.join("\n").trim();
  if (joined) {
    return joined;
  }

  const fallback =
    typeof message.content === "string" ? message.content.trim() : "";
  return fallback;
}
