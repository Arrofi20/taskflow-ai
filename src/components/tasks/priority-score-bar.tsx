"use client";

import { getScoreColorClass, getScoreLabel } from "@/lib/tasks/priority-score";

export function PriorityScoreBar({ score }: { score: number | null }) {
  const numeric = score ?? 0;
  const colorClass = getScoreColorClass(score);
  const label = getScoreLabel(score);

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">Prioritas AI</span>
        <span className="font-semibold text-slate-800">{numeric} — {label}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
          style={{ width: `${numeric}%` }}
        />
      </div>
    </div>
  );
}
