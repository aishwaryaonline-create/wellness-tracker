import { DayData, WellnessScoreBreakdown } from "./types";

export function calcFastHours(firstMeal: string, lastMeal: string): number {
  if (!firstMeal || !lastMeal) return 0;
  const [fH, fM] = firstMeal.split(":").map(Number);
  const [lH, lM] = lastMeal.split(":").map(Number);
  const eatWindowMins = lH * 60 + lM - (fH * 60 + fM);
  if (eatWindowMins <= 0) return 0;
  const fastMins = 24 * 60 - eatWindowMins;
  return Math.round((fastMins / 60) * 10) / 10;
}

export function calcEatWindowHours(firstMeal: string, lastMeal: string): number {
  if (!firstMeal || !lastMeal) return 0;
  const [fH, fM] = firstMeal.split(":").map(Number);
  const [lH, lM] = lastMeal.split(":").map(Number);
  const mins = lH * 60 + lM - (fH * 60 + fM);
  if (mins <= 0) return 0;
  return Math.round((mins / 60) * 10) / 10;
}

/** Hours between previous day's last meal and today's first meal (crosses midnight). */
export function calcOvernightFastHours(prevLastMeal: string, todayFirstMeal: string): number {
  if (!prevLastMeal || !todayFirstMeal) return 0;
  const [lH, lM] = prevLastMeal.split(":").map(Number);
  const [fH, fM] = todayFirstMeal.split(":").map(Number);
  const minsToMidnight = 24 * 60 - (lH * 60 + lM);
  const minsFromMidnight = fH * 60 + fM;
  return Math.round(((minsToMidnight + minsFromMidnight) / 60) * 10) / 10;
}

export function getFastRating(fastHours: number): string {
  if (fastHours >= 18) return "Excellent";
  if (fastHours >= 16) return "Great";
  if (fastHours >= 14) return "Good";
  if (fastHours >= 12) return "Moderate";
  return "Short";
}

/** Returns active habit booleans. Medicines scale up to 2 meals only. */
function getActiveHabits(day: DayData): boolean[] {
  const mc = Math.min(day.mealCount ?? 2, 2);
  return [
    day.morningRitual,
    day.kashayamMorning,
    ...(mc >= 2 ? [day.kashayamEvening] : []),
    day.weightLossTabletMorning,
    ...(mc >= 2 ? [day.weightLossTabletEvening] : []),
    day.spirulinaMorning,
    ...(mc >= 2 ? [day.spirulinaEvening] : []),
    day.psylliumHuskMorning,
    day.psylliumHuskEvening,
    day.triphalaChurnam,
  ];
}

/** Habit completion rate as a 0–1 fraction. */
export function calcHabitRate(day: DayData): number {
  const habits = getActiveHabits(day);
  if (habits.length === 0) return 0;
  return habits.filter(Boolean).length / habits.length;
}

/** Habit score 0–10 (for display). */
export function calcHabitScore(day: DayData): number {
  return Math.round(calcHabitRate(day) * 10 * 10) / 10;
}

/** Total active habit count. Medicines only scale up to 2 meals. */
export function totalHabitCount(mealCount: 1 | 2 | 3): number {
  const medicineCount = Math.min(mealCount, 2);
  // morningRitual(1) + kashayam×mc + wlTablet×mc + spirulina×mc + psylliumX2(2) + triphala(1)
  return 1 + medicineCount + medicineCount + medicineCount + 2 + 1;
}

/**
 * 100-point wellness score:
 *   Fasting hours  — 30 pts  (16 h = full, linear below)
 *   Eating window  — 20 pts  (≤6 h = full, ≥12 h = 0, linear between)
 *   Meal quality   — 30 pts  (AI score 1-10 → 0-30)
 *   Habits         — 20 pts  (completion rate × 20)
 */
export function calcWellnessScore(day: DayData, overnightFastHours = 0): WellnessScoreBreakdown {
  const sameDayFastHours = calcFastHours(day.firstMealTime, day.lastMealTime);
  // Prefer overnight fast (crosses midnight) when available, else use same-day estimate
  const fastHours = overnightFastHours > 0 ? overnightFastHours : sameDayFastHours;
  const eatHours = calcEatWindowHours(day.firstMealTime, day.lastMealTime);
  const aiScore = day.analysisJson?.score ?? null;
  const hasFastData = fastHours > 0;
  const hasMealData = aiScore !== null;

  // Fasting: 30 pts, 16 h = max
  const fastingPts = hasFastData ? Math.min(fastHours / 16, 1) * 30 : 0;

  // Eating window: 20 pts, ≤6 h = max, ≥12 h = 0
  let windowPts = 0;
  if (hasFastData) {
    windowPts =
      eatHours <= 6
        ? 20
        : eatHours >= 12
        ? 0
        : ((12 - eatHours) / 6) * 20;
  }

  // Meal quality: 30 pts
  const mealPts = hasMealData ? (aiScore! / 10) * 30 : 0;

  // Habits: 20 pts
  const habitPts = calcHabitRate(day) * 20;

  // Only count components that have data towards total
  const activePts = fastingPts + windowPts + mealPts + habitPts;
  // Max possible given available data
  const maxPossible =
    (hasFastData ? 30 : 0) +
    (hasFastData ? 20 : 0) +
    (hasMealData ? 30 : 0) +
    20;
  // Scale to 100 if not all data present, else use raw sum
  const total =
    maxPossible > 0
      ? Math.round((activePts / maxPossible) * 100)
      : 0;

  return {
    total,
    fasting: Math.round(fastingPts * 10) / 10,
    window: Math.round(windowPts * 10) / 10,
    meals: Math.round(mealPts * 10) / 10,
    habits: Math.round(habitPts * 10) / 10,
    hasMealData,
    hasFastData,
  };
}

export function getWeekDates(refDate?: Date): string[] {
  const now = refDate || new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export function formatTime12(time24: string): string {
  if (!time24) return "--";
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function getDayLabel(dateStr: string): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const d = new Date(dateStr + "T00:00:00");
  return days[d.getDay()];
}

export function formatDateFull(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  // Use explicit "en-US" + UTC timeZone so server and client render identically
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
