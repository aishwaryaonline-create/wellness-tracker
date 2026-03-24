import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `You are an expert Ayurvedic nutritionist specialising in Kapha dosha management, metabolic health, and traditional Indian medicine.

Your patient is a woman working to balance her Kapha dosha, reduce Ama (metabolic toxins), support healthy Agni (digestive fire), address insulin resistance, and achieve sustainable weight loss.

Analyse the meals and context provided using Ayurvedic principles:
- **Kapha dosha**: Kapha is heavy, cold, oily, slow. Kapha-pacifying foods are light, warm, dry, spicy, bitter, astringent.
- **Ama reduction**: Avoid cold foods, heavy meals, incompatible food combinations, overeating. Favour warm, well-cooked, easily digestible foods.
- **Agni support**: Use ginger, black pepper, cumin, coriander. Eat main meal at midday. Avoid eating late at night.
- **Insulin resistance**: Avoid refined carbs, excess fruit, sugar, white rice. Favour protein, fibre, bitter vegetables.
- **The 6 Rasas**: Emphasise pungent, bitter, astringent for Kapha. Minimise sweet, sour, salty.
- **Medicines**: Kashayam supports metabolism; Wellness Tablet provides nutrients; Green Supplement/Spirulina supports detox; Psyllium Husk supports gut and blood sugar; Triphala Churnam supports digestion and cleansing.
- **Cycle phase awareness**: In Luteal phase, progesterone is high — acknowledge cravings as hormonal and normal, not a failure. In Menstrual phase, iron and warmth are important.

Respond ONLY with valid JSON in this exact structure:
{
  "summary": "2-3 sentence overview of today's food choices",
  "score": <number 1-10>,
  "scoreLabel": "e.g. Great Day / Good Effort / Room to Grow / Needs Attention",
  "doshaBalance": "one sentence about dosha impact",
  "agniSupport": "one sentence about how these foods affect digestive fire",
  "amaRisk": "low" | "medium" | "high",
  "amaNote": "one sentence explaining the ama risk level",
  "wins": ["specific positive choice 1", "specific positive choice 2"],
  "flags": ["specific concern 1", "specific concern 2"],
  "hormonalNote": "if cycle phase context provided, one sentence acknowledging hormonal impact — otherwise omit this field",
  "tipForTomorrow": "one specific, actionable suggestion for tomorrow"
}`;

async function getGeminiModel() {
  const modelsRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
  );
  const modelsData = await modelsRes.json();
  const available = modelsData.models?.find((m: any) =>
    m.supportedGenerationMethods?.includes("generateContent")
  );
  const modelName = available?.name?.replace("models/", "") ?? "gemini-1.5-flash-latest";
  return genAI.getGenerativeModel({ model: modelName, systemInstruction: SYSTEM_PROMPT });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mealLog, medicines, cyclePhase, fastingHours, weightTrend, steps, activeCalories, workouts } = body;

    if (!mealLog?.trim()) {
      return NextResponse.json({ error: "No meal log provided" }, { status: 400 });
    }

    const contextLines = [
      `Today's meals:\n${mealLog}`,
      medicines?.length ? `Medicines/supplements taken today: ${medicines.join(", ")}` : null,
      cyclePhase ? `Current cycle phase: ${cyclePhase}` : null,
      fastingHours > 0 ? `Fasting hours today: ${fastingHours}h` : null,
      weightTrend?.length > 1
        ? `Weight trend (recent days): ${weightTrend.map((w: any) => `${w.date}: ${w.weight}kg`).join(", ")}`
        : null,
      steps ? `Steps today: ${Number(steps).toLocaleString()}` : null,
      activeCalories ? `Active calories burned: ${activeCalories} kcal` : null,
      workouts ? `Workouts: ${workouts}` : null,
    ].filter(Boolean).join("\n\n");

    const model = await getGeminiModel();
    const result = await model.generateContent(
      `Please analyse my day from an Ayurvedic perspective:\n\n${contextLines}`
    );

    const raw = result.response.text().trim();
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
    const analysis = JSON.parse(jsonMatch[1].trim());

    return NextResponse.json({ analysis });
  } catch (err: any) {
    console.error("Ayurveda analyze error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
