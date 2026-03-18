"use client";

import { useEffect, useState, useCallback } from "react";
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

export default function DayViewContent() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const today = new Date().toISOString().slice(0, 10);
  const activeDate = dateParam || today;

  const [dayData, setDayData] = useState<DayData>(EMPTY_DAY(activeDate));
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [loading, setLoading] = useState(true);
  const weekDates = getWeekDates(new Date(activeDate + "T00:00:00"));

  useEffect(() => {
    setLoading(true);
    setDayData(EMPTY_DAY(activeDate));
    fetch(`/api/notion?date=${activeDate}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setDayData(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeDate]);

  const save = useCallback(async (data: DayData) => {
    setSaving(true);
    try {
      // compute and attach wellness score before saving
      const breakdown = calcWellnessScore(data);
      const withScore = { ...data, wellnessScore: breakdown.total };
      const res = await fetch("/api/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(withScore),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      if (json.data?.id)
        setDayData((prev) => ({ ...prev, id: json.data.id, wellnessScore: breakdown.total }));
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setSaving(false);
    }
  }, []);

  // Auto-save with debounce
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => save(dayData), 1200);
    return () => clearTimeout(t);
  }, [dayData, save, loading]);

  function updateField<K extends keyof DayData>(key: K, value: DayData[K]) {
    setDayData((prev) => ({ ...prev, [key]: value }));
  }

  const scoreBreakdown = calcWellnessScore(dayData);

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
          <div>
            <h1 className="text-lg font-extrabold text-gray-900 leading-tight">
              {formatDateFull(activeDate)}
            </h1>
            {activeDate === today && (
              <span className="text-xs font-bold text-pink-500">Today</span>
            )}
          </div>
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
            {/* Wellness score card */}
            <WellnessScoreCard
              score={scoreBreakdown}
              saving={saving}
              saveStatus={saveStatus}
            />

            <div className="space-y-4">
              {/* Fasting tracker */}
              <FastingTracker
                firstMealTime={dayData.firstMealTime}
                lastMealTime={dayData.lastMealTime}
                onChange={(field, val) => updateField(field, val)}
              />

              {/* Habit checklist */}
              <HabitChecklist
                data={dayData}
                mealCount={dayData.mealCount}
                onChange={(key, val) => updateField(key, val)}
              />

              {/* Meal logger */}
              <MealLogger
                mealCount={dayData.mealCount}
                meal1={dayData.meal1}
                meal2={dayData.meal2}
                meal3={dayData.meal3}
                snacks={dayData.snacks}
                analysis={dayData.analysisJson}
                onMealChange={(field, val) => updateField(field, val)}
                onMealCountChange={(val) => updateField("mealCount", val)}
                onAnalysis={(result: AyurvedaAnalysis) =>
                  updateField("analysisJson", result)
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
