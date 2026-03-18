"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import BlobBackground from "@/components/BlobBackground";
import DayCard from "@/components/DayCard";
import HabitHeatmap from "@/components/HabitHeatmap";
import { DayData } from "@/lib/types";
import { getWeekDates } from "@/lib/utils";

export default function WeekView() {
  const [weekDates] = useState<string[]>(getWeekDates());
  const [weekData, setWeekData] = useState<(DayData | null)[]>(
    Array(7).fill(null)
  );
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    async function fetchWeek() {
      try {
        const start = weekDates[0];
        const end = weekDates[6];
        const res = await fetch(
          `/api/notion?start=${start}&end=${end}`
        );
        const json = await res.json();
        if (json.data) {
          const dataMap: Record<string, DayData> = {};
          json.data.forEach((d: DayData) => {
            dataMap[d.date] = d;
          });
          setWeekData(weekDates.map((d) => dataMap[d] || null));
        }
      } catch (e) {
        console.error("Failed to fetch week data", e);
      } finally {
        setLoading(false);
      }
    }
    fetchWeek();
  }, [weekDates]);

  const weekStr = (() => {
    const start = new Date(weekDates[0] + "T00:00:00");
    const end = new Date(weekDates[6] + "T00:00:00");
    return `${start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} – ${end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  })();

  return (
    <div className="relative min-h-screen">
      <BlobBackground />

      <div className="relative z-10 max-w-md mx-auto px-4 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-14 pb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
                Aish's Wellness
              </h1>
              <p className="text-sm text-gray-400 font-medium mt-0.5">
                Ayurvedic Habit Tracker
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-pink-300 flex items-center justify-center shadow-pink">
              <span className="text-xl">🌙</span>
            </div>
          </div>

          <p className="text-xs font-semibold text-gray-400 mt-4 tracking-wide uppercase">
            {weekStr}
          </p>
        </motion.div>

        {/* Week cards */}
        {loading ? (
          <div className="grid grid-cols-4 gap-2 mb-6">
            {Array(7)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl h-36 animate-pulse border border-pink-50"
                />
              ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 mb-6">
            {weekDates.slice(0, 4).map((date, i) => (
              <DayCard
                key={date}
                date={date}
                data={weekData[i]}
                isToday={date === today}
              />
            ))}
            {weekDates.slice(4).map((date, i) => (
              <DayCard
                key={date}
                date={date}
                data={weekData[i + 4]}
                isToday={date === today}
              />
            ))}
          </div>
        )}

        {/* Quick today button */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <Link href={`/day?date=${today}`}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="
                w-full py-4 rounded-2xl font-bold text-white text-center
                bg-gradient-to-r from-pink-500 via-pink-400 to-coral-400
                shadow-pink hover:shadow-pink-lg transition-all cursor-pointer
              "
              style={{
                background: "linear-gradient(135deg, #E91E8C, #FF6B6B)",
              }}
            >
              Log Today →
            </motion.div>
          </Link>
        </motion.div>

        {/* Heatmap */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <HabitHeatmap weekDates={weekDates} weekData={weekData} />
          </motion.div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-300 mt-8 font-medium">
          🌿 Kapha balance · Ama reduction · Agni support
        </p>
      </div>
    </div>
  );
}
