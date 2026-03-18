import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pink: {
          50: "#FFF0F8",
          100: "#FFE4F3",
          200: "#FFD6EE",
          300: "#FFB0DD",
          400: "#FF6BB5",
          500: "#E91E8C",
          600: "#C4177A",
          700: "#9A1260",
          hot: "#E91E8C",
          light: "#FF6BB5",
          pale: "#FFE4F3",
        },
        coral: {
          400: "#FFAB76",
          500: "#FF6B6B",
        },
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        pink: "0 4px 24px rgba(233, 30, 140, 0.15)",
        "pink-lg": "0 8px 40px rgba(233, 30, 140, 0.2)",
        card: "0 2px 16px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
