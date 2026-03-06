// Persistent rate limiter backed by Firestore Admin SDK.
// Uses a Firestore transaction per request for atomic fixed-window counting.
// Works correctly across multiple serverless instances (no in-memory state).

import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { ensureAdminApp } from "@/lib/firebase-admin";

export type RateCheck = {
  ok: boolean;
  remaining: number;
  resetMs: number;
  limit: number;
};

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<RateCheck> {
  ensureAdminApp();
  const db = getFirestore();

  // Firestore doc IDs cannot contain '/', replace unsafe chars
  const docId = key.replace(/\//g, "_").replace(/[^a-zA-Z0-9_:.@-]/g, "_");
  const docRef = db.collection("_rateLimits").doc(docId);

  const now = Date.now();

  const { count, resetAt } = await db.runTransaction(async (tx) => {
    const doc = await tx.get(docRef);

    if (!doc.exists || now > (doc.data()!.resetAt as number)) {
      const fresh = { count: 1, resetAt: now + windowMs };
      tx.set(docRef, fresh);
      return fresh;
    }

    const data = doc.data()!;
    tx.update(docRef, { count: FieldValue.increment(1) });
    return { count: (data.count as number) + 1, resetAt: data.resetAt as number };
  });

  const remaining = Math.max(0, maxRequests - count);
  const ok = count <= maxRequests;
  const resetMs = Math.max(0, resetAt - now);

  return { ok, remaining, resetMs, limit: maxRequests };
}

export function extractClientIp(headers: Headers): string {
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
