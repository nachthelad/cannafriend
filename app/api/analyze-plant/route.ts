import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey:
    "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",
})

export async function POST(request: NextRequest) {
  try {
    const { image, question } = await request.json()

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    if (!question) {
      return NextResponse.json({ error: "No question provided" }, { status: 400 })
    }

    // Call OpenAI API with vision capabilities
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert cannabis cultivation advisor. ${question}

Please provide a detailed analysis including:
1. Overall plant health assessment
2. Any visible nutrient deficiencies or excesses
3. Signs of pests or diseases
4. Environmental stress indicators
5. Specific actionable recommendations
6. Timeline for expected improvements

Format your response with clear headings and bullet points for easy reading.`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${image}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    })

    const analysis = response.choices[0]?.message?.content

    if (!analysis) {
      return NextResponse.json({ error: "No analysis received from AI" }, { status: 500 })
    }

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error("OpenAI API error:", error)

    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes("rate_limit")) {
        return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 })
      }
      if (error.message.includes("invalid_api_key")) {
        return NextResponse.json({ error: "Invalid API key configuration" }, { status: 401 })
      }
      if (error.message.includes("content_policy")) {
        return NextResponse.json({ error: "Image content violates policy" }, { status: 400 })
      }
    }

    return NextResponse.json({ error: "Failed to analyze image. Please try again." }, { status: 500 })
  }
}
