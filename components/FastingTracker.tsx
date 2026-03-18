"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  calcEatWindowHours,
  calcOvernightFastHours,
  getFastRating,
  formatTime12,
} from "@/lib/utils";

interface Props {
  firstMealTime: string;
  lastMealTime: string;
  prevLastMealTime: string;
  prevLastMealLoaded: boolean;
  onChange: (field: "firstMealTime" | "lastMealTime", val: string) => void;
  onClear: () => void;
}

const RATING_COLORS: Record<string, string> = {
  Excellent: "text-green-600 bg-green-50",
  Great: "text-emerald-600 bg-emerald-50",
  Good: "text-blue-600 bg-blue-50",
  Moderate: "text-amber-600 bg-amber-50",
  Short: "text-red-500 bg-red-50",
};

export default function FastingTracker({
  firstMealTime,
  lastMealTime,
  prevLastMealTime,
  prevLastMealLoaded,
  onChange,
  onClear,
}: Props) {
  const overnightHours = calcOvernightFastHours(prevLastMealTime, firstMealTime);
  const eatHours = calcEatWindowHours(firstMealTime, lastMealTime);
  const rating = getFastRating(overnightHours);
  const hasEatWindow = firstMealTime && lastMealTime && eatHours > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl shadow-card border border-pink-100 p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">⏱</span>
        <h3 className="text-base font-bold text-gray-800">Intermittent Fasting</h3>
        <div className="ml-auto">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={onClear}
            className="text-[11px] font-semibold text-gray-400 hover:text-red-400 px-2.5 py-1 rounded-full border border-gray-200 hover:border-red-200 transition-all duration-150"
          >
            Clear
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* First Meal */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            First Meal
          </label>
          <input
            type="time"
            value={firstMealTime}
            onChange={(e) => onChange("firstMealTime", e.target.value)}
          />
          {firstMealTime && (
            <p className="text-xs text-gray-400 mt-1">{formatTime12(firstMealTime)}</p>
          )}
        </div>

        {/* Last Meal */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            Last Meal
          </label>
          <input
            type="time"
            value={lastMealTime}
            onChange={(e) => onChange("lastMealTime", e.target.value)}
          />
          {lastMealTime && (
            <p className="text-xs text-gray-400 mt-1">{formatTime12(lastMealTime)}</p>
          )}
        </div>
      </div>

      {/* Overnight fast — inline below inputs, shown as soon as firstMealTime entered */}
      <AnimatePresence>
        {prevLastMealLoaded && firstMealTime && overnightHours > 0 && (
          <motion.div
            key="overnight"
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3 }}
            className="mt-4 px-4 py-3 rounded-2xl bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-100 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🌙</span>
              <div>
                <p className="text-xs font-semibold text-pink-700 leading-snug">
                  You fasted for{" "}
                  <span className="text-pink-600 font-extrabold">{overnightHours}h</span>{" "}
                  since yesterday&apos;s last meal
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  at {formatTime12(prevLastMealTime)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
              <span className="text-2xl font-extrabold gradient-text leading-none">
                {overnightHours}h
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  RATING_COLORS[rating] || "text-gray-600 bg-gray-100"
                }`}
              >
                {rating}
              </span>
            </div>
          </motion.div>
        )}

        {/* First meal entered but no yesterday data */}
        {prevLastMealLoaded && firstMealTime && !prevLastMealTime && (
          <motion.div
            key="no-prev-first"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-pink-50 rounded-xl border border-pink-100"
          >
            <span className="text-sm leading-none mt-0.5">🌙</span>
            <p className="text-xs text-pink-600 leading-snug">
              Enter yesterday&apos;s last meal time to calculate your fast
            </p>
          </motion.div>
        )}

        {/* No first meal yet, but yesterday data exists — prompt */}
        {prevLastMealLoaded && !firstMealTime && prevLastMealTime && (
          <motion.div
            key="enter-first"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-purple-50 rounded-xl border border-purple-100"
          >
            <span className="text-sm leading-none mt-0.5">🌙</span>
            <p className="text-xs text-purple-700 leading-snug">
              Last night&apos;s meal: <span className="font-bold">{formatTime12(prevLastMealTime)}</span>
              {" "}— enter your first meal time to see overnight fast
            </p>
          </motion.div>
        )}

        {/* No first meal, no yesterday data */}
        {prevLastMealLoaded && !firstMealTime && !prevLastMealTime && (
          <motion.div
            key="no-prev"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100"
          >
            <span className="text-sm leading-none mt-0.5">🌙</span>
            <p className="text-xs text-gray-400 leading-snug">
              No last meal logged for yesterday — enter it to calculate your fast
            </p>
          </motion.div>
        )}

        {/* Eating window — only when both times entered */}
        {hasEatWindow && (
          <motion.div
            key="eatwindow"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🪟</span>
              <div>
                <p className="text-xs text-gray-500 leading-none mb-0.5">eating window</p>
                <p className="text-xs text-gray-400">
                  {formatTime12(firstMealTime)} – {formatTime12(lastMealTime)}
                </p>
              </div>
            </div>
            <span className="text-3xl font-extrabold text-blue-600 leading-none">
              {eatHours}h
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
