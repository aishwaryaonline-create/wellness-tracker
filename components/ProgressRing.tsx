"use client";

import { motion } from "framer-motion";

interface Props {
  value: number; // 0–10
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export default function ProgressRing({
  value,
  size = 64,
  strokeWidth = 5,
  label,
}: Props) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(value / 10, 0), 1);
  const dashOffset = circumference * (1 - progress);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#FFE4F3"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E91E8C" />
            <stop offset="100%" stopColor="#FF6B6B" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-gray-800 leading-none">
          {value.toFixed(1)}
        </span>
        {label && (
          <span className="text-[9px] text-gray-400 mt-0.5">{label}</span>
        )}
      </div>
    </div>
  );
}
