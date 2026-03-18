"use client";

import { motion } from "framer-motion";
import { DayData } from "@/lib/types";
import { getDayLabel } from "@/lib/utils";

const HABITS = [
  { key: "morningRitual", label: "Morning Ritual", icon: "🌅" },
  { key: "kashayamMorning", label: "Kashayam AM", icon: "🌿" },
  { key: "kashayamEvening", label: "Kashayam PM", icon: "🌿" },
  { key: "weightLossTabletMorning", label: "WL Tablet AM", icon: "💊" },
  { key: "weightLossTabletEvening", label: "WL Tablet PM", icon: "💊" },
  { key: "spirulinaMorning", label: "Spirulina AM", icon: "🟢" },
  { key: "spirulinaEvening", label: "Spirulina PM", icon: "🟢" },
  { key: "psylliumHuskMorning", label: "Psyllium AM", icon: "🌾" },
  { key: "psylliumHuskEvening", label: "Psyllium PM", icon: "🌾" },
  { key: "triphalaChurnam", label: "Triphala Churnam", icon: "🍃" },
];

interface Props {
  weekDates: string[];
  weekData: (DayData | null)[];
}

export default function HabitHeatmap({ weekDates, weekData }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-pink-100 overflow-hidden">
      <div className="p-4 border-b border-pink-50">
        <h3 className="text-sm font-bold text-gray-800">Habit Heatmap</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-pink-50">
              <th className="text-left px-4 py-2.5 font-semibold text-gray-500 w-32 min-w-[128px]">
                Habit
              </th>
              {weekDates.map((d) => (
                <th
                  key={d}
                  className="px-2 py-2.5 font-semibold text-gray-500 text-center min-w-[36px]"
                >
                  {getDayLabel(d)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HABITS.map((habit, hi) => (
              <tr
                key={habit.key}
                className={hi % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
              >
                <td className="px-4 py-2 text-gray-600 font-medium whitespace-nowrap">
                  {habit.icon} {habit.label}
                </td>
                {weekDates.map((d, di) => {
                  const dayData = weekData[di];
                  const checked = dayData
                    ? (dayData[habit.key as keyof DayData] as boolean)
                    : false;
                  return (
                    <td key={d} className="px-2 py-2 text-center">
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: hi * 0.03 + di * 0.02 }}
                        className={`
                          w-6 h-6 rounded-md mx-auto flex items-center justify-center
                          ${
                            checked
                              ? "bg-gradient-to-br from-pink-500 to-pink-400"
                              : dayData
                              ? "bg-gray-100"
                              : "bg-gray-50"
                          }
                        `}
                      >
                        {checked && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </motion.div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
