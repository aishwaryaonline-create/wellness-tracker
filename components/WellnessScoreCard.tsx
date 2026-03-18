"use client";

import { motion } from "framer-motion";
import { WellnessScoreBreakdown } from "@/lib/types";

interface ComponentRow {
  label: string;
  icon: string;
  pts: number;
  max: number;
  hint?: string;
}

interface Props {
  score: WellnessScoreBreakdown;
  saving?: boolean;
  saveStatus?: "idle" | "saved" | "error";
}

function ScoreBar({ pts, max, color }: { pts: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(pts / max, 1) : 0;
  return (
    <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct * 100}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

export default function WellnessScoreCard({ score, saving, saveStatus }: Props) {
  const rows: ComponentRow[] = [
    {
      label: "Fasting",
      icon: "⏱",
      pts: score.fasting,
      max: 30,
      hint: score.hasFastData ? undefined : "Log meal times",
    },
    {
      label: "Eat window",
      icon: "🪟",
      pts: score.window,
      max: 20,
      hint: score.hasFastData ? undefined : "Log meal times",
    },
    {
      label: "Meal quality",
      icon: "🍱",
      pts: score.meals,
      max: 30,
      hint: score.hasMealData ? undefined : "Run AI analysis",
    },
    {
      label: "Habits",
      icon: "✅",
      pts: score.habits,
      max: 20,
    },
  ];

  const scoreColor =
    score.total >= 80
      ? "#22c55e"
      : score.total >= 60
      ? "#f59e0b"
      : "#ef4444";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-3xl p-5 mb-4 text-white"
      style={{
        background: "linear-gradient(135deg, #E91E8C 0%, #FF6B6B 55%, #FFAB76 100%)",
      }}
    >
      {/* Decorative circles */}
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
      <div className="absolute right-4 bottom-0 w-24 h-24 rounded-full bg-white/10" />

      <div className="relative">
        {/* Top row: big score + save indicator */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold opacity-70 uppercase tracking-wider">
              Wellness Score
            </p>
            <div className="flex items-end gap-1.5 mt-0.5">
              <motion.p
                key={score.total}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-6xl font-extrabold leading-none"
              >
                {score.total}
              </motion.p>
              <p className="text-lg font-bold opacity-60 mb-1">/100</p>
            </div>
          </div>
          <div className="text-right">
            {saving && (
              <span className="text-[10px] opacity-60 animate-pulse block">
                saving…
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-[10px] opacity-80 block">✓ saved</span>
            )}
            {saveStatus === "error" && (
              <span className="text-[10px] text-red-200 block">save failed</span>
            )}
          </div>
        </div>

        {/* Component breakdown */}
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center gap-2">
              <span className="text-sm w-5 text-center flex-shrink-0">{row.icon}</span>
              <span className="text-xs font-semibold opacity-80 w-20 flex-shrink-0">
                {row.label}
              </span>
              {row.hint ? (
                <p className="flex-1 text-[10px] opacity-50 italic">{row.hint}</p>
              ) : (
                <ScoreBar pts={row.pts} max={row.max} color="rgba(255,255,255,0.9)" />
              )}
              <span className="text-xs font-bold opacity-90 w-10 text-right flex-shrink-0">
                {row.hint ? "–" : `${row.pts.toFixed(0)}/${row.max}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
