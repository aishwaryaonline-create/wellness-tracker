"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AyurvedaAnalysis, WeightLossAnalysis, AnalysisContext } from "@/lib/types";
import AnalysisCard from "./AnalysisCard";
import WeightLossAnalysisCard from "./WeightLossAnalysisCard";
import { SectionSaveStatus } from "@/app/day/DayViewContent";

type MealField = "meal1" | "meal2" | "meal3" | "snacks";

interface MealFieldDef {
  key: MealField;
  label: string;
  placeholder: string;
  minMeals?: 2 | 3;
  alwaysShow?: boolean;
}

const ALL_MEAL_FIELDS: MealFieldDef[] = [
  { key: "meal1", label: "Meal 1", placeholder: "e.g. Moong dal khichdi with ghee and cumin…" },
  { key: "meal2", label: "Meal 2", placeholder: "e.g. Rajma chawal, cucumber salad…", minMeals: 2 },
  { key: "meal3", label: "Meal 3", placeholder: "e.g. Vegetable soup with roti…", minMeals: 3 },
  { key: "snacks", label: "Snacks", placeholder: "e.g. Handful of almonds, green tea…", alwaysShow: true },
];

interface Props {
  mealCount: 1 | 2 | 3;
  meal1: string;
  meal2: string;
  meal3: string;
  snacks: string;
  analysis: AyurvedaAnalysis | null | undefined;
  weightLossAnalysis: WeightLossAnalysis | null | undefined;
  analysisContext: AnalysisContext;
  onMealChange: (field: MealField, val: string) => void;
  onMealCountChange: (val: 1 | 2 | 3) => void;
  onAnalysis: (result: AyurvedaAnalysis) => void;
  onWeightLossAnalysis: (result: WeightLossAnalysis) => void;
  onSave: () => void;
  onClear: () => void;
  isDirty: boolean;
  saveStatus: SectionSaveStatus;
}

export default function MealLogger({
  mealCount, meal1, meal2, meal3, snacks,
  analysis, weightLossAnalysis, analysisContext,
  onMealChange, onMealCountChange,
  onAnalysis, onWeightLossAnalysis,
  onSave, onClear, isDirty, saveStatus,
}: Props) {
  const [ayurLoading, setAyurLoading] = useState(false);
  const [wlLoading, setWlLoading] = useState(false);
  const [ayurError, setAyurError] = useState<string | null>(null);
  const [wlError, setWlError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ayurveda" | "weightloss">("ayurveda");

  const count: 1 | 2 | 3 = (mealCount === 1 || mealCount === 2 || mealCount === 3) ? mealCount : 2;
  const values: Record<MealField, string> = { meal1, meal2, meal3, snacks };

  const visibleFields = ALL_MEAL_FIELDS.filter((f) => {
    if (f.alwaysShow) return true;
    if (f.minMeals === undefined) return true;
    return count >= f.minMeals;
  });

  const isNil = (val: string) => val === "Nil";
  const toggleNil = (field: MealField) =>
    onMealChange(field, isNil(values[field]) ? "" : "Nil");

  const hasAnyMeal = visibleFields.some(({ key }) => values[key] && values[key] !== "Nil");

  function buildMealLog(): string {
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

  async function handleAyurvedaAnalysis() {
    if (!hasAnyMeal) return;
    setAyurLoading(true);
    setAyurError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealLog: buildMealLog(), ...analysisContext }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Analysis failed");
      onAnalysis(json.analysis);
      setActiveTab("ayurveda");
    } catch (e: any) {
      setAyurError(e.message);
    } finally {
      setAyurLoading(false);
    }
  }

  async function handleWeightLossAnalysis() {
    if (!hasAnyMeal) return;
    setWlLoading(true);
    setWlError(null);
    try {
      const res = await fetch("/api/analyze/weightloss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealLog: buildMealLog(), ...analysisContext }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Analysis failed");
      onWeightLossAnalysis(json.analysis);
      setActiveTab("weightloss");
    } catch (e: any) {
      setWlError(e.message);
    } finally {
      setWlLoading(false);
    }
  }

  const showAnalysisTabs = analysis || weightLossAnalysis;

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
        <div className="ml-auto flex items-center gap-1.5">
          {([1, 2, 3] as const).map((n) => (
            <motion.button
              key={n}
              whileTap={{ scale: 0.9 }}
              onClick={() => onMealCountChange(n)}
              className={`
                w-9 h-9 rounded-xl text-sm font-bold transition-all duration-200
                ${count === n
                  ? "bg-gradient-to-br from-pink-500 to-pink-400 text-white shadow-sm"
                  : "bg-gray-50 text-gray-400 border border-gray-200 hover:border-pink-200 hover:text-pink-500"}
              `}
            >
              {n}
            </motion.button>
          ))}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={onClear}
            disabled={saveStatus === "saving"}
            className="ml-1 text-[11px] font-semibold text-gray-400 hover:text-red-400 px-2.5 py-1 rounded-full border border-gray-200 hover:border-red-200 transition-all duration-150 disabled:opacity-40"
          >
            Clear
          </motion.button>
          <SaveButton isDirty={isDirty} saveStatus={saveStatus} onSave={onSave} />
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
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all duration-150 ${
                      nil
                        ? "bg-gray-200 text-gray-500 border-gray-300"
                        : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                    }`}
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
                  className={`w-full px-3.5 py-2.5 rounded-xl border-2 text-sm transition-all duration-150 focus:outline-none resize-none ${
                    nil
                      ? "border-gray-100 bg-gray-50 text-gray-300 placeholder-gray-300 cursor-not-allowed"
                      : "border-pink-100 bg-white text-gray-700 placeholder-gray-300 focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                  }`}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Dual analysis buttons */}
      <div className="grid grid-cols-2 gap-2 mb-1">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleAyurvedaAnalysis}
          disabled={ayurLoading || wlLoading || !hasAnyMeal}
          className="py-3 rounded-full font-bold text-sm bg-gradient-to-r from-pink-500 to-pink-400 text-white shadow-pink transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-pink-lg"
        >
          {ayurLoading ? (
            <span className="flex items-center justify-center gap-1.5">
              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span className="text-xs">Analysing…</span>
            </span>
          ) : (
            <span>{analysis ? "🔄" : "🌿"} Ayurveda</span>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleWeightLossAnalysis}
          disabled={ayurLoading || wlLoading || !hasAnyMeal}
          className="py-3 rounded-full font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {wlLoading ? (
            <span className="flex items-center justify-center gap-1.5">
              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span className="text-xs">Analysing…</span>
            </span>
          ) : (
            <span>{weightLossAnalysis ? "🔄" : "⚖️"} Fat Loss</span>
          )}
        </motion.button>
      </div>

      {(ayurError || wlError) && (
        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
          ⚠️ {ayurError || wlError}
        </p>
      )}

      {isDirty && (analysis || weightLossAnalysis) && (
        <p className="text-xs text-amber-600 text-center mt-2">
          Analysis updated — click Save to persist
        </p>
      )}

      {/* Analysis results with tabs */}
      <AnimatePresence>
        {showAnalysisTabs && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="mt-5"
          >
            {/* Tab switcher — only show if both analyses exist */}
            {analysis && weightLossAnalysis && (
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setActiveTab("ayurveda")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === "ayurveda"
                      ? "bg-pink-500 text-white shadow-sm"
                      : "bg-gray-50 text-gray-500 border border-gray-200 hover:border-pink-200"
                  }`}
                >
                  🌿 Ayurvedic
                </button>
                <button
                  onClick={() => setActiveTab("weightloss")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === "weightloss"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "bg-gray-50 text-gray-500 border border-gray-200 hover:border-emerald-200"
                  }`}
                >
                  ⚖️ Fat Loss
                </button>
              </div>
            )}

            {/* Show active analysis */}
            {activeTab === "ayurveda" && analysis && <AnalysisCard analysis={analysis} />}
            {activeTab === "weightloss" && weightLossAnalysis && (
              <WeightLossAnalysisCard analysis={weightLossAnalysis} />
            )}
            {/* Fallback — show whichever exists */}
            {!analysis && weightLossAnalysis && activeTab === "ayurveda" && (
              <WeightLossAnalysisCard analysis={weightLossAnalysis} />
            )}
            {analysis && !weightLossAnalysis && activeTab === "weightloss" && (
              <AnalysisCard analysis={analysis} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SaveButton({
  isDirty, saveStatus, onSave,
}: {
  isDirty: boolean;
  saveStatus: SectionSaveStatus;
  onSave: () => void;
}) {
  const isSaving = saveStatus === "saving";
  const isSaved = saveStatus === "saved";
  const isError = saveStatus === "error";

  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onSave}
      disabled={!isDirty || isSaving}
      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all duration-150 ${
        isSaved ? "text-green-600 bg-green-50 border-green-200"
          : isError ? "text-red-500 bg-red-50 border-red-200"
          : isDirty ? "text-pink-600 bg-pink-50 border-pink-200 hover:bg-pink-100"
          : "text-gray-300 bg-gray-50 border-gray-100 cursor-not-allowed"
      }`}
    >
      {isSaving ? "…" : isSaved ? "✓ Saved" : isError ? "⚠ Error" : "Save"}
    </motion.button>
  );
}
