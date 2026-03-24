export interface DayData {
  id?: string;
  date: string; // YYYY-MM-DD
  // Habits — Morning Ritual
  morningRitual: boolean;
  // Kashayam (scales with meal count)
  kashayamMorning: boolean;
  kashayamEvening: boolean;
  // Wellness Tablet (scales with meal count)
  wellnessTabletMorning: boolean;
  wellnessTabletEvening: boolean;
  // Green Supplement (scales with meal count)
  greenSupplementMorning: boolean;
  greenSupplementEvening: boolean;
  // Fixed habits
  psylliumHuskMorning: boolean;
  psylliumHuskEvening: boolean;
  triphalaChurnam: boolean;
  // Meal tracking
  mealCount: 1 | 2 | 3;
  firstMealTime: string; // HH:MM
  lastMealTime: string;  // HH:MM
  meal1: string;
  meal2: string;
  meal3: string;
  snacks: string;
  // Health metrics
  weight?: number | null;
  cyclePhase?: string | null;
  periodStart?: boolean;
  sleepHours?: number | null;
  steps?: number | null;
  activeCalories?: number | null;
  restingHeartRate?: number | null;
  workouts?: string | null;
  // Analysis & scoring
  analysisJson?: AyurvedaAnalysis | null;
  weightLossAnalysisJson?: WeightLossAnalysis | null;
  wellnessScore?: number | null;
}

export interface AyurvedaAnalysis {
  summary: string;
  score: number;
  scoreLabel?: string;
  doshaBalance: string;
  agniSupport: string;
  amaRisk: "low" | "medium" | "high";
  amaNote?: string;
  wins: string[];
  flags: string[];
  hormonalNote?: string;
  tipForTomorrow: string;
}

export interface WeightLossAnalysis {
  overallVerdict: string;
  sustainabilityScore: number;
  caloricAdequacy: "too low" | "adequate" | "too high";
  proteinAdequacy: "insufficient" | "adequate" | "good";
  fastingEffectiveness: string;
  supplementSupport: string;
  cycleImpact: string;
  wins: string[];
  redFlags: string[];
  recommendationForTomorrow: string;
}

export interface WellnessScoreBreakdown {
  total: number;   // 0–100
  fasting: number; // 0–30
  window: number;  // 0–20
  meals: number;   // 0–30
  habits: number;  // 0–20
  hasMealData: boolean;
  hasFastData: boolean;
}

export interface AnalysisContext {
  medicines: string[];
  cyclePhase: string | null;
  fastingHours: number;
  weightTrend: Array<{ date: string; weight: number }>;
  steps?: number;
  activeCalories?: number;
  workouts?: string;
}
