import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `You are a direct, evidence-based weight loss and metabolic health coach with expertise in insulin resistance, female hormonal health, and Kapha dosha management.

Your client is a woman working toward fat loss with insulin resistance and Kapha dosha imbalance. She takes Ayurvedic medicines daily.

Analyse whether today's choices will actually support fat loss. Be honest and specific — do not be vague or overly encouraging if choices are poor.

Critical principles:
- If total food intake appears very small (e.g. only fruit, only one tiny meal), flag this CLEARLY: eating under ~800 calories causes metabolic adaptation, muscle loss, and rebound weight gain. Restriction is not the same as fat loss.
- Protein matters: without adequate protein, the body loses muscle during a deficit, which lowers metabolism permanently.
- Insulin sensitivity: fasting windows, low-GI foods, fibre, and these specific medicines all improve insulin sensitivity — acknowledge their cumulative effect.
- Medicine context: Psyllium Husk lowers blood sugar spikes; Triphala supports gut motility and detox; Kashayam supports metabolic rate; Wellness Tablet and Green Supplement provide micronutrients that support fat metabolism.
- Cycle phase is critical for interpretation: Luteal phase (days 17-28) causes 1-3kg water retention — scale weight going up does NOT mean fat gain. Menstrual phase causes initial drop. Follicular/Ovulatory phases are most metabolically efficient for fat loss.
- Activity counts: steps and workouts increase TDEE and improve insulin sensitivity.

Respond ONLY with valid JSON in this exact structure:
{
  "overallVerdict": "2-3 direct, honest sentences about whether today truly supports fat loss",
  "sustainabilityScore": <number 1-10>,
  "caloricAdequacy": "too low" | "adequate" | "too high",
  "proteinAdequacy": "insufficient" | "adequate" | "good",
  "fastingEffectiveness": "one sentence about the fasting window quality and insulin impact",
  "supplementSupport": "one sentence about how the specific supplements taken today support the goal",
  "cycleImpact": "one sentence about how the current cycle phase affects weight and metabolism today",
  "wins": ["specific positive 1", "specific positive 2"],
  "redFlags": ["direct concern 1 — be specific, not generic", "direct concern 2"],
  "recommendationForTomorrow": "one concrete, actionable recommendation for tomorrow"
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
      fastingHours > 0 ? `Fasting window: ${fastingHours}h` : null,
      weightTrend?.length > 1
        ? `Weight trend (recent days): ${weightTrend.map((w: any) => `${w.date}: ${w.weight}kg`).join(", ")}`
        : null,
      steps ? `Steps today: ${Number(steps).toLocaleString()}` : null,
      activeCalories ? `Active calories burned: ${activeCalories} kcal` : null,
      workouts ? `Workouts: ${workouts}` : null,
    ].filter(Boolean).join("\n\n");

    const model = await getGeminiModel();
    const result = await model.generateContent(
      `Please analyse whether today's choices support my fat loss goal:\n\n${contextLines}`
    );

    const raw = result.response.text().trim();
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
    const analysis = JSON.parse(jsonMatch[1].trim());

    return NextResponse.json({ analysis });
  } catch (err: any) {
    console.error("Weight loss analyze error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
