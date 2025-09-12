import { NextRequest, NextResponse } from "next/server";
import { adminAuth, ensureAdminApp } from "@/lib/firebase-admin";
import { checkRateLimit, extractClientIp } from "@/lib/rate-limit";
import { getFirestore } from "firebase-admin/firestore";
import { unwrapError } from "@/lib/errors";

export const runtime = "nodejs";

type ChatRequest = {
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    images?: { url: string; type: string }[];
    timestamp: string;
  }>;
  chatType: "consumer" | "plant-analysis";
  sessionId?: string;
};

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
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

    // Premium check
    if (
      process.env.REQUIRE_PREMIUM_FOR_AI === "true" &&
      !Boolean((decoded as any)?.premium)
    ) {
      return NextResponse.json({ error: "premium_required" }, { status: 403 });
    }

    // Rate limiting
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

    const { messages, chatType, sessionId } = (await req.json()) as ChatRequest;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages required" }, { status: 400 });
    }

    const latestMessage = messages[messages.length - 1];
    if (latestMessage.role !== "user") {
      return NextResponse.json(
        { error: "Last message must be from user" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    // System prompts based on chat type (hard domain restriction)
    const systemPrompts = {
      consumer: `You are a cannabis-only assistant. You must only answer questions directly related to cannabis consumption or general cannabis context (e.g., strains, effects, storage, dosing, harm reduction, legality context). If the user asks something unrelated to cannabis, refuse briefly and ask them to rephrase within cannabis scope. Do not provide unrelated general knowledge. Be concise, actionable, and prioritize safety.`,
      "plant-analysis": `You are a cannabis cultivation–only assistant. You must only answer questions about cannabis growing, plant health diagnosis, growth stages, nutrients, environment, pests, and best practices. If the user asks anything outside cannabis cultivation/consumption, refuse briefly and ask them to rephrase within cannabis scope. Provide specific, actionable, safe advice.`,
    } as const;

    const systemPrompt = systemPrompts[chatType] || systemPrompts.consumer;

    // Check if we have images to determine model
    const hasImages = messages.some((msg) => msg.images && msg.images.length > 0);
    const latestHasImages = Boolean(
      latestMessage.images && latestMessage.images.length > 0
    );

    // Lightweight topic guard (Spanish/English keywords). Images are considered on-topic.
    const isCannabisRelated = (text: string) => {
      const t = (text || "").toLowerCase();
      const kw = [
        // ES
        "cannabis", "marihuana", "marihuanna", "hierba", "porro", "porros", "fumada", "vapeo", "vaporizador", "cacho", "cogollo", "flor", "resina", "hachis", "cultivo", "plantas", "planta",
        "indica", "sativa", "hibrida", "cep", "cepa", "semillas", "germinacion", "vegetativa", "floracion", "cosecha", "curado", "secado",
        "thc", "cbd", "terpenos", "dosificacion", "dose", "dosis", "consumo", "tolerancia", "tolerancia",
        "riego", "sustrato", "ph", "ec", "nutrientes", "abono", "fertilizante", "luz", "led", "ppm", "plaga", "deficiencia",
        // EN
        "weed", "marijuana", "hemp", "joint", "bong", "vape", "strain", "flower", "nug", "bud",
        "grow", "growing", "cultivation", "seed", "germination", "veg", "flowering", "harvest", "dry", "cure",
        "thc", "cbd", "terpene", "dose", "dosage", "consumption", "tolerance",
        "watering", "substrate", "soil", "coco", "ph", "ec", "nutrient", "fertilizer", "light", "led", "ppm", "pest", "deficiency"
      ];
      return kw.some((k) => t.includes(k));
    };

    // If images are present, optionally verify they are cannabis-related via a tiny vision check
    const imageGuardEnabled = (process.env.AI_IMAGE_GUARD_ENABLED || "true").toLowerCase() !== "false";
    let imagesLookOnTopic = latestHasImages; // default to true if images exist and guard disabled
    if (latestHasImages && imageGuardEnabled) {
      try {
        const visionMessages = [
          {
            role: "system",
            content:
              "You are a strict image gatekeeper for a cannabis app. Answer ONLY with 'YES' or 'NO'. Respond 'YES' if ALL provided images are clearly related to cannabis (e.g., cannabis plants, buds, leaves, grow tents, nutrients/fertilizers used for cannabis, paraphernalia like joints, bongs, vapes). Respond 'NO' if any image is unrelated (people, pets, sports, random objects, landscapes not obviously grows)."
          },
          {
            role: "user",
            // Provide minimal context and images
            content: [
              { type: "text", text: (latestMessage.content || "").slice(0, 200) },
              ...((latestMessage.images || []).slice(0, 3).map((img) => ({
                type: "image_url",
                image_url: { url: img.url },
              })))
            ] as any,
          },
        ];

        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4.1-mini",
            messages: visionMessages,
            temperature: 0,
            max_tokens: 1,
          }),
          cache: "no-store",
        });

        if (resp.ok) {
          const j = await resp.json();
          const txt = (j?.choices?.[0]?.message?.content || "").toString().trim().toUpperCase();
          imagesLookOnTopic = txt.startsWith("Y");
        } else {
          // If the guard fails, default to allowing to avoid blocking falsely
          imagesLookOnTopic = true;
        }
      } catch {
        imagesLookOnTopic = true;
      }
    }

    const onTopic = (!latestHasImages && isCannabisRelated(latestMessage.content || "")) || (latestHasImages && imagesLookOnTopic);

    if (!onTopic) {
      // Refuse without calling OpenAI; persist conversation as usual
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

        let messagesToSave: ChatRequest["messages"] = [];
        if (sessionId) {
          const existing = await chatRef.get();
          const existingMessages = (existing.exists ? (existing.data()?.messages as ChatRequest["messages"]) : []) || [];
          const latestUser = messages[messages.length - 1];
          messagesToSave = [...existingMessages, latestUser, assistantMessage];
        } else {
          messagesToSave = [...messages, assistantMessage];
        }

        const firstMessage = messagesToSave[0];
        const chatData: Record<string, unknown> = {
          messages: messagesToSave,
          chatType,
          lastUpdated: new Date().toISOString(),
          title:
            (firstMessage?.content?.slice(0, 50) || "New Chat") +
            (firstMessage?.content && firstMessage.content.length > 50 ? "..." : ""),
        };
        if (!sessionId) {
          chatData.createdAt = new Date();
        }

        await chatRef.set(chatData, { merge: true });
      } catch (err: unknown) {
        console.error("Error saving refusal chat:", unwrapError(err));
      }

      return NextResponse.json({
        response: refusal,
        sessionId: sessionId || currentSessionId,
      });
    }
    const model = hasImages ? "gpt-4.1-mini" : "gpt-4.1";

    // Build OpenAI messages
    const openaiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg) => {
        if (msg.role === "user" && msg.images && msg.images.length > 0) {
          return {
            role: "user",
            content: [
              { type: "text", text: msg.content },
              ...msg.images.map((img) => ({
                type: "image_url",
                image_url: { url: img.url },
              })),
            ],
          };
        } else {
          return {
            role: msg.role,
            content: msg.content,
          };
        }
      }),
    ];

    const endpoint = "https://api.openai.com/v1/chat/completions";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: text || "OpenAI error" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? "";

    // Generate session ID if needed
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
      // Persist conversation.
      // If this is an existing session, prefer appending the latest user
      // message and assistant reply to the stored history to avoid any
      // client-state desync that could drop turns.
      let messagesToSave: ChatRequest["messages"] = [];
      if (sessionId) {
        const existing = await chatRef.get();
        const existingMessages = (existing.exists ? (existing.data()?.messages as ChatRequest["messages"]) : []) || [];
        const latestUser = messages[messages.length - 1];
        messagesToSave = [...existingMessages, latestUser, assistantMessage];
      } else {
        messagesToSave = [...messages, assistantMessage];
      }

      const firstMessage = messagesToSave[0];
      const chatData: Record<string, unknown> = {
        messages: messagesToSave,
        chatType,
        lastUpdated: new Date().toISOString(),
        title:
          (firstMessage?.content?.slice(0, 50) || "New Chat") +
          (firstMessage?.content && firstMessage.content.length > 50 ? "..." : ""),
      };
      if (!sessionId) {
        chatData.createdAt = new Date();
      }

      await chatRef.set(chatData, { merge: true });
    } catch (err: unknown) {
      // Database error shouldn't break the response
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
