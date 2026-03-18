"use client";

import { motion } from "framer-motion";
import { AyurvedaAnalysis } from "@/lib/types";

const AMA_COLORS = {
  low: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  medium: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  high: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

interface Props {
  analysis: AyurvedaAnalysis;
}

export default function AnalysisCard({ analysis }: Props) {
  const amaStyle = AMA_COLORS[analysis.amaRisk] || AMA_COLORS.medium;
  const scoreColor =
    analysis.score >= 7
      ? "from-green-400 to-emerald-500"
      : analysis.score >= 5
      ? "from-amber-400 to-orange-500"
      : "from-red-400 to-rose-500";

  return (
    <div className="space-y-3">
      {/* Score + Summary */}
      <div
        className={`rounded-2xl p-4 bg-gradient-to-r ${scoreColor} text-white`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-center">
            <p className="text-4xl font-extrabold leading-none">
              {analysis.score}
            </p>
            <p className="text-xs opacity-80 font-medium">/10</p>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold opacity-90 leading-relaxed">
              {analysis.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Dosha + Agni + Ama */}
      <div className="grid grid-cols-1 gap-2">
        <div className="bg-purple-50 rounded-xl p-3">
          <p className="text-xs font-bold text-purple-600 mb-0.5">
            ⚖️ Dosha Balance
          </p>
          <p className="text-xs text-purple-800">{analysis.doshaBalance}</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-3">
          <p className="text-xs font-bold text-orange-600 mb-0.5">
            🔥 Agni Support
          </p>
          <p className="text-xs text-orange-800">{analysis.agniSupport}</p>
        </div>
        <div className={`${amaStyle.bg} rounded-xl p-3`}>
          <div className="flex items-center gap-2 mb-0.5">
            <p className={`text-xs font-bold ${amaStyle.text}`}>
              🧪 Ama Risk
            </p>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${amaStyle.bg} ${amaStyle.text} border border-current/20`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${amaStyle.dot}`}
              />
              {analysis.amaRisk.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Wins */}
      {analysis.wins.length > 0 && (
        <div className="bg-green-50 rounded-xl p-3">
          <p className="text-xs font-bold text-green-700 mb-2">🌟 Wins</p>
          <ul className="space-y-1">
            {analysis.wins.map((win, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-2 text-xs text-green-800"
              >
                <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                {win}
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {/* Flags */}
      {analysis.flags.length > 0 && (
        <div className="bg-red-50 rounded-xl p-3">
          <p className="text-xs font-bold text-red-600 mb-2">⚠️ Watch Out</p>
          <ul className="space-y-1">
            {analysis.flags.map((flag, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-2 text-xs text-red-700"
              >
                <span className="flex-shrink-0 mt-0.5">⚡</span>
                {flag}
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {/* Tip for tomorrow */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-3 border border-pink-100">
        <p className="text-xs font-bold text-pink-600 mb-1">
          💡 Tip for Tomorrow
        </p>
        <p className="text-xs text-gray-700">{analysis.tipForTomorrow}</p>
      </div>
    </div>
  );
}
