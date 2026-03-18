"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AyurvedaAnalysis } from "@/lib/types";
import AnalysisCard from "./AnalysisCard";

type MealField = "meal1" | "meal2" | "meal3" | "snacks";

interface MealFieldDef {
  key: MealField;
  label: string;
  placeholder: string;
  minMeals?: 2 | 3;
  alwaysShow?: boolean;
}

const ALL_MEAL_FIELDS: MealFieldDef[] = [
  {
    key: "meal1",
    label: "Meal 1",
    placeholder: "e.g. Moong dal khichdi with ghee and cumin…",
  },
  {
    key: "meal2",
    label: "Meal 2",
    placeholder: "e.g. Rajma chawal, cucumber salad…",
    minMeals: 2,
  },
  {
    key: "meal3",
    label: "Meal 3",
    placeholder: "e.g. Vegetable soup with roti…",
    minMeals: 3,
  },
  {
    key: "snacks",
    label: "Snacks",
    placeholder: "e.g. Handful of almonds, green tea…",
    alwaysShow: true,
  },
];

interface Props {
  mealCount: 1 | 2 | 3;
  meal1: string;
  meal2: string;
  meal3: string;
  snacks: string;
  analysis: AyurvedaAnalysis | null | undefined;
  onMealChange: (field: MealField, val: string) => void;
  onMealCountChange: (val: 1 | 2 | 3) => void;
  onAnalysis: (result: AyurvedaAnalysis) => void;
}

export default function MealLogger({
  mealCount,
  meal1,
  meal2,
  meal3,
  snacks,
  analysis,
  onMealChange,
  onMealCountChange,
  onAnalysis,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure mealCount is always a valid number (guards against null from Notion)
  const count: 1 | 2 | 3 = (mealCount === 1 || mealCount === 2 || mealCount === 3) ? mealCount : 2;

  const values: Record<MealField, string> = { meal1, meal2, meal3, snacks };

  const visibleFields = ALL_MEAL_FIELDS.filter((f) => {
    if (f.alwaysShow) return true;
    if (f.minMeals === undefined) return true;
    return count >= f.minMeals;
  });

  function isNil(val: string) {
    return val === "Nil";
  }

  function toggleNil(field: MealField) {
    onMealChange(field, isNil(values[field]) ? "" : "Nil");
  }

  function buildMealLogForAI(): string {
    return visibleFields
      .map(({ key, label }) => {
        const val = values[key];
        if (!val) return null;
        if (val === "Nil") return `${label}: (skipped)`;
        return `${label}: ${val}`;
      })
      .filter(Boolean)
      .join("\n");
  }

  const hasAnyMeal = visibleFields.some(
    ({ key }) => values[key] && values[key] !== "Nil"
  );

  async function handleAnalyze() {
    if (!hasAnyMeal) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealLog: buildMealLogForAI() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Analysis failed");
      onAnalysis(json.analysis);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white rounded-2xl shadow-card border border-pink-100 p-5"
    >
      {/* Header + meal count selector */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🍱</span>
        <h3 className="text-base font-bold text-gray-800">Meals Today</h3>
        <div className="ml-auto flex gap-1.5">
          {([1, 2, 3] as const).map((n) => (
            <motion.button
              key={n}
              whileTap={{ scale: 0.9 }}
              onClick={() => onMealCountChange(n)}
              className={`
                w-9 h-9 rounded-xl text-sm font-bold transition-all duration-200
                ${
                  count === n
                    ? "bg-gradient-to-br from-pink-500 to-pink-400 text-white shadow-sm"
                    : "bg-gray-50 text-gray-400 border border-gray-200 hover:border-pink-200 hover:text-pink-500"
                }
              `}
            >
              {n}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <AnimatePresence initial={false}>
          {visibleFields.map(({ key, label, placeholder }, idx) => {
            const nil = isNil(values[key]);
            const isSnacks = key === "snacks";
            return (
              <motion.div
                key={key}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, delay: idx * 0.04 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                    {isSnacks && <span className="text-amber-400">✦</span>}
                    {label}
                  </label>
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    onClick={() => toggleNil(key)}
                    className={`
                      text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all duration-150
                      ${
                        nil
                          ? "bg-gray-200 text-gray-500 border-gray-300"
                          : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                      }
                    `}
                  >
                    {nil ? "✕ Nil" : "Nil"}
                  </motion.button>
                </div>
                <textarea
                  value={nil ? "" : values[key]}
                  onChange={(e) => onMealChange(key, e.target.value)}
                  disabled={nil}
                  placeholder={nil ? "Marked as skipped" : placeholder}
                  rows={2}
                  className={`
                    w-full px-3.5 py-2.5 rounded-xl border-2 text-sm transition-all duration-150
                    focus:outline-none resize-none
                    ${
                      nil
                        ? "border-gray-100 bg-gray-50 text-gray-300 placeholder-gray-300 cursor-not-allowed"
                        : "border-pink-100 bg-white text-gray-700 placeholder-gray-300 focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                    }
                  `}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {error && (
        <p className="text-xs text-red-500 mb-3 flex items-center gap-1">
          ⚠️ {error}
        </p>
      )}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleAnalyze}
        disabled={loading || !hasAnyMeal}
        className="
          w-full py-3.5 rounded-full font-bold text-sm
          bg-gradient-to-r from-pink-500 to-pink-400
          text-white shadow-pink transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-pink-lg
        "
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Analyzing with Ayurveda AI...
          </span>
        ) : (
          "✨ Analyze with Ayurveda AI"
        )}
      </motion.button>

      <AnimatePresence>
        {analysis && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="mt-5"
          >
            <AnalysisCard analysis={analysis} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
