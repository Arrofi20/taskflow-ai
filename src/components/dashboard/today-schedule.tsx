"use client";

import { BookOpen, Clock3, Sparkles } from "lucide-react";

type ScheduleItem = {
  id: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
};

type TodayScheduleProps = {
  schedules: ScheduleItem[];
};

function formatTimeRange(startTime: string | null, endTime: string | null) {
  if (!startTime && !endTime) return "Sepanjang hari";
  if (startTime && endTime) return `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`;
  if (startTime) return `Mulai ${startTime.slice(0, 5)}`;
  return `Selesai ${endTime!.slice(0, 5)}`;
}

export function TodaySchedule({ schedules }: TodayScheduleProps) {
  return (
    <section className="card-vibrant-accent rounded-2xl p-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6bcb77] to-[#028090] text-white shadow-sm">
          <BookOpen className="h-4 w-4" />
        </div>
        <h2 className="text-base font-semibold text-[#1E2761]">
          Jadwal Belajar Hari Ini
        </h2>
        <Sparkles size={14} className="ml-auto text-[#ffd93d]" />
      </div>

      {schedules.length === 0 ? (
        <div className="rounded-xl bg-gradient-to-r from-[#f0f4ff] via-[#fef9f0] to-[#f0f4ff] px-4 py-8 text-center">
          <p className="text-sm text-slate-500">
            Tidak ada jadwal belajar hari ini. Atur jadwal di menu Jadwal.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {schedules.map((schedule, index) => (
            <li
              key={schedule.id}
              className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-md"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#028090] to-[#6bcb77] text-white shadow-sm transition group-hover:scale-110 group-hover:rotate-3">
                <Clock3 className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">
                  {schedule.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatTimeRange(schedule.start_time, schedule.end_time)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
