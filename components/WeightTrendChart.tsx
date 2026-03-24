"use client";

import { DayData } from "@/lib/types";
import { getDayLabel } from "@/lib/utils";

interface Props {
  weekDates: string[];
  weekData: (DayData | null)[];
}

export default function WeightTrendChart({ weekDates, weekData }: Props) {
  const points = weekDates.map((date, i) => ({
    date,
    label: getDayLabel(date),
    weight: weekData[i]?.weight ?? null,
    dayNum: new Date(date + "T00:00:00").getDate(),
  }));

  const weights = points.map((p) => p.weight).filter((w): w is number => w !== null);
  if (weights.length === 0) return null;

  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 0.5;
  const padded = { min: minW - range * 0.2, max: maxW + range * 0.2 };

  const W = 320;
  const H = 90;
  const PAD_X = 28;
  const PAD_Y = 10;
  const chartW = W - PAD_X * 2;
  const chartH = H - PAD_Y * 2;

  const xPos = (i: number) => PAD_X + (i / 6) * chartW;
  const yPos = (w: number) =>
    PAD_Y + chartH - ((w - padded.min) / (padded.max - padded.min)) * chartH;

  // Build SVG path connecting points that have weight
  const pathSegments: string[] = [];
  let lastHadData = false;
  points.forEach((p, i) => {
    if (p.weight !== null) {
      const x = xPos(i);
      const y = yPos(p.weight);
      pathSegments.push(lastHadData ? `L ${x} ${y}` : `M ${x} ${y}`);
      lastHadData = true;
    } else {
      lastHadData = false;
    }
  });
  const pathD = pathSegments.join(" ");

  return (
    <div className="bg-white rounded-2xl border border-pink-100 shadow-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">⚖️</span>
          <h3 className="text-sm font-bold text-gray-800">Weight This Week</h3>
        </div>
        {weights.length >= 2 && (
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              weights[weights.length - 1] <= weights[0]
                ? "bg-green-50 text-green-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {weights[weights.length - 1] <= weights[0] ? "↓" : "↑"}{" "}
            {Math.abs(weights[weights.length - 1] - weights[0]).toFixed(1)} kg
          </span>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 90 }}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((frac) => (
          <line
            key={frac}
            x1={PAD_X}
            y1={PAD_Y + chartH * (1 - frac)}
            x2={W - PAD_X}
            y2={PAD_Y + chartH * (1 - frac)}
            stroke="#f3e8ee"
            strokeWidth="1"
          />
        ))}

        {/* Trend line */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="url(#weightGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Dots and labels */}
        {points.map((p, i) => {
          if (p.weight === null) return null;
          const x = xPos(i);
          const y = yPos(p.weight);
          return (
            <g key={p.date}>
              <circle cx={x} cy={y} r="4" fill="#E91E8C" stroke="white" strokeWidth="1.5" />
              <text x={x} y={H - 1} textAnchor="middle" fontSize="8" fill="#9ca3af">
                {p.label}
              </text>
              <text x={x} y={y - 7} textAnchor="middle" fontSize="8" fill="#374151" fontWeight="600">
                {p.weight}
              </text>
            </g>
          );
        })}

        {/* Day labels for days without weight */}
        {points.map((p, i) => {
          if (p.weight !== null) return null;
          return (
            <text key={p.date} x={xPos(i)} y={H - 1} textAnchor="middle" fontSize="8" fill="#d1d5db">
              {p.label}
            </text>
          );
        })}

        <defs>
          <linearGradient id="weightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E91E8C" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
