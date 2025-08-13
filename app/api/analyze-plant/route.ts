import { type NextRequest, NextResponse } from "next/server"

// Mock OpenAI implementation for demo
// In production, uncomment the OpenAI import and implementation below

/*
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "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",
})
*/

export async function POST(request: NextRequest) {
  try {
    const { image, question } = await request.json()

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    if (!question) {
      return NextResponse.json({ error: "No question provided" }, { status: 400 })
    }

    // Mock response for demo purposes
    // Remove this and uncomment the OpenAI implementation below for production

    await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate API delay

    const mockAnalysis = `# Plant Health Analysis

## Overall Assessment
Based on the image provided, here's my analysis of your cannabis plant:

## Key Observations
- **Leaf Color**: The leaves show good overall health with vibrant green coloration
- **Growth Pattern**: Plant structure appears normal for its developmental stage
- **Environmental Conditions**: No obvious signs of environmental stress

## Potential Issues Identified
1. **Minor Nutrient Considerations**: Some slight variations in leaf color may indicate:
   - Possible nitrogen levels could be optimized
   - Phosphorus uptake appears adequate
   - Potassium levels seem balanced

2. **Environmental Factors**: 
   - Lighting appears adequate
   - No signs of heat stress visible
   - Humidity levels seem appropriate

## Detailed Recommendations

### Immediate Actions (Next 1-2 weeks):
- **Nutrition**: Consider a balanced feeding schedule with NPK ratio of 20-20-20 at 1/4 strength
- **Watering**: Maintain consistent moisture without overwatering
- **pH Monitoring**: Ensure soil pH stays between 6.0-7.0
- **Light Distance**: Maintain proper distance to prevent light burn

### Medium-term Care (2-4 weeks):
- **Training**: Consider low-stress training (LST) if in vegetative stage
- **Pruning**: Remove any yellowing lower leaves to redirect energy
- **Environmental Control**: Maintain 70-80°F temperature and 40-60% humidity

### Long-term Strategy:
- **Feeding Schedule**: Transition to bloom nutrients when flowering begins
- **Support Structure**: Install support for branches as plant grows
- **Pest Prevention**: Regular inspection for common pests

## Expected Timeline
- **Week 1**: Apply recommended feeding and monitor response
- **Week 2-3**: Look for improved leaf color and new growth
- **Week 4+**: Continue monitoring and adjust care as needed

## Important Notes
- This analysis is for educational purposes only
- Always follow local laws and regulations
- Consider consulting with experienced growers for complex issues
- Monitor plant response and adjust recommendations accordingly

*Analysis generated on ${new Date().toLocaleDateString()} for educational purposes.*`

    return NextResponse.json({ analysis: mockAnalysis })

    /* 
    // Real OpenAI implementation (uncomment for production):
    
    try {
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
    */
  } catch (error) {
    console.error("API route error:", error)
    return NextResponse.json(
      {
        error: "Internal server error. Please try again.",
      },
      { status: 500 },
    )
  }
}
