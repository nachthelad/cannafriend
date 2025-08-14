import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { checkRateLimit, extractClientIp } from "@/lib/rate-limit";

// We import from openai if available; otherwise, use fetch to the REST endpoint.
// Using edge-friendly approach with fetch to avoid bundling issues.

export const runtime = "nodejs";

type Body = {
  question: string;
  imageBase64?: string;
  imageUrl?: string;
  imageType?: string;
};

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

    // Basic rate limit: default 12 reqs / 60s per user+ip (configurable)
    const limit = Number(process.env.AI_VISION_RATELIMIT_LIMIT || 12);
    const windowMs = Number(
      process.env.AI_VISION_RATELIMIT_WINDOW_MS || 60_000
    );
    const ip = extractClientIp(req.headers) || "unknown";
    const key = `ai-vision:${decoded.uid}:${ip}`;
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

    const {
      question,
      imageBase64,
      imageUrl,
      imageType = "image/jpeg",
    } = (await req.json()) as Body;
    if (!imageBase64 && !imageUrl) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }
    if (imageBase64) {
      // quick guard: reject > 6MB base64 payloads
      const approxBytes = Math.ceil((imageBase64.length * 3) / 4);
      if (approxBytes > 6 * 1024 * 1024) {
        return NextResponse.json({ error: "image_too_large" }, { status: 413 });
      }
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const preferredModel = process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini";
    const fallbackModel = "gpt-4.1";

    const buildPayload = (model: string) =>
      ({
        model,
        messages: [
          {
            role: "system",
            content:
              'You are a direct, concise assistant. Answer immediately without praise, flattery, or filler. Do not say things like "Great question", "Thanks for asking", "I hope this helps", or apologize unless an actual error occurred. No small talk. Do not ask follow-up questions. End your response and do not ask if the user has any more questions. Instead tell him to create a new analysis.',
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  question ||
                  "Analyze this marijuana plant for nutrient deficiencies, potential infections, and suggestions for care or feeding.",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64
                    ? `data:${imageType};base64,${imageBase64}`
                    : (imageUrl as string),
                },
              },
            ],
          },
        ],
        temperature: 0.2,
      } as const);

    const endpoint = "https://api.openai.com/v1/chat/completions";

    // Lightweight pre-check: ensure the image is a plant/cannabis-related photo
    const classifyPayload = (model: string) => ({
      model,
      messages: [
        {
          role: "system",
          content:
            'You are a strict image gatekeeper. Determine if the image is a photo of a plant (preferably cannabis). Reply ONLY with JSON: {"isPlant": true|false, "reason": string}.',
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Is this a plant photo?" },
            {
              type: "image_url",
              image_url: {
                url: imageBase64
                  ? `data:${imageType};base64,${imageBase64}`
                  : (imageUrl as string),
              },
            },
          ],
        },
      ],
      temperature: 0,
    });

    const classify = async (): Promise<{ ok: boolean; reason?: string }> => {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(classifyPayload(fallbackModel)),
        cache: "no-store",
      });
      if (!res.ok) return { ok: true }; // if classifier fails, don't block
      const data = await res.json();
      const txt: string = data?.choices?.[0]?.message?.content || "";
      try {
        const parsed = JSON.parse(txt);
        if (parsed && parsed.isPlant === false) {
          return {
            ok: false,
            reason: String(parsed.reason || "Not a plant photo"),
          };
        }
      } catch {
        // non-JSON; allow
      }
      return { ok: true };
    };

    const gate = await classify();
    if (!gate.ok) {
      return NextResponse.json(
        {
          error: "non_plant",
          message: gate.reason || "Image does not appear to be a plant",
        },
        { status: 422 }
      );
    }

    const tryRequest = async (model: string) =>
      fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(buildPayload(model)),
        cache: "no-store",
      });

    let resp = await tryRequest(preferredModel);
    if (!resp.ok) {
      const text = await resp.text();
      // If model not found or no access, try fallback
      if (text && /model_not_found|does not have access to model/i.test(text)) {
        resp = await tryRequest(fallbackModel);
      } else {
        return NextResponse.json(
          { error: text || "OpenAI error" },
          { status: 500 }
        );
      }
    }

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json(
        { error: text || "OpenAI error" },
        { status: 500 }
      );
    }
    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "";

    return NextResponse.json({ content });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
