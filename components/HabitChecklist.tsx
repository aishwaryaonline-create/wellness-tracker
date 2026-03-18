"use client";

import { motion, AnimatePresence } from "framer-motion";
import { DayData } from "@/lib/types";
import { totalHabitCount } from "@/lib/utils";

interface HabitDef {
  key: keyof DayData;
  label: string;
  subtitle: string;
  icon: string;
  minMeals?: 2; // only shown when mealCount >= this
}

const HABITS: HabitDef[] = [
  {
    key: "morningRitual",
    label: "Morning Ritual",
    subtitle: "Oil pull, tongue scrape, warm water",
    icon: "🌅",
  },
  {
    key: "kashayamMorning",
    label: "Kashayam",
    subtitle: "Meal 1",
    icon: "🌿",
  },
  {
    key: "kashayamEvening",
    label: "Kashayam",
    subtitle: "Meal 2",
    icon: "🌿",
    minMeals: 2,
  },
  {
    key: "weightLossTabletMorning",
    label: "Weight Loss Tablet",
    subtitle: "Meal 1",
    icon: "💊",
  },
  {
    key: "weightLossTabletEvening",
    label: "Weight Loss Tablet",
    subtitle: "Meal 2",
    icon: "💊",
    minMeals: 2,
  },
  {
    key: "spirulinaMorning",
    label: "Spirulina",
    subtitle: "Meal 1",
    icon: "🟢",
  },
  {
    key: "spirulinaEvening",
    label: "Spirulina",
    subtitle: "Meal 2",
    icon: "🟢",
    minMeals: 2,
  },
  {
    key: "psylliumHuskMorning",
    label: "Psyllium Husk",
    subtitle: "Morning",
    icon: "🌾",
  },
  {
    key: "psylliumHuskEvening",
    label: "Psyllium Husk",
    subtitle: "Evening",
    icon: "🌾",
  },
  {
    key: "triphalaChurnam",
    label: "Triphala Churnam",
    subtitle: "Before sleep at night",
    icon: "🍃",
  },
];

// Group consecutive habits with the same label for visual grouping
const GROUPS = [
  { label: "Morning", keys: ["morningRitual"] },
  {
    label: "Medicines",
    keys: [
      "kashayamMorning", "kashayamEvening",
      "weightLossTabletMorning", "weightLossTabletEvening",
      "spirulinaMorning", "spirulinaEvening",
      "psylliumHuskMorning", "psylliumHuskEvening",
      "triphalaChurnam",
    ],
  },
];

interface Props {
  data: Partial<DayData>;
  mealCount: 1 | 2 | 3;
  onChange: (key: keyof DayData, val: boolean) => void;
}

export default function HabitChecklist({ data, mealCount, onChange }: Props) {
  const visible = (h: HabitDef) =>
    h.minMeals === undefined || mealCount >= h.minMeals;

  const total = totalHabitCount(mealCount);
  const checked = HABITS.filter(visible).filter(
    (h) => (data[h.key] as boolean) || false
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-white rounded-2xl shadow-card border border-pink-100 p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">✅</span>
        <h3 className="text-base font-bold text-gray-800">Daily Habits</h3>
        <div className="ml-auto">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-pink-50 text-pink-600">
            {checked}/{total}
          </span>
        </div>
      </div>

      {/* Habit groups */}
      <div className="space-y-5">
        {GROUPS.map((group) => {
          const groupHabits = HABITS.filter(
            (h) => group.keys.includes(h.key as string) && visible(h)
          );
          if (groupHabits.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {group.label}
              </p>
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {groupHabits.map((habit, idx) => {
                    const isChecked = (data[habit.key] as boolean) || false;
                    return (
                      <motion.button
                        key={habit.key as string}
                        layout
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.02 }}
                        onClick={() => onChange(habit.key, !isChecked)}
                        whileTap={{ scale: 0.97 }}
                        className={`
                          w-full flex items-center gap-3 p-3.5 rounded-xl
                          border-2 transition-all duration-200 text-left cursor-pointer overflow-hidden
                          ${
                            isChecked
                              ? "border-pink-400 bg-gradient-to-r from-pink-50 to-rose-50"
                              : "border-gray-100 bg-gray-50 hover:border-pink-200 hover:bg-pink-50/30"
                          }
                        `}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0 transition-all ${
                            isChecked ? "bg-pink-100" : "bg-white"
                          }`}
                        >
                          {habit.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-semibold transition-colors ${
                              isChecked ? "text-pink-700" : "text-gray-700"
                            }`}
                          >
                            {habit.label}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {habit.subtitle}
                          </p>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            isChecked
                              ? "border-pink-500 bg-pink-500"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {isChecked && (
                            <motion.svg
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
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
                            </motion.svg>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
