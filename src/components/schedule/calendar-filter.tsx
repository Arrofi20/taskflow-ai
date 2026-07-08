"use client";

import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { useState, useRef, useEffect } from "react";

type CalendarFilterProps = {
  selectedDate: string;
};

export function CalendarFilter({ selectedDate }: CalendarFilterProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDateObject = parseISO(selectedDate);
  const currentMonth = selectedDateObject.getMonth();
  const currentYear = selectedDateObject.getFullYear();

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Adjust so Monday is 0, Sunday is 6
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const weekDays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  function handleDateClick(day: number) {
    const dateStr = format(
      new Date(currentYear, currentMonth, day),
      "yyyy-MM-dd",
    );
    router.push(`/jadwal?date=${dateStr}`);
    setIsOpen(false);
  }

  function goToPrevMonth() {
    const prev = new Date(currentYear, currentMonth - 1, 1);
    const dateStr = format(prev, "yyyy-MM-dd");
    router.push(`/jadwal?date=${dateStr}`);
  }

  function goToNextMonth() {
    const next = new Date(currentYear, currentMonth + 1, 1);
    const dateStr = format(next, "yyyy-MM-dd");
    router.push(`/jadwal?date=${dateStr}`);
  }

  function goToToday() {
    const today = format(new Date(), "yyyy-MM-dd");
    router.push(`/jadwal?date=${today}`);
    setIsOpen(false);
  }

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isTodaySelected = selectedDate === todayStr;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
          isOpen || !isTodaySelected
            ? "border-[#028090]/30 bg-[#028090]/10 text-[#028090]"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }`}
      >
        <CalendarIcon className="h-4 w-4" />
        <span>
          {format(selectedDateObject, "d MMM yyyy", { locale: localeId })}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl shadow-black/10">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={goToPrevMonth}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-[#1E2761]">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              type="button"
              onClick={goToNextMonth}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {weekDays.map((day) => (
              <div
                key={day}
                className="py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400"
              >
                {day}
              </div>
            ))}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = format(
                new Date(currentYear, currentMonth, day),
                "yyyy-MM-dd",
              );
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === todayStr;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition ${
                    isSelected
                      ? "bg-[#1E2761] text-white"
                      : isToday
                        ? "bg-[#028090]/10 text-[#028090]"
                        : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={goToToday}
              className="w-full rounded-lg py-1.5 text-xs font-semibold text-[#028090] hover:bg-[#028090]/10"
            >
              Hari Ini
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
