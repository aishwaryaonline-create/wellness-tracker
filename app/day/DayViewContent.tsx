"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import BlobBackground from "@/components/BlobBackground";
import FastingTracker from "@/components/FastingTracker";
import HabitChecklist from "@/components/HabitChecklist";
import MealLogger from "@/components/MealLogger";
import WellnessScoreCard from "@/components/WellnessScoreCard";
import { DayData, AyurvedaAnalysis } from "@/lib/types";
import {
  calcWellnessScore,
  calcOvernightFastHours,
  formatDateFull,
  getWeekDates,
  getDayLabel,
} from "@/lib/utils";

const EMPTY_DAY = (date: string): DayData => ({
  date,
  morningRitual: false,
  kashayamMorning: false,
  kashayamEvening: false,
  weightLossTabletMorning: false,
  weightLossTabletEvening: false,
  spirulinaMorning: false,
  spirulinaEvening: false,
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
  analysisJson: null,
  wellnessScore: null,
});

// Confirm dialog helper — uses native confirm for simplicity
function confirmClear(section: string): boolean {
  return window.confirm(`Clear all ${section} data for this day? This cannot be undone.`);
}

export default function DayViewContent() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const today = new Date().toISOString().slice(0, 10);
  const activeDate = dateParam || today;

  const [dayData, setDayData] = useState<DayData>(EMPTY_DAY(activeDate));
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [loading, setLoading] = useState(true);
  const [prevLastMealTime, setPrevLastMealTime] = useState("");
  const [prevLastMealLoaded, setPrevLastMealLoaded] = useState(false);

  // Always-current ref so save() never closes over stale state
  const dayDataRef = useRef<DayData>(dayData);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const weekDates = getWeekDates(new Date(activeDate + "T00:00:00"));

  // Yesterday's date string
  const yesterday = (() => {
    const d = new Date(activeDate + "T00:00:00");
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();

  // Load today's data and yesterday's last meal time in parallel
  useEffect(() => {
    setLoading(true);
    setPrevLastMealLoaded(false);
    setPrevLastMealTime("");
    const empty = EMPTY_DAY(activeDate);
    setDayData(empty);
    dayDataRef.current = empty;
    clearTimeout(debounceRef.current);

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

    Promise.all([todayFetch, yesterdayFetch]).finally(() => setLoading(false));
  }, [activeDate, yesterday]);

  const save = useCallback(async (data: DayData) => {
    setSaving(true);
    setSaveStatus("saving");
    try {
      const breakdown = calcWellnessScore(data);
      const withScore = { ...data, wellnessScore: breakdown.total };
      const res = await fetch("/api/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(withScore),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      if (json.data?.id) {
        setDayData((prev) => ({ ...prev, id: json.data.id, wellnessScore: breakdown.total }));
        dayDataRef.current = { ...dayDataRef.current, id: json.data.id, wellnessScore: breakdown.total };
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("Save error:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setSaving(false);
    }
  }, []);

  // Immediate save — for habits, meal count, analysis
  const updateFieldNow = useCallback(<K extends keyof DayData>(key: K, value: DayData[K]) => {
    const next = { ...dayDataRef.current, [key]: value };
    dayDataRef.current = next;
    setDayData(next);
    clearTimeout(debounceRef.current);
    save(next);
  }, [save]);

  // Debounced save — for text inputs (meal text, meal times)
  const updateField = useCallback(<K extends keyof DayData>(key: K, value: DayData[K]) => {
    const next = { ...dayDataRef.current, [key]: value };
    dayDataRef.current = next;
    setDayData(next);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(next), 1000);
  }, [save]);

  // ── Clear handlers ──────────────────────────────────────────────────────────

  const clearFasting = useCallback(() => {
    if (!confirmClear("fasting")) return;
    const next = {
      ...dayDataRef.current,
      firstMealTime: "",
      lastMealTime: "",
    };
    dayDataRef.current = next;
    setDayData(next);
    clearTimeout(debounceRef.current);
    save(next);
  }, [save]);

  const clearHabits = useCallback(() => {
    if (!confirmClear("habits")) return;
    const next = {
      ...dayDataRef.current,
      morningRitual: false,
      kashayamMorning: false,
      kashayamEvening: false,
      weightLossTabletMorning: false,
      weightLossTabletEvening: false,
      spirulinaMorning: false,
      spirulinaEvening: false,
      psylliumHuskMorning: false,
      psylliumHuskEvening: false,
      triphalaChurnam: false,
    };
    dayDataRef.current = next;
    setDayData(next);
    clearTimeout(debounceRef.current);
    save(next);
  }, [save]);

  const clearMeals = useCallback(() => {
    if (!confirmClear("meals")) return;
    const next = {
      ...dayDataRef.current,
      meal1: "",
      meal2: "",
      meal3: "",
      snacks: "",
      analysisJson: null,
    };
    dayDataRef.current = next;
    setDayData(next);
    clearTimeout(debounceRef.current);
    save(next);
  }, [save]);

  // ───────────────────────────────────────────────────────────────────────────

  const overnightFastHours = calcOvernightFastHours(prevLastMealTime, dayData.firstMealTime);
  const scoreBreakdown = calcWellnessScore(dayData, overnightFastHours);

  return (
    <div className="relative min-h-screen">
      <BlobBackground />

      <div className="relative z-10 max-w-md mx-auto px-4 pb-20">
        {/* Header */}
        <div className="pt-12 pb-3 flex items-center gap-3">
          <Link href="/">
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-full bg-white border border-pink-100 shadow-card flex items-center justify-center text-gray-600 hover:border-pink-300 transition-colors"
            >
              ←
            </motion.button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold text-gray-900 leading-tight">
              {formatDateFull(activeDate)}
            </h1>
            {activeDate === today && (
              <span className="text-xs font-bold text-pink-500">Today</span>
            )}
          </div>

          {/* Saving indicator */}
          <motion.div
            initial={false}
            animate={{ opacity: saveStatus === "idle" ? 0 : 1 }}
            transition={{ duration: 0.2 }}
            className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
              saveStatus === "saving"
                ? "bg-yellow-50 text-yellow-600"
                : saveStatus === "saved"
                ? "bg-green-50 text-green-600"
                : saveStatus === "error"
                ? "bg-red-50 text-red-500"
                : "bg-gray-50 text-gray-400"
            }`}
          >
            {saveStatus === "saving" && (
              <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {saveStatus === "saving" && "Saving…"}
            {saveStatus === "saved" && "✓ Saved"}
            {saveStatus === "error" && "⚠ Error"}
          </motion.div>
        </div>

        {/* Day selector strip */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
          {weekDates.map((date) => {
            const isActive = date === activeDate;
            const isToday = date === today;
            const dayNum = new Date(date + "T00:00:00").getDate();
            const dayLabel = getDayLabel(date);
            return (
              <Link key={date} href={`/day?date=${date}`} replace>
                <motion.div
                  whileTap={{ scale: 0.93 }}
                  className={`
                    flex-shrink-0 w-11 flex flex-col items-center py-2.5 px-1.5 rounded-2xl cursor-pointer
                    transition-all duration-200 border-2
                    ${
                      isActive
                        ? "border-pink-500 bg-gradient-to-b from-pink-500 to-pink-400 text-white shadow-pink"
                        : isToday
                        ? "border-pink-200 bg-pink-50 text-pink-600"
                        : "border-transparent bg-white text-gray-500 shadow-card"
                    }
                  `}
                >
                  <span className="text-[10px] font-semibold opacity-80">
                    {dayLabel}
                  </span>
                  <span className="text-sm font-bold leading-none mt-0.5">
                    {dayNum}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-36 animate-pulse border border-pink-50" />
            ))}
          </div>
        ) : (
          <>
            <WellnessScoreCard
              score={scoreBreakdown}
              saving={saving}
              saveStatus={saveStatus}
            />

            <div className="space-y-4">
              <FastingTracker
                firstMealTime={dayData.firstMealTime}
                lastMealTime={dayData.lastMealTime}
                prevLastMealTime={prevLastMealTime}
                prevLastMealLoaded={prevLastMealLoaded}
                onChange={(field, val) => updateField(field, val)}
                onClear={clearFasting}
              />

              <HabitChecklist
                data={dayData}
                mealCount={dayData.mealCount}
                onChange={(key, val) => updateFieldNow(key, val)}
                onClear={clearHabits}
              />

              <MealLogger
                mealCount={dayData.mealCount}
                meal1={dayData.meal1}
                meal2={dayData.meal2}
                meal3={dayData.meal3}
                snacks={dayData.snacks}
                analysis={dayData.analysisJson}
                onMealChange={(field, val) => updateField(field, val)}
                onMealCountChange={(val) => updateFieldNow("mealCount", val)}
                onAnalysis={(result: AyurvedaAnalysis) =>
                  updateFieldNow("analysisJson", result)
                }
                onClear={clearMeals}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
