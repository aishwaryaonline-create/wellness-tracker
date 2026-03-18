import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert Ayurvedic nutritionist specializing in Kapha dosha management, metabolic health, and traditional Indian medicine.

Your patient is a woman working to balance her Kapha dosha, reduce Ama (metabolic toxins), support healthy Agni (digestive fire), address insulin resistance, and achieve sustainable weight loss.

Analyze the meals provided using Ayurvedic principles:
- **Kapha dosha**: Kapha is heavy, cold, oily, slow. Kapha-pacifying foods are light, warm, dry, spicy, bitter, astringent. Avoid heavy, sweet, sour, salty, cold, oily foods.
- **Ama reduction**: Ama is undigested toxins that clog channels. Avoid cold foods, heavy meals, incompatible food combinations, overeating. Favor warm, well-cooked, easily digestible foods.
- **Agni support**: Digestive fire needs to be stoked. Use ginger, black pepper, cumin, coriander. Eat main meal at midday. Avoid eating late at night.
- **Insulin resistance**: Avoid refined carbs, excess fruit, sugar, white rice. Favor protein, fiber, bitter vegetables, fenugreek, turmeric.
- **The 6 Rasas (tastes)**: Sweet (madhura), Sour (amla), Salty (lavana), Pungent (katu), Bitter (tikta), Astringent (kashaya). For Kapha, emphasize pungent, bitter, astringent. Minimize sweet, sour, salty.
- **Food combining**: Avoid milk with sour fruits, fish with dairy, fruit with meals, cold + hot foods.
- **Timing**: Largest meal at noon. Light dinner before 7pm ideal. Break fast gently.

Respond ONLY with valid JSON in this exact structure:
{
  "summary": "2-3 sentence overview of today's food choices",
  "score": <number 1-10>,
  "doshaBalance": "one sentence about dosha impact",
  "agniSupport": "one sentence about how these foods affect digestive fire",
  "amaRisk": "low" | "medium" | "high",
  "wins": ["specific positive choice 1", "specific positive choice 2"],
  "flags": ["specific concern 1", "specific concern 2"],
  "tipForTomorrow": "one specific, actionable suggestion for tomorrow"
}`;

export async function POST(req: NextRequest) {
  try {
    const { mealLog } = await req.json();

    if (!mealLog?.trim()) {
      return NextResponse.json(
        { error: "No meal log provided" },
        { status: 400 }
      );
    }

    const stream = client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Please analyze my meals for today:\n\n${mealLog}`,
        },
      ],
    });

    const response = await stream.finalMessage();

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from AI");
    }

    const raw = textBlock.text.trim();
    // Extract JSON if wrapped in markdown code blocks
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
    const jsonStr = jsonMatch[1].trim();

    const analysis = JSON.parse(jsonStr);

    return NextResponse.json({ analysis });
  } catch (err: any) {
    console.error("Analyze error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
