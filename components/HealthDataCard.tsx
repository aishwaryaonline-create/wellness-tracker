"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DayData } from "@/lib/types";
import { SectionSaveStatus } from "@/app/day/DayViewContent";

const CYCLE_PHASES = [
  { key: "Menstrual", icon: "🔴", days: "Day 1–5", note: "Rest and nourish. Warm, iron-rich foods support recovery." },
  { key: "Follicular", icon: "🌱", days: "Day 6–13", note: "Energy rising. Best time for new challenges and lighter foods." },
  { key: "Ovulatory", icon: "✨", days: "Day 14–16", note: "Peak energy. Physically and socially active phase." },
  { key: "Luteal", icon: "🌙", days: "Day 17–28", note: "Progesterone rising — cravings are hormonal and normal. Prioritise sleep." },
];

interface Props {
  weight: number | null;
  cyclePhase: string | null;
  periodStart: boolean;
  sleepHours: number | null;
  steps: number | null;
  activeCalories: number | null;
  restingHeartRate: number | null;
  workouts: string | null;
  onChange: (key: keyof DayData, val: any) => void;
  onSave: () => void;
  onClear: () => void;
  isDirty: boolean;
  saveStatus: SectionSaveStatus;
}

export default function HealthDataCard({
  weight, cyclePhase, periodStart, sleepHours, steps,
  activeCalories, restingHeartRate, workouts,
  onChange, onSave, onClear, isDirty, saveStatus,
}: Props) {
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsIOS(/iPhone|iPad/i.test(navigator.userAgent));
  }, []);

  const currentPhase = CYCLE_PHASES.find((p) => p.key === cyclePhase);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="bg-white rounded-2xl shadow-card border border-pink-100 p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">❤️</span>
        <h3 className="text-base font-bold text-gray-800">Health Data</h3>
        <div className="ml-auto flex items-center gap-1.5">
          {!isIOS && (
            <span className="text-[10px] text-gray-300 font-medium hidden sm:inline">
              Full data on iPhone
            </span>
          )}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={onClear}
            disabled={saveStatus === "saving"}
            className="text-[11px] font-semibold text-gray-400 hover:text-red-400 px-2.5 py-1 rounded-full border border-gray-200 hover:border-red-200 transition-all duration-150 disabled:opacity-40"
          >
            Clear
          </motion.button>
          <SaveButton isDirty={isDirty} saveStatus={saveStatus} onSave={onSave} />
        </div>
      </div>

      {/* iOS HealthKit note */}
      {isIOS && (
        <div className="mb-4 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-2">
          <span className="text-sm flex-shrink-0">📱</span>
          <p className="text-xs text-blue-700">
            Enter your health data manually below. Use the Health app or Shortcuts to check your values.
          </p>
        </div>
      )}

      {/* Weight + Sleep row */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1.5">⚖️ Weight (kg)</label>
          <input
            type="number"
            step="0.1"
            min="30"
            max="200"
            value={weight ?? ""}
            onChange={(e) => onChange("weight", e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="e.g. 68.5"
            className="w-full px-3 py-2 rounded-xl border-2 border-pink-100 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1.5">😴 Sleep (hrs)</label>
          <input
            type="number"
            step="0.5"
            min="0"
            max="24"
            value={sleepHours ?? ""}
            onChange={(e) => onChange("sleepHours", e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="e.g. 7.5"
            className="w-full px-3 py-2 rounded-xl border-2 border-pink-100 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
          />
        </div>
      </div>

      {/* Steps + Active Calories row */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1.5">👟 Steps</label>
          <input
            type="number"
            min="0"
            max="99999"
            value={steps ?? ""}
            onChange={(e) => onChange("steps", e.target.value ? parseInt(e.target.value) : null)}
            placeholder="e.g. 8500"
            className="w-full px-3 py-2 rounded-xl border-2 border-pink-100 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1.5">🔥 Active Cal</label>
          <input
            type="number"
            min="0"
            value={activeCalories ?? ""}
            onChange={(e) => onChange("activeCalories", e.target.value ? parseInt(e.target.value) : null)}
            placeholder="e.g. 320"
            className="w-full px-3 py-2 rounded-xl border-2 border-pink-100 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
          />
        </div>
      </div>

      {/* Heart rate + Workouts row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1.5">💗 Resting HR</label>
          <input
            type="number"
            min="30"
            max="200"
            value={restingHeartRate ?? ""}
            onChange={(e) => onChange("restingHeartRate", e.target.value ? parseInt(e.target.value) : null)}
            placeholder="e.g. 62 bpm"
            className="w-full px-3 py-2 rounded-xl border-2 border-pink-100 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1.5">🏃 Workouts</label>
          <input
            type="text"
            value={workouts ?? ""}
            onChange={(e) => onChange("workouts", e.target.value || null)}
            placeholder="e.g. 30 min walk"
            className="w-full px-3 py-2 rounded-xl border-2 border-pink-100 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
          />
        </div>
      </div>

      {/* Cycle phase */}
      <div className="border-t border-pink-50 pt-4">
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-semibold text-gray-500">🌸 Cycle Phase</label>
          {/* Period start toggle */}
          <button
            onClick={() => onChange("periodStart", !periodStart)}
            className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all duration-150 ${
              periodStart
                ? "bg-red-50 text-red-600 border-red-200"
                : "bg-white text-gray-400 border-gray-200 hover:border-red-200 hover:text-red-400"
            }`}
          >
            🔴 {periodStart ? "Period started" : "Mark period start"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {CYCLE_PHASES.map((phase) => (
            <motion.button
              key={phase.key}
              whileTap={{ scale: 0.96 }}
              onClick={() => onChange("cyclePhase", cyclePhase === phase.key ? null : phase.key)}
              className={`text-left px-3 py-2.5 rounded-xl border-2 transition-all duration-150 ${
                cyclePhase === phase.key
                  ? "border-pink-400 bg-pink-50"
                  : "border-gray-100 bg-gray-50 hover:border-pink-200"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm">{phase.icon}</span>
                <span className="text-xs font-bold text-gray-700">{phase.key}</span>
              </div>
              <span className="text-[10px] text-gray-400">{phase.days}</span>
            </motion.button>
          ))}
        </div>

        {currentPhase && (
          <motion.div
            key={currentPhase.key}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 px-3 py-2 rounded-xl bg-pink-50 border border-pink-100"
          >
            <p className="text-xs text-pink-700">{currentPhase.note}</p>
          </motion.div>
        )}
      </div>
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
      className={`
        text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all duration-150
        ${isSaved ? "text-green-600 bg-green-50 border-green-200"
          : isError ? "text-red-500 bg-red-50 border-red-200"
          : isDirty ? "text-pink-600 bg-pink-50 border-pink-200 hover:bg-pink-100"
          : "text-gray-300 bg-gray-50 border-gray-100 cursor-not-allowed"}
      `}
    >
      {isSaving ? "…" : isSaved ? "✓ Saved" : isError ? "⚠ Error" : "Save"}
    </motion.button>
  );
}
