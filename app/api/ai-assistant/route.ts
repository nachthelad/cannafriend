import { NextRequest, NextResponse } from "next/server";
import { adminAuth, ensureAdminApp } from "@/lib/firebase-admin";
import { checkRateLimit, extractClientIp } from "@/lib/rate-limit";
import { getFirestore } from "firebase-admin/firestore";
import { unwrapError } from "@/lib/errors";
import {
  normalizeOpenAIContent,
  type OpenAIResponseMessage,
} from "@/lib/openai-normalize";
import { isCannabisRelated, isContextuallyOnTopic } from "./keywords";

export const runtime = "nodejs";

type ClientMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  images?: { url: string; type: string }[];
};

type ChatRequest = {
  messages: ClientMessage[];
  chatType?: string; // Optional, keeping for backward compatibility
  sessionId?: string;
};

type VisionPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type OpenAIMessage =
  | { role: "system" | "assistant"; content: string }
  | { role: "user"; content: string | VisionPart[] };

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

// Modelos
const PRIMARY_MODEL = "gpt-5-mini";
const FALLBACK_MODELS = ["gpt-5"] as const;

// === Utilidades ===
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callOpenAI<T extends object>(
  body: T,
  apiKey: string,
  candidates: string[],
  timeoutMs = 30_000,
  maxRetries = 2
): Promise<Response> {
  let lastErrText = "";
  for (const model of candidates) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const resp = await fetch(OPENAI_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            // Si usás una key legacy sk-..., podés forzar el Project con este header opcional:
            ...(process.env.OPENAI_PROJECT_ID
              ? { "OpenAI-Project": process.env.OPENAI_PROJECT_ID }
              : {}),
          },
          body: JSON.stringify({ ...body, model }),
          signal: controller.signal,
          cache: "no-store",
        });
        clearTimeout(timer);

        if (resp.ok) {
          console.log("✅ OpenAI call succeeded with model:", model);
          return resp;
        }

        const text = await resp.text();
        lastErrText = text;

        // model_not_found / acceso → probá próximo modelo
        if (/model_not_found|does not have access|does not exist/i.test(text)) {
          break; // pasa al siguiente candidato
        }

        // 429/5xx → backoff y retry
        if (resp.status === 429 || (resp.status >= 500 && resp.status < 600)) {
          const delay = 500 * Math.pow(2, attempt); // 0.5s, 1s, 2s…
          await sleep(delay);
          continue;
        }

        // Otros errores → devolvé
        return new Response(text || "OpenAI error", { status: 500 });
      } catch (e: any) {
        clearTimeout(timer);
        if (e?.name === "AbortError") {
          // timeout → retry
          continue;
        }
        // error de red → retry
        await sleep(300);
        continue;
      }
    }
    // sigue con el próximo modelo si rompimos por model_not_found
  }
  return new Response(
    JSON.stringify({
      error: lastErrText || "No accessible model / exhausted retries",
    }),
    { status: 500 }
  );
}

const SYSTEM_PROMPT = `You are a comprehensive cannabis assistant. Answer ONLY questions related to cannabis, including:

CULTIVATION: Growing, plant health, nutrients, environment, pests, equipment, genetics, harvest, etc.
CONSUMPTION: Effects, strains, dosing, methods, storage, harm reduction, legality context, etc.

If the question is unrelated to cannabis, briefly refuse and ask to rephrase within cannabis scope. Be concise, actionable, and prioritize safety. Respond in the same language as the user's question (Spanish or English).`;

export async function POST(req: NextRequest) {
  try {
    // === Auth ===
    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader?.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json({ error: "missing_auth" }, { status: 401 });
    }
    const idToken = authHeader.split(" ")[1];
    let decoded: any;
    try {
      decoded = await adminAuth().verifyIdToken(idToken);
    } catch (err: unknown) {
      unwrapError(err);
      return NextResponse.json({ error: "invalid_auth" }, { status: 401 });
    }

    // === Premium ===
    if (
      process.env.REQUIRE_PREMIUM_FOR_AI === "true" &&
      !Boolean(decoded?.premium)
    ) {
      return NextResponse.json({ error: "premium_required" }, { status: 403 });
    }

    // === Rate limit ===
    const limit = Number(process.env.AI_CHAT_RATELIMIT_LIMIT || 20);
    const windowMs = Number(process.env.AI_CHAT_RATELIMIT_WINDOW_MS || 60_000);
    const ip = extractClientIp(req.headers) || "unknown";
    const key = `ai-chat:${decoded.uid}:${ip}`;
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

    // === Input ===
    const { messages, chatType, sessionId } = (await req.json()) as ChatRequest;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages_required" }, { status: 400 });
    }
    const latestMessage = messages[messages.length - 1];

    if (latestMessage.role !== "user") {
      return NextResponse.json(
        { error: "last_message_must_be_user" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "missing_OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    // === Topic guard (texto/imágenes) ===
    const latestHasImages = Boolean(latestMessage.images?.length);
    const directMatch = isCannabisRelated(latestMessage.content || "");
    const contextMatch = isContextuallyOnTopic(messages);
    const onTopic = latestHasImages || directMatch || contextMatch;

    if (!onTopic) {
      const refusal =
        "Solo puedo responder preguntas sobre cannabis (cultivo o consumo). Por favor, reformulá tu consulta relacionada al tema.";
      const currentSessionId =
        sessionId ||
        `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        ensureAdminApp();
        const db = getFirestore();
        const chatRef = db
          .collection("users")
          .doc(decoded.uid)
          .collection("aiChats")
          .doc(currentSessionId);

        const assistantMessage = {
          role: "assistant" as const,
          content: refusal,
          timestamp: new Date().toISOString(),
        };
        const toSave = sessionId
          ? [
              ...((await chatRef.get()).data()?.messages || []),
              latestMessage,
              assistantMessage,
            ]
          : [...messages, assistantMessage];

        const firstMessage = toSave[0] as ClientMessage | undefined;
        const chatData: Record<string, unknown> = {
          messages: toSave,
          lastUpdated: new Date().toISOString(),
          title:
            (firstMessage?.content?.slice(0, 50) || "New Chat") +
            ((firstMessage?.content?.length || 0) > 50 ? "..." : ""),
          ...(sessionId ? {} : { createdAt: new Date() }),
        };
        await chatRef.set(chatData, { merge: true });
      } catch (err: unknown) {
        console.error("Error saving refusal chat:", unwrapError(err));
      }
      return NextResponse.json({
        response: refusal,
        sessionId: currentSessionId,
      });
    }

    // === Construcción de mensajes para OpenAI ===
    const openaiMessages: OpenAIMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map<OpenAIMessage>((m) => {
        if (m.role === "user" && m.images?.length) {
          const parts: VisionPart[] = [
            { type: "text", text: m.content },
            ...m.images.map((img) => ({
              type: "image_url" as const,
              image_url: { url: img.url },
            })),
          ];
          return { role: "user", content: parts };
        }
        return { role: m.role, content: m.content };
      }),
    ];

    // === Llamada a OpenAI con fallback/timeout/retry ===
    const modelCandidates = [PRIMARY_MODEL, ...FALLBACK_MODELS];
    const resp = await callOpenAI(
      {
        messages: openaiMessages,
        temperature: 1,
        max_completion_tokens: 3500, // GPT-5 reasoning tokens + detailed responses
      },
      apiKey,
      modelCandidates
    );

    if (!resp.ok) {
      const text = await resp.text();
      console.error("OpenAI API error:", resp.status, text);
      return NextResponse.json(
        { error: text || "OpenAI error" },
        { status: 500 }
      );
    }

    const data = await resp.json();
    const choice0 = data?.choices?.[0] as
      | { message?: OpenAIResponseMessage; content?: unknown; [k: string]: any }
      | undefined;

    // Prefer normalized assistant message, but add robust fallbacks
    const message = choice0?.message as OpenAIResponseMessage | undefined;
    let content = normalizeOpenAIContent(message);

    // Fallback 1: some providers place text directly on choice.content
    if (!content) {
      const direct = normalizeOpenAIContent({
        content: choice0?.content,
      } as unknown as OpenAIResponseMessage);
      if (direct) content = direct;
    }

    // Fallback 2: stringify tool calls if they contain textual output
    if (!content && message && (message as any).tool_calls) {
      try {
        const toolText = JSON.stringify((message as any).tool_calls);
        if (toolText && toolText !== "{}" && toolText !== "[]") {
          content = toolText;
        }
      } catch {}
    }

    // Fallback 3: check if there's any content in the choice
    if (!content && choice0?.message?.content) {
      content = String(choice0.message.content);
    }

    // Final fallback: generic error-like message to avoid empty bubbles
    if (!content) {
      console.error(
        "No content found in OpenAI response, using fallback message"
      );
      content = "Lo siento, no pude generar una respuesta válida esta vez.";
    }
    const modelUsed = data?.model ?? PRIMARY_MODEL;

    // === Persistencia ===
    const currentSessionId =
      sessionId ||
      `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      ensureAdminApp();
      const db = getFirestore();
      const chatRef = db
        .collection("users")
        .doc(decoded.uid)
        .collection("aiChats")
        .doc(currentSessionId);

      const assistantMessage = {
        role: "assistant" as const,
        content,
        timestamp: new Date().toISOString(),
      };
      const toSave = sessionId
        ? [
            ...(((await chatRef.get()).data()?.messages ||
              []) as ClientMessage[]),
            messages[messages.length - 1],
            assistantMessage,
          ]
        : [...messages, assistantMessage];

      const firstMessage = toSave[0] as ClientMessage | undefined;
      const chatData: Record<string, unknown> = {
        messages: toSave,
        lastUpdated: new Date().toISOString(),
        title:
          (firstMessage?.content?.slice(0, 50) || "New Chat") +
          ((firstMessage?.content?.length || 0) > 50 ? "..." : ""),
        ...(sessionId ? {} : { createdAt: new Date() }),
        modelUsed, // <-- guardamos qué modelo respondió
      };
      await chatRef.set(chatData, { merge: true });
    } catch (err: unknown) {
      console.error("Error saving chat:", unwrapError(err));
    }

    return NextResponse.json({
      response: content,
      sessionId: currentSessionId,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: unwrapError(err, "Unexpected error") },
      { status: 500 }
    );
  }
}
