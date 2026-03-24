"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import BlobBackground from "@/components/BlobBackground";
import FastingTracker from "@/components/FastingTracker";
import HabitChecklist from "@/components/HabitChecklist";
import MealLogger from "@/components/MealLogger";
import HealthDataCard from "@/components/HealthDataCard";
import WellnessScoreCard from "@/components/WellnessScoreCard";
import { DayData, AyurvedaAnalysis, WeightLossAnalysis, AnalysisContext } from "@/lib/types";
import {
  calcWellnessScore,
  calcOvernightFastHours,
  formatDateFull,
  getWeekDates,
  getDayLabel,
} from "@/lib/utils";

export type SectionSaveStatus = "idle" | "saving" | "saved" | "error";

const EMPTY_DAY = (date: string): DayData => ({
  date,
  morningRitual: false,
  kashayamMorning: false,
  kashayamEvening: false,
  wellnessTabletMorning: false,
  wellnessTabletEvening: false,
  greenSupplementMorning: false,
  greenSupplementEvening: false,
  psylliumHuskMorning: false,
  psylliumHuskEvening: false,
  triphalaChurnam: false,
  mealCount: 2,
  firstMealTime: "",
  lastMealTime: "",
  meal1: "",
  meal2: "",
  meal3: "",
  snacks: "",
  weight: null,
  cyclePhase: null,
  periodStart: false,
  sleepHours: null,
  steps: null,
  activeCalories: null,
  restingHeartRate: null,
  workouts: null,
  analysisJson: null,
  weightLossAnalysisJson: null,
  wellnessScore: null,
});

async function patchSection(date: string, fields: Partial<DayData>): Promise<{ id?: string }> {
  const res = await fetch("/api/notion", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, ...fields }),
  });
  const json = await res.json();
  if (!res.ok) {
    const detail = json.detail;
    const msg = [
      json.error || "Save failed",
      detail?.notionCode ? `[${detail.notionCode}]` : null,
      detail?.notionBody?.message && detail.notionBody.message !== json.error
        ? detail.notionBody.message
        : null,
    ].filter(Boolean).join(" ");
    throw new Error(msg);
  }
  return json.data ?? {};
}

export default function DayViewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dateParam = searchParams.get("date");

  const [today, setToday] = useState("");
  useEffect(() => {
    setToday(new Date().toISOString().slice(0, 10));
  }, []);
  const activeDate = dateParam || today || new Date().toISOString().slice(0, 10);

  const [dayData, setDayData] = useState<DayData>(EMPTY_DAY(activeDate));
  const [loading, setLoading] = useState(true);
  const [prevLastMealTime, setPrevLastMealTime] = useState("");
  const [prevLastMealLoaded, setPrevLastMealLoaded] = useState(false);
  const [weightTrend, setWeightTrend] = useState<Array<{ date: string; weight: number }>>([]);

  const dayDataRef = useRef<DayData>(dayData);

  // ── Per-section dirty state ────────────────────────────────────────────────
  const [dirtyFasting, setDirtyFasting] = useState(false);
  const [dirtyHealth, setDirtyHealth] = useState(false);
  const [dirtyHabits, setDirtyHabits] = useState(false);
  const [dirtyMeals, setDirtyMeals] = useState(false);
  const isDirty = dirtyFasting || dirtyHealth || dirtyHabits || dirtyMeals;

  // ── Per-section save status ────────────────────────────────────────────────
  const [fastingSaveStatus, setFastingSaveStatus] = useState<SectionSaveStatus>("idle");
  const [healthSaveStatus, setHealthSaveStatus] = useState<SectionSaveStatus>("idle");
  const [habitsSaveStatus, setHabitsSaveStatus] = useState<SectionSaveStatus>("idle");
  const [mealsSaveStatus, setMealsSaveStatus] = useState<SectionSaveStatus>("idle");

  const [saveError, setSaveError] = useState<string | null>(null);

  const weekDates = getWeekDates(new Date(activeDate + "T00:00:00"));

  const yesterday = (() => {
    const d = new Date(activeDate + "T00:00:00");
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();

  // ── Load data on date change ───────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setPrevLastMealLoaded(false);
    setPrevLastMealTime("");
    setDirtyFasting(false);
    setDirtyHealth(false);
    setDirtyHabits(false);
    setDirtyMeals(false);
    setFastingSaveStatus("idle");
    setHealthSaveStatus("idle");
    setHabitsSaveStatus("idle");
    setMealsSaveStatus("idle");

    const empty = EMPTY_DAY(activeDate);
    setDayData(empty);
    dayDataRef.current = empty;

    const todayFetch = fetch(`/api/notion?date=${activeDate}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setDayData(json.data);
          dayDataRef.current = json.data;
        }
      })
      .catch(console.error);

    const yesterdayFetch = fetch(`/api/notion?date=${yesterday}`)
      .then((r) => r.json())
      .then((json) => {
        setPrevLastMealTime(json.data?.lastMealTime || "");
      })
      .catch(() => {})
      .finally(() => setPrevLastMealLoaded(true));

    // Fetch week weight trend for analysis context
    const weekStart = weekDates[0];
    const weekEnd = weekDates[6];
    fetch(`/api/notion?start=${weekStart}&end=${weekEnd}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          const trend = (json.data as DayData[])
            .filter((d) => d.weight != null)
            .map((d) => ({ date: d.date, weight: d.weight! }));
          setWeightTrend(trend);
        }
      })
      .catch(() => {});

    Promise.all([todayFetch, yesterdayFetch]).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDate, yesterday]);

  // ── Beforeunload warning ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // ── Navigation with unsaved-changes check ─────────────────────────────────
  function navigateToDate(date: string) {
    if (isDirty) {
      if (!window.confirm("You have unsaved changes. Leave without saving?")) return;
    }
    setDirtyFasting(false);
    setDirtyHealth(false);
    setDirtyHabits(false);
    setDirtyMeals(false);
    router.replace(`/day?date=${date}`);
  }

  // ── Local field updaters ───────────────────────────────────────────────────
  const updateFastingField = useCallback((field: "firstMealTime" | "lastMealTime", val: string) => {
    const next = { ...dayDataRef.current, [field]: val };
    dayDataRef.current = next;
    setDayData(next);
    setDirtyFasting(true);
  }, []);

  const updateHealthField = useCallback((key: keyof DayData, val: any) => {
    const next = { ...dayDataRef.current, [key]: val };
    dayDataRef.current = next;
    setDayData(next);
    setDirtyHealth(true);
  }, []);

  const updateHabitField = useCallback((key: keyof DayData, val: boolean) => {
    const next = { ...dayDataRef.current, [key]: val };
    dayDataRef.current = next;
    setDayData(next);
    setDirtyHabits(true);
  }, []);

  const updateMealField = useCallback((key: string, val: string) => {
    const next = { ...dayDataRef.current, [key]: val };
    dayDataRef.current = next;
    setDayData(next);
    setDirtyMeals(true);
  }, []);

  const updateMealCount = useCallback((val: 1 | 2 | 3) => {
    const next = { ...dayDataRef.current, mealCount: val };
    dayDataRef.current = next;
    setDayData(next);
    setDirtyMeals(true);
  }, []);

  const updateAnalysis = useCallback((result: AyurvedaAnalysis) => {
    const next = { ...dayDataRef.current, analysisJson: result };
    dayDataRef.current = next;
    setDayData(next);
    setDirtyMeals(true);
  }, []);

  const updateWeightLossAnalysis = useCallback((result: WeightLossAnalysis) => {
    const next = { ...dayDataRef.current, weightLossAnalysisJson: result };
    dayDataRef.current = next;
    setDayData(next);
    setDirtyMeals(true);
  }, []);

  // ── Analysis context builder ───────────────────────────────────────────────
  const overnightFastHours = calcOvernightFastHours(prevLastMealTime, dayData.firstMealTime);

  function buildAnalysisContext(): AnalysisContext {
    const data = dayDataRef.current;
    const medicines: string[] = [];
    if (data.kashayamMorning) medicines.push("Kashayam (morning)");
    if (data.kashayamEvening) medicines.push("Kashayam (evening)");
    if (data.wellnessTabletMorning) medicines.push("Wellness Tablet (morning)");
    if (data.wellnessTabletEvening) medicines.push("Wellness Tablet (evening)");
    if (data.greenSupplementMorning) medicines.push("Green Supplement (morning)");
    if (data.greenSupplementEvening) medicines.push("Green Supplement (evening)");
    if (data.psylliumHuskMorning) medicines.push("Psyllium Husk (morning)");
    if (data.psylliumHuskEvening) medicines.push("Psyllium Husk (evening)");
    if (data.triphalaChurnam) medicines.push("Triphala Churnam");
    return {
      medicines,
      cyclePhase: data.cyclePhase ?? null,
      fastingHours: overnightFastHours,
      weightTrend,
      steps: data.steps ?? undefined,
      activeCalories: data.activeCalories ?? undefined,
      workouts: data.workouts ?? undefined,
    };
  }

  // ── Per-section save functions ─────────────────────────────────────────────
  const saveFasting = useCallback(async () => {
    setFastingSaveStatus("saving");
    try {
      const data = dayDataRef.current;
      const overnight = calcOvernightFastHours(prevLastMealTime, data.firstMealTime);
      const score = calcWellnessScore(data, overnight);
      const saved = await patchSection(activeDate, {
        firstMealTime: data.firstMealTime,
        lastMealTime: data.lastMealTime,
        wellnessScore: score.total,
      });
      if (saved.id) {
        dayDataRef.current = { ...dayDataRef.current, id: saved.id, wellnessScore: score.total };
        setDayData((prev) => ({ ...prev, id: saved.id, wellnessScore: score.total }));
      }
      setDirtyFasting(false);
      setFastingSaveStatus("saved");
      setTimeout(() => setFastingSaveStatus("idle"), 2000);
    } catch (err: any) {
      setSaveError(err.message || "Fasting save failed");
      setFastingSaveStatus("error");
      setTimeout(() => setFastingSaveStatus("idle"), 3000);
    }
  }, [activeDate, prevLastMealTime]);

  const saveHealth = useCallback(async () => {
    setHealthSaveStatus("saving");
    try {
      const data = dayDataRef.current;
      const saved = await patchSection(activeDate, {
        weight: data.weight,
        cyclePhase: data.cyclePhase,
        periodStart: data.periodStart,
        sleepHours: data.sleepHours,
        steps: data.steps,
        activeCalories: data.activeCalories,
        restingHeartRate: data.restingHeartRate,
        workouts: data.workouts,
      });
      if (saved.id) {
        dayDataRef.current = { ...dayDataRef.current, id: saved.id };
        setDayData((prev) => ({ ...prev, id: saved.id }));
      }
      setDirtyHealth(false);
      setHealthSaveStatus("saved");
      setTimeout(() => setHealthSaveStatus("idle"), 2000);
    } catch (err: any) {
      setSaveError(err.message || "Health save failed");
      setHealthSaveStatus("error");
      setTimeout(() => setHealthSaveStatus("idle"), 3000);
    }
  }, [activeDate]);

  const saveHabits = useCallback(async () => {
    setHabitsSaveStatus("saving");
    try {
      const data = dayDataRef.current;
      const overnight = calcOvernightFastHours(prevLastMealTime, data.firstMealTime);
      const score = calcWellnessScore(data, overnight);
      const saved = await patchSection(activeDate, {
        morningRitual: data.morningRitual,
        kashayamMorning: data.kashayamMorning,
        kashayamEvening: data.kashayamEvening,
        wellnessTabletMorning: data.wellnessTabletMorning,
        wellnessTabletEvening: data.wellnessTabletEvening,
        greenSupplementMorning: data.greenSupplementMorning,
        greenSupplementEvening: data.greenSupplementEvening,
        psylliumHuskMorning: data.psylliumHuskMorning,
        psylliumHuskEvening: data.psylliumHuskEvening,
        triphalaChurnam: data.triphalaChurnam,
        wellnessScore: score.total,
      });
      if (saved.id) {
        dayDataRef.current = { ...dayDataRef.current, id: saved.id, wellnessScore: score.total };
        setDayData((prev) => ({ ...prev, id: saved.id, wellnessScore: score.total }));
      }
      setDirtyHabits(false);
      setHabitsSaveStatus("saved");
      setTimeout(() => setHabitsSaveStatus("idle"), 2000);
    } catch (err: any) {
      setSaveError(err.message || "Habits save failed");
      setHabitsSaveStatus("error");
      setTimeout(() => setHabitsSaveStatus("idle"), 3000);
    }
  }, [activeDate, prevLastMealTime]);

  const saveMeals = useCallback(async () => {
    setMealsSaveStatus("saving");
    try {
      const data = dayDataRef.current;
      const overnight = calcOvernightFastHours(prevLastMealTime, data.firstMealTime);
      const score = calcWellnessScore(data, overnight);
      const saved = await patchSection(activeDate, {
        mealCount: data.mealCount,
        meal1: data.meal1,
        meal2: data.meal2,
        meal3: data.meal3,
        snacks: data.snacks,
        analysisJson: data.analysisJson,
        weightLossAnalysisJson: data.weightLossAnalysisJson,
        wellnessScore: score.total,
      });
      if (saved.id) {
        dayDataRef.current = { ...dayDataRef.current, id: saved.id, wellnessScore: score.total };
        setDayData((prev) => ({ ...prev, id: saved.id, wellnessScore: score.total }));
      }
      setDirtyMeals(false);
      setMealsSaveStatus("saved");
      setTimeout(() => setMealsSaveStatus("idle"), 2000);
    } catch (err: any) {
      setSaveError(err.message || "Meals save failed");
      setMealsSaveStatus("error");
      setTimeout(() => setMealsSaveStatus("idle"), 3000);
    }
  }, [activeDate, prevLastMealTime]);

  // ── Clear handlers ─────────────────────────────────────────────────────────
  const clearFasting = useCallback(async () => {
    if (!window.confirm("Clear fasting times for this day? This cannot be undone.")) return;
    const next = { ...dayDataRef.current, firstMealTime: "", lastMealTime: "" };
    dayDataRef.current = next;
    setDayData(next);
    setDirtyFasting(false);
    setFastingSaveStatus("saving");
    try {
      await patchSection(activeDate, { firstMealTime: "", lastMealTime: "" });
      setFastingSaveStatus("saved");
      setTimeout(() => setFastingSaveStatus("idle"), 1500);
    } catch (err: any) {
      setSaveError(err.message || "Clear fasting failed");
      setFastingSaveStatus("error");
      setTimeout(() => setFastingSaveStatus("idle"), 3000);
    }
  }, [activeDate]);

  const clearHealth = useCallback(async () => {
    if (!window.confirm("Clear all health data for this day? This cannot be undone.")) return;
    const cleared = {
      weight: null, cyclePhase: null, periodStart: false,
      sleepHours: null, steps: null, activeCalories: null,
      restingHeartRate: null, workouts: null,
    };
    const next = { ...dayDataRef.current, ...cleared };
    dayDataRef.current = next;
    setDayData(next);
    setDirtyHealth(false);
    setHealthSaveStatus("saving");
    try {
      await patchSection(activeDate, cleared);
      setHealthSaveStatus("saved");
      setTimeout(() => setHealthSaveStatus("idle"), 1500);
    } catch (err: any) {
      setSaveError(err.message || "Clear health failed");
      setHealthSaveStatus("error");
      setTimeout(() => setHealthSaveStatus("idle"), 3000);
    }
  }, [activeDate]);

  const clearHabits = useCallback(async () => {
    if (!window.confirm("Clear all habits for this day? This cannot be undone.")) return;
    const cleared = {
      morningRitual: false, kashayamMorning: false, kashayamEvening: false,
      wellnessTabletMorning: false, wellnessTabletEvening: false,
      greenSupplementMorning: false, greenSupplementEvening: false,
      psylliumHuskMorning: false, psylliumHuskEvening: false, triphalaChurnam: false,
    };
    const next = { ...dayDataRef.current, ...cleared };
    dayDataRef.current = next;
    setDayData(next);
    setDirtyHabits(false);
    setHabitsSaveStatus("saving");
    try {
      await patchSection(activeDate, cleared);
      setHabitsSaveStatus("saved");
      setTimeout(() => setHabitsSaveStatus("idle"), 1500);
    } catch (err: any) {
      setSaveError(err.message || "Clear habits failed");
      setHabitsSaveStatus("error");
      setTimeout(() => setHabitsSaveStatus("idle"), 3000);
    }
  }, [activeDate]);

  const clearMeals = useCallback(async () => {
    if (!window.confirm("Clear all meals and analysis for this day? This cannot be undone.")) return;
    const cleared = {
      meal1: "", meal2: "", meal3: "", snacks: "",
      analysisJson: null, weightLossAnalysisJson: null,
    };
    const next = { ...dayDataRef.current, ...cleared };
    dayDataRef.current = next;
    setDayData(next);
    setDirtyMeals(false);
    setMealsSaveStatus("saving");
    try {
      await patchSection(activeDate, cleared);
      setMealsSaveStatus("saved");
      setTimeout(() => setMealsSaveStatus("idle"), 1500);
    } catch (err: any) {
      setSaveError(err.message || "Clear meals failed");
      setMealsSaveStatus("error");
      setTimeout(() => setMealsSaveStatus("idle"), 3000);
    }
  }, [activeDate]);

  // ── Render ─────────────────────────────────────────────────────────────────
  const scoreBreakdown = calcWellnessScore(dayData, overnightFastHours);

  return (
    <div className="relative min-h-screen">
      <BlobBackground />

      <div className="relative z-10 max-w-md mx-auto px-4 pb-20">
        {/* Header */}
        <div className="pt-12 pb-3 flex items-center gap-3">
          <button
            onClick={() => {
              if (isDirty) {
                if (!window.confirm("You have unsaved changes. Leave without saving?")) return;
              }
              router.push("/");
            }}
          >
            <motion.span
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-full bg-white border border-pink-100 shadow-card flex items-center justify-center text-gray-600 hover:border-pink-300 transition-colors"
            >
              ←
            </motion.span>
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold text-gray-900 leading-tight" suppressHydrationWarning>
              {formatDateFull(activeDate)}
            </h1>
            {today && activeDate === today && (
              <span className="text-xs font-bold text-pink-500">Today</span>
            )}
          </div>
          {isDirty && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200"
            >
              Unsaved
            </motion.span>
          )}
        </div>

        {/* Day selector strip */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
          {weekDates.map((date) => {
            const isActive = date === activeDate;
            const isToday = today && date === today;
            const dayNum = new Date(date + "T00:00:00").getDate();
            const dayLabel = getDayLabel(date);
            return (
              <motion.button
                key={date}
                whileTap={{ scale: 0.93 }}
                onClick={() => navigateToDate(date)}
                className={`
                  flex-shrink-0 w-11 flex flex-col items-center py-2.5 px-1.5 rounded-2xl cursor-pointer
                  transition-all duration-200 border-2
                  ${isActive
                    ? "border-pink-500 bg-gradient-to-b from-pink-500 to-pink-400 text-white shadow-pink"
                    : isToday
                    ? "border-pink-200 bg-pink-50 text-pink-600"
                    : "border-transparent bg-white text-gray-500 shadow-card"}
                `}
              >
                <span className="text-[10px] font-semibold opacity-80">{dayLabel}</span>
                <span className="text-sm font-bold leading-none mt-0.5">{dayNum}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Save error banner */}
        {saveError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2"
          >
            <span className="text-red-500 text-sm leading-none mt-0.5">⚠</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-red-700 mb-0.5">Save failed</p>
              <p className="text-xs text-red-600 break-words">{saveError}</p>
            </div>
            <button onClick={() => setSaveError(null)} className="text-red-400 hover:text-red-600 text-lg leading-none flex-shrink-0">×</button>
          </motion.div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-36 animate-pulse border border-pink-50" />
            ))}
          </div>
        ) : (
          <>
            <WellnessScoreCard score={scoreBreakdown} />

            <div className="space-y-4">
              <FastingTracker
                firstMealTime={dayData.firstMealTime}
                lastMealTime={dayData.lastMealTime}
                prevLastMealTime={prevLastMealTime}
                prevLastMealLoaded={prevLastMealLoaded}
                onChange={updateFastingField}
                onSave={saveFasting}
                onClear={clearFasting}
                isDirty={dirtyFasting}
                saveStatus={fastingSaveStatus}
              />

              <HealthDataCard
                weight={dayData.weight ?? null}
                cyclePhase={dayData.cyclePhase ?? null}
                periodStart={dayData.periodStart ?? false}
                sleepHours={dayData.sleepHours ?? null}
                steps={dayData.steps ?? null}
                activeCalories={dayData.activeCalories ?? null}
                restingHeartRate={dayData.restingHeartRate ?? null}
                workouts={dayData.workouts ?? null}
                onChange={updateHealthField}
                onSave={saveHealth}
                onClear={clearHealth}
                isDirty={dirtyHealth}
                saveStatus={healthSaveStatus}
              />

              <HabitChecklist
                data={dayData}
                mealCount={dayData.mealCount}
                onChange={updateHabitField}
                onSave={saveHabits}
                onClear={clearHabits}
                isDirty={dirtyHabits}
                saveStatus={habitsSaveStatus}
              />

              <MealLogger
                mealCount={dayData.mealCount}
                meal1={dayData.meal1}
                meal2={dayData.meal2}
                meal3={dayData.meal3}
                snacks={dayData.snacks}
                analysis={dayData.analysisJson}
                weightLossAnalysis={dayData.weightLossAnalysisJson}
                analysisContext={buildAnalysisContext()}
                onMealChange={updateMealField}
                onMealCountChange={updateMealCount}
                onAnalysis={updateAnalysis}
                onWeightLossAnalysis={updateWeightLossAnalysis}
                onSave={saveMeals}
                onClear={clearMeals}
                isDirty={dirtyMeals}
                saveStatus={mealsSaveStatus}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
