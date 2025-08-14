import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
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
