import { NextRequest, NextResponse } from "next/server";
import { adminAuth, ensureAdminApp } from "@/lib/firebase-admin";
import { checkRateLimit, extractClientIp } from "@/lib/rate-limit";
import { getFirestore } from "firebase-admin/firestore";

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
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
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

    const { messages, chatType } = (await req.json()) as ChatRequest;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages required" }, { status: 400 });
    }

    const latestMessage = messages[messages.length - 1];
    if (latestMessage.role !== "user") {
      return NextResponse.json({ error: "Last message must be from user" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    // System prompts based on chat type
    const systemPrompts = {
      consumer: `You are a helpful cannabis consumption advisor. Help users with rolling techniques, dosage, storage, strain selection, and safe consumption practices. Be friendly and prioritize safety.`,
      "plant-analysis": `You are an expert cannabis cultivation advisor. Help with plant health diagnosis, growth stages, nutrients, environmental conditions, and cultivation best practices. Provide specific, actionable advice.`,
    };

    const systemPrompt = systemPrompts[chatType] || systemPrompts.consumer;

    // Check if we have images to determine model
    const hasImages = messages.some(msg => msg.images && msg.images.length > 0);
    const model = hasImages ? "gpt-4-vision-preview" : "gpt-4";

    // Build OpenAI messages
    const openaiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map(msg => {
        if (msg.role === "user" && msg.images && msg.images.length > 0) {
          return {
            role: "user",
            content: [
              { type: "text", text: msg.content },
              ...msg.images.map(img => ({
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
      return NextResponse.json({ error: text || "OpenAI error" }, { status: 500 });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? "";

    // Save chat session to Firebase
    let newSessionId = sessionId;
    if (!sessionId) {
      newSessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    try {
      ensureAdminApp();
      const db = getFirestore();
      const chatRef = db.collection("users").doc(decoded.uid).collection("aiChats").doc(newSessionId);

      const assistantMessage = {
        role: "assistant" as const,
        content,
        timestamp: new Date().toISOString(),
      };

      const chatData = {
        messages: [...messages, assistantMessage],
        chatType,
        lastUpdated: new Date().toISOString(),
        title: messages[0]?.content.slice(0, 50) + (messages[0]?.content.length > 50 ? "..." : "") || "New Chat",
        createdAt: sessionId ? undefined : new Date(), // Only set createdAt for new chats
      };

      await chatRef.set(chatData, { merge: true });
    } catch (error) {
      // Database error shouldn't break the response
      console.error("Error saving chat:", error);
    }

    return NextResponse.json({ 
      response: content,
      sessionId: newSessionId,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}