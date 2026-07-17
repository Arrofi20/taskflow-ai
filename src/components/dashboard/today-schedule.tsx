"use client";

import { BookOpen, Clock3, Sparkles, Zap, Brain, Timer } from "lucide-react";

type ScheduleItem = {
  id: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
  rekomendasi_ai: string | null;
  // Premium fields
  durasi_istirahat?: number | null;
  energi_level?: "tinggi" | "sedang" | "rendah" | null;
  tips_fokus?: string | null;
};

type TodayScheduleProps = {
  schedules: ScheduleItem[];
  analisisGayaBelajar?: {
    tipe_belajar: string;
    jam_optimal: string[];
    pola_belajar: string;
  } | null;
  rekomendasiUmum?: string[] | null;
};

function formatTimeRange(startTime: string | null, endTime: string | null) {
  if (!startTime && !endTime) return "Sepanjang hari";
  if (startTime && endTime) return `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`;
  if (startTime) return `Mulai ${startTime.slice(0, 5)}`;
  return `Selesai ${endTime!.slice(0, 5)}`;
}

function EnergyIcon({ level }: { level: string }) {
  if (level === "tinggi") return <Zap size={12} className="text-green-500" />;
  if (level === "sedang") return <Brain size={12} className="text-amber-500" />;
  return <Timer size={12} className="text-slate-400" />;
}

export function TodaySchedule({ schedules, analisisGayaBelajar, rekomendasiUmum }: TodayScheduleProps) {
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

      {/* Premium: Learning Style Analysis */}
      {analisisGayaBelajar && (
        <div className="mb-4 rounded-xl bg-gradient-to-r from-[#1E2761]/5 to-[#028090]/5 p-3">
          <p className="text-xs font-semibold text-[#1E2761]">Gaya Belajarmu:</p>
          <p className="text-xs text-slate-600">{analisisGayaBelajar.pola_belajar}</p>
          {analisisGayaBelajar.jam_optimal.length > 0 && (
            <p className="mt-1 text-xs text-[#028090]">
              Jam optimal: {analisisGayaBelajar.jam_optimal.join(", ")}
            </p>
          )}
        </div>
      )}

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
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-slate-900">
                    {schedule.title}
                  </p>
                  {schedule.energi_level && (
                    <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                      <EnergyIcon level={schedule.energi_level} />
                      {schedule.energi_level}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatTimeRange(schedule.start_time, schedule.end_time)}
                  {schedule.durasi_istirahat != null && schedule.durasi_istirahat > 0 && (
                    <span className="ml-2 text-[#028090]">· Istirahat {schedule.durasi_istirahat}m</span>
                  )}
                </p>
                {schedule.rekomendasi_ai && (
                  <p className="mt-0.5 text-xs italic text-[#028090]">
                    {schedule.rekomendasi_ai}
                  </p>
                )}
                {schedule.tips_fokus && (
                  <p className="mt-1 text-xs text-amber-600">
                    Tips: {schedule.tips_fokus}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Premium: General Recommendations */}
      {rekomendasiUmum && rekomendasiUmum.length > 0 && (
        <div className="mt-4 rounded-xl bg-gradient-to-r from-[#ffd93d]/10 to-[#ff6b6b]/10 p-3">
          <p className="text-xs font-semibold text-[#1E2761]">Rekomendasi Personal:</p>
          <ul className="mt-1 space-y-1">
            {rekomendasiUmum.slice(0, 3).map((rec, i) => (
              <li key={i} className="text-xs text-slate-600">• {rec}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
