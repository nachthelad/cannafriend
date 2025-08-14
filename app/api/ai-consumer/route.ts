import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { checkRateLimit, extractClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json({ error: "missing_auth" }, { status: 401 });
    }
    const idToken = authHeader.split(" ")[1];
    let decoded: any;
    try {
      decoded = await adminAuth().verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: "invalid_auth" }, { status: 401 });
    }
    if (
      process.env.REQUIRE_PREMIUM_FOR_AI === "true" &&
      !Boolean((decoded as any)?.premium)
    ) {
      return NextResponse.json({ error: "premium_required" }, { status: 403 });
    }

    // Basic rate limit: default 30 reqs / 60s per user+ip (configurable)
    const limit = Number(process.env.AI_RATELIMIT_LIMIT || 30);
    const windowMs = Number(process.env.AI_RATELIMIT_WINDOW_MS || 60_000);
    const ip = extractClientIp(req.headers) || "unknown";
    const key = `ai-consumer:${decoded.uid}:${ip}`;
    const rl = checkRateLimit(key, limit, windowMs);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "rate_limited" },
        {
          status: 429,
          headers: {
            "x-ratelimit-limit": String(rl.limit),
            "x-ratelimit-remaining": String(rl.remaining),
            "retry-after": String(Math.ceil(rl.resetMs / 1000)),
          },
        }
      );
    }

    const { messages } = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
    };
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey)
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );

    const endpoint = "https://api.openai.com/v1/chat/completions";
    const model = process.env.OPENAI_TEXT_MODEL || "gpt-4.1-mini";

    const sys = {
      role: "system",
      content:
        "You are a direct, concise cannabis consumer assistant. Focus on: joint rolling technique, grind, even packing, filters, preventing canoeing, dosage, session planning, tolerance breaks, flavors/terpenes, storage, etiquette, and harm reduction. No praise or fluff. If medical topics arise, recommend consulting a professional.",
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [sys, ...messages],
        temperature: 0.2,
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: text || "OpenAI error" },
        { status: 500 }
      );
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ content });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
