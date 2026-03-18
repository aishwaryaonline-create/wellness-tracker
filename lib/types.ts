export interface DayData {
  id?: string;
  date: string; // YYYY-MM-DD
  // Habits — Morning Ritual
  morningRitual: boolean;
  // Kashayam (scales with meal count)
  kashayamMorning: boolean;   // Meal 1
  kashayamEvening: boolean;   // Meal 2
  // Wellness Tablet (scales with meal count)
  wellnessTabletMorning: boolean;  // Meal 1
  wellnessTabletEvening: boolean;  // Meal 2
  // Green Supplement (scales with meal count)
  greenSupplementMorning: boolean;  // Meal 1
  greenSupplementEvening: boolean;  // Meal 2
  // Fixed habits
  psylliumHuskMorning: boolean;
  psylliumHuskEvening: boolean;
  triphalaChurnam: boolean;
  // Meal tracking
  mealCount: 1 | 2 | 3;
  firstMealTime: string; // HH:MM
  lastMealTime: string;  // HH:MM
  meal1: string; // meal description or "Nil"
  meal2: string;
  meal3: string;
  snacks: string;
  // Analysis & scoring
  analysisJson?: AyurvedaAnalysis | null;
  wellnessScore?: number | null;
}

export interface AyurvedaAnalysis {
  summary: string;
  score: number;
  doshaBalance: string;
  agniSupport: string;
  amaRisk: "low" | "medium" | "high";
  wins: string[];
  flags: string[];
  tipForTomorrow: string;
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
