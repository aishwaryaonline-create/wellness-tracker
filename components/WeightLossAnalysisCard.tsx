"use client";

import { motion } from "framer-motion";
import { WeightLossAnalysis } from "@/lib/types";

const CALORIC_LABEL: Record<string, string> = {
  "too low": "Too Low ⚠️",
  adequate: "Adequate ✓",
  "too high": "Too High",
};
const CALORIC_COLOR: Record<string, string> = {
  "too low": "text-red-600 bg-red-50",
  adequate: "text-green-700 bg-green-50",
  "too high": "text-amber-700 bg-amber-50",
};
const PROTEIN_LABEL: Record<string, string> = {
  insufficient: "Insufficient ⚠️",
  adequate: "Adequate ✓",
  good: "Good ✓",
};
const PROTEIN_COLOR: Record<string, string> = {
  insufficient: "text-red-600 bg-red-50",
  adequate: "text-amber-700 bg-amber-50",
  good: "text-green-700 bg-green-50",
};

interface Props {
  analysis: WeightLossAnalysis;
}

export default function WeightLossAnalysisCard({ analysis }: Props) {
  const scoreColor =
    analysis.sustainabilityScore >= 7
      ? "from-green-500 to-emerald-600"
      : analysis.sustainabilityScore >= 5
      ? "from-amber-400 to-orange-500"
      : "from-red-400 to-rose-600";

  return (
    <div className="space-y-3">
      {/* Score + Verdict */}
      <div className={`rounded-2xl p-4 bg-gradient-to-r ${scoreColor} text-white`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-center">
            <p className="text-4xl font-extrabold leading-none">{analysis.sustainabilityScore}</p>
            <p className="text-xs opacity-80 font-medium">/10</p>
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-bold opacity-70 uppercase tracking-wide mb-1">Fat Loss Verdict</p>
            <p className="text-sm font-semibold opacity-90 leading-relaxed">{analysis.overallVerdict}</p>
          </div>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 gap-2">
        <div className={`rounded-xl p-3 ${CALORIC_COLOR[analysis.caloricAdequacy] || "bg-gray-50 text-gray-700"}`}>
          <p className="text-[10px] font-bold uppercase tracking-wide opacity-70 mb-0.5">Calories</p>
          <p className="text-xs font-bold">{CALORIC_LABEL[analysis.caloricAdequacy] || analysis.caloricAdequacy}</p>
        </div>
        <div className={`rounded-xl p-3 ${PROTEIN_COLOR[analysis.proteinAdequacy] || "bg-gray-50 text-gray-700"}`}>
          <p className="text-[10px] font-bold uppercase tracking-wide opacity-70 mb-0.5">Protein</p>
          <p className="text-xs font-bold">{PROTEIN_LABEL[analysis.proteinAdequacy] || analysis.proteinAdequacy}</p>
        </div>
      </div>

      {/* Context cards */}
      <div className="space-y-2">
        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-xs font-bold text-blue-700 mb-0.5">⏱ Fasting</p>
          <p className="text-xs text-blue-800">{analysis.fastingEffectiveness}</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-3">
          <p className="text-xs font-bold text-purple-700 mb-0.5">💊 Supplements</p>
          <p className="text-xs text-purple-800">{analysis.supplementSupport}</p>
        </div>
        <div className="bg-pink-50 rounded-xl p-3">
          <p className="text-xs font-bold text-pink-700 mb-0.5">🌸 Cycle Impact</p>
          <p className="text-xs text-pink-800">{analysis.cycleImpact}</p>
        </div>
      </div>

      {/* Wins */}
      {analysis.wins?.length > 0 && (
        <div className="bg-green-50 rounded-xl p-3">
          <p className="text-xs font-bold text-green-700 mb-2">🌟 Wins</p>
          <ul className="space-y-1">
            {analysis.wins.map((win, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-2 text-xs text-green-800"
              >
                <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                {win}
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {/* Red flags */}
      {analysis.redFlags?.length > 0 && (
        <div className="bg-red-50 rounded-xl p-3">
          <p className="text-xs font-bold text-red-600 mb-2">🚨 Red Flags</p>
          <ul className="space-y-1">
            {analysis.redFlags.map((flag, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-2 text-xs text-red-700"
              >
                <span className="flex-shrink-0 mt-0.5">⚡</span>
                {flag}
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendation */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-100">
        <p className="text-xs font-bold text-emerald-700 mb-1">💡 Tomorrow</p>
        <p className="text-xs text-gray-700">{analysis.recommendationForTomorrow}</p>
      </div>
    </div>
  );
}
