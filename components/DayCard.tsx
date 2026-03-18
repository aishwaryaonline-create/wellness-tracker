"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import ProgressRing from "./ProgressRing";
import { getDayLabel, calcFastHours, calcHabitScore } from "@/lib/utils";
import { DayData } from "@/lib/types";

interface Props {
  date: string;
  data?: DayData | null;
  isToday?: boolean;
}

export default function DayCard({ date, data, isToday }: Props) {
  const habitScore = data ? calcHabitScore(data) : 0;
  const fastHours = data
    ? calcFastHours(data.firstMealTime, data.lastMealTime)
    : 0;
  const mealScore = data?.analysisJson?.score ?? null;
  const dayLabel = getDayLabel(date);
  const dayNum = new Date(date + "T00:00:00").getDate();

  return (
    <Link href={`/day?date=${date}`}>
      <motion.div
        whileHover={{ y: -4, boxShadow: "0 8px 32px rgba(233,30,140,0.18)" }}
        whileTap={{ scale: 0.97 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`
          relative bg-white rounded-2xl p-4 cursor-pointer select-none
          border transition-all duration-200
          ${
            isToday
              ? "border-pink-500 shadow-pink"
              : "border-pink-100 shadow-card"
          }
        `}
        style={
          isToday
            ? {
                background:
                  "linear-gradient(135deg, #fff0f8 0%, #fff 60%)",
              }
            : {}
        }
      >
        {isToday && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2">
            <span className="bg-gradient-to-r from-pink-500 to-pink-400 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
              TODAY
            </span>
          </div>
        )}

        <div className="flex flex-col items-center gap-2">
          <div className="text-center">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {dayLabel}
            </p>
            <p className="text-lg font-bold text-gray-800 leading-none">
              {dayNum}
            </p>
          </div>

          <ProgressRing value={habitScore} size={56} strokeWidth={4} />

          {fastHours > 0 && (
            <div className="text-center">
              <p className="text-xs font-bold gradient-text">
                {fastHours}h
              </p>
              <p className="text-[10px] text-gray-400">fast</p>
            </div>
          )}

          {mealScore !== null && (
            <div className="flex items-center gap-1">
              <span className="text-xs">🍽</span>
              <span className="text-xs font-semibold text-gray-600">
                {mealScore}/10
              </span>
            </div>
          )}

          {!data && (
            <p className="text-[10px] text-gray-300 mt-1">No data</p>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
