"use client";

import { motion } from "framer-motion";
import {
  calcFastHours,
  calcEatWindowHours,
  getFastRating,
  formatTime12,
} from "@/lib/utils";

interface Props {
  firstMealTime: string;
  lastMealTime: string;
  onChange: (field: "firstMealTime" | "lastMealTime", val: string) => void;
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
  onChange,
}: Props) {
  const fastHours = calcFastHours(firstMealTime, lastMealTime);
  const eatHours = calcEatWindowHours(firstMealTime, lastMealTime);
  const rating = getFastRating(fastHours);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl shadow-card border border-pink-100 p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">⏱</span>
        <h3 className="text-base font-bold text-gray-800">
          Intermittent Fasting
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
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
            <p className="text-xs text-gray-400 mt-1">
              {formatTime12(firstMealTime)}
            </p>
          )}
        </div>
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
            <p className="text-xs text-gray-400 mt-1">
              {formatTime12(lastMealTime)}
            </p>
          )}
        </div>
      </div>

      {fastHours > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-2xl font-bold gradient-text">{fastHours}h</p>
              <p className="text-xs text-gray-500 font-medium">
                overnight fast
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-700">{eatHours}h</p>
              <p className="text-xs text-gray-500 font-medium">
                eating window
              </p>
            </div>
            <div className="text-center">
              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                  RATING_COLORS[rating] || "text-gray-600 bg-gray-100"
                }`}
              >
                {rating}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
