// Simple in-memory rate limiter for Node runtime routes
// Fixed-window counter keyed by arbitrary string (e.g., `${uid}:${ip}`)

type RateEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateEntry>();

export type RateCheck = {
  ok: boolean;
  remaining: number;
  resetMs: number;
  limit: number;
};

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateCheck {
  const now = Date.now();
  const current = store.get(key);

  if (!current || now > current.resetAt) {
    const fresh: RateEntry = { count: 0, resetAt: now + windowMs };
    store.set(key, fresh);
  }

  const entry = store.get(key)!;
  entry.count += 1;
  store.set(key, entry);

  const remaining = Math.max(0, maxRequests - entry.count);
  const ok = entry.count <= maxRequests;
  const resetMs = Math.max(0, entry.resetAt - now);

  return { ok, remaining, resetMs, limit: maxRequests };
}

export function extractClientIp(headers: Headers): string {
  // Try common forwarding headers first
  const order = [
    "cf-connecting-ip",
    "x-forwarded-for",
    "x-real-ip",
    "forwarded",
  ];
  for (const name of order) {
    const value = headers.get(name) || headers.get(name.toUpperCase());
    if (value) {
      if (name === "x-forwarded-for") {
        const first = value.split(",")[0]?.trim();
        if (first) return first;
      }
      return value.trim();
    }
  }
  return "";
}
