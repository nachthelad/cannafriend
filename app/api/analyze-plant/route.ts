import { NextRequest, NextResponse } from "next/server";

// We import from openai if available; otherwise, use fetch to the REST endpoint.
// Using edge-friendly approach with fetch to avoid bundling issues.

export const runtime = "edge";

type Body = {
  question: string;
  imageBase64?: string;
  imageUrl?: string;
  imageType?: string;
};

export async function POST(req: NextRequest) {
  try {
    const {
      question,
      imageBase64,
      imageUrl,
      imageType = "image/jpeg",
    } = (await req.json()) as Body;
    if (!imageBase64 && !imageUrl) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const preferredModel = process.env.OPENAI_VISION_MODEL || "gpt-4.1";
    const fallbackModel = "gpt-4.1-mini";

    const buildPayload = (model: string) =>
      ({
        model,
        messages: [
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
