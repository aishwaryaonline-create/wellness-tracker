"use client";

import { motion } from "framer-motion";

interface Props {
  value: 1 | 2 | 3;
  onChange: (val: 1 | 2 | 3) => void;
}

export default function MealCountSelector({ value, onChange }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 bg-white rounded-2xl shadow-card border border-pink-100 px-4 py-3 mb-4"
    >
      <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">
        Meals today
      </span>
      <div className="flex gap-1.5 ml-auto">
        {([1, 2, 3] as const).map((n) => (
          <motion.button
            key={n}
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange(n)}
            className={`
              w-10 h-10 rounded-xl text-sm font-bold transition-all duration-200
              ${
                value === n
                  ? "bg-gradient-to-br from-pink-500 to-pink-400 text-white shadow-pink"
                  : "bg-gray-50 text-gray-400 border border-gray-200 hover:border-pink-200 hover:text-pink-500"
              }
            `}
          >
            {n}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
