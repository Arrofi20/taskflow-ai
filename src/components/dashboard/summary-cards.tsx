"use client";

import { AlertCircle, CalendarClock, ListTodo } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      setDisplay(value);
      prevRef.current = value;
      return;
    }

    const start = prevRef.current;
    const end = value;
    if (start === end) return;

    const duration = 600;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      setDisplay(current);
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
    prevRef.current = end;
  }, [value]);

  return <span>{display}</span>;
}

type SummaryCardsProps = {
  totalTasks: number;
  tasksToday: number;
  approachingDeadline: number;
};

const cardConfig = [
  { gradient: "from-[#1E2761] to-[#028090]", iconBg: "bg-white/20", icon: ListTodo, label: "Total Tugas", key: "totalTasks" as const },
  { gradient: "from-[#028090] to-[#6bcb77]", iconBg: "bg-white/20", icon: CalendarClock, label: "Tugas Hari Ini", key: "tasksToday" as const },
  { gradient: "from-[#ff6b6b] to-[#ffb5a7]", iconBg: "bg-white/20", icon: AlertCircle, label: "Mendekati Deadline", key: "approachingDeadline" as const },
];

export function SummaryCards({ totalTasks, tasksToday, approachingDeadline }: SummaryCardsProps) {
  const values = { totalTasks, tasksToday, approachingDeadline };

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {cardConfig.map(({ key, label, gradient, iconBg, icon: Icon }) => (
        <div
          key={key}
          className={`group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br ${gradient} p-2.5 sm:p-4 shadow-lg shadow-slate-200/60 transition hover:scale-[1.02] hover:shadow-xl`}
        >
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/8 opacity-60 transition group-hover:scale-110" />
          <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-white/8 opacity-40 transition group-hover:scale-110" />
          <div className="absolute -right-12 -bottom-12 h-32 w-32 rounded-full bg-white/5" />
          <div className="relative flex items-start justify-between gap-1.5 sm:gap-3">
            <div className="min-w-0">
              <p className="text-[11px] sm:text-sm font-medium text-white/75 leading-tight">{label}</p>
              <p className="mt-0.5 text-2xl sm:text-3xl font-bold text-white drop-shadow-sm">
                <AnimatedNumber value={values[key]} />
              </p>
            </div>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 sm:rounded-xl ${iconBg} backdrop-blur-sm text-white transition group-hover:scale-110 group-hover:rotate-3`}>
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
