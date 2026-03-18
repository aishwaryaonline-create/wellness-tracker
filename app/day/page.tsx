"use client";

import { Suspense } from "react";
import DayViewContent from "./DayViewContent";

export default function DayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DayViewContent />
    </Suspense>
  );
}
