"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, Clock, Download, Crown } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type CalendarTask = {
  id: string;
  title: string;
  deadline: string;
  status: string;
};

type CalendarSchedule = {
  id: string;
  title: string;
  waktu_mulai: string;
  waktu_selesai: string;
  rekomendasi_ai: string | null;
};

export default function KalenderPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [schedules, setSchedules] = useState<CalendarSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function checkPremium() {
      const { data: { session } } = await supabase.auth.getSession();
      const meta = session?.user.user_metadata;
      let premium = false;
      if (meta && typeof meta.is_premium === "boolean") {
        premium = meta.is_premium;
      } else if (meta && typeof meta.plan === "string") {
        premium = meta.plan.toLowerCase() === "premium";
      } else if (meta && typeof meta.subscription === "string") {
        premium = meta.subscription.toLowerCase() === "premium";
      }
      setIsPremium(premium);
    }
    checkPremium();
  }, [supabase]);

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const startStr = format(start, "yyyy-MM-dd") + "T00:00:00+07:00";
      const endStr = format(end, "yyyy-MM-dd") + "T23:59:59+07:00";

      const [tasksRes, schedulesRes] = await Promise.all([
        supabase
          .from("tasks")
          .select("id,nama_tugas,deadline,status")
          .eq("user_id", session.user.id)
          .gte("deadline", startStr)
          .lte("deadline", endStr)
          .order("deadline", { ascending: true }),
        supabase
          .from("schedules")
          .select("id,waktu_mulai,waktu_selesai,rekomendasi_ai,tasks!inner(nama_tugas)")
          .eq("user_id", session.user.id)
          .gte("waktu_mulai", startStr)
          .lte("waktu_mulai", endStr)
          .order("waktu_mulai", { ascending: true }),
      ]);

      const normalizedTasks = (tasksRes.data ?? []).map((t) => ({
        id: String(t.id),
        title: String(t.nama_tugas ?? "Tugas"),
        deadline: String(t.deadline),
        status: String(t.status ?? "pending"),
      }));

      const normalizedSchedules = (schedulesRes.data ?? []).map((s) => {
        const nested = (s as Record<string, unknown>).tasks as Record<string, unknown> | undefined;
        return {
          id: String(s.id),
          title: typeof nested?.nama_tugas === "string" ? nested.nama_tugas : "Jadwal",
          waktu_mulai: String(s.waktu_mulai),
          waktu_selesai: String(s.waktu_selesai),
          rekomendasi_ai: typeof s.rekomendasi_ai === "string" ? s.rekomendasi_ai : null,
        };
      });

      setTasks(normalizedTasks);
      setSchedules(normalizedSchedules);
      setLoading(false);
    }

    loadData();
  }, [currentMonth, supabase]);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const startWeekday = useMemo(() => {
    return getDay(startOfMonth(currentMonth));
  }, [currentMonth]);

  const weekDays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const selectedTasks = useMemo(() => {
    if (!selectedDate) return [];
    return tasks.filter((t) => {
      const d = parseISO(t.deadline);
      return isSameDay(d, selectedDate);
    });
  }, [selectedDate, tasks]);

  const selectedSchedules = useMemo(() => {
    if (!selectedDate) return [];
    return schedules.filter((s) => {
      const d = parseISO(s.waktu_mulai);
      return isSameDay(d, selectedDate);
    });
  }, [selectedDate, schedules]);

  if (isPremium === false) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-800">
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <section className="rounded-[28px] bg-gradient-to-r from-[#1E2761] to-[#028090] p-5 text-white shadow-sm">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} />
              <p className="text-sm font-semibold">Kalender</p>
            </div>
            <h1 className="mt-3 text-2xl font-bold">Fitur Premium</h1>
            <p className="mt-2 text-sm text-white/80">
              Sinkronisasi kalender hanya tersedia untuk pengguna Premium.
            </p>
          </section>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <Crown size={48} className="mx-auto text-amber-500" />
            <h2 className="mt-4 text-xl font-bold text-[#1E2761]">
              Upgrade ke Premium
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Dapatkan kalender bulanan dengan integrasi tugas dan jadwal belajar,
              serta export ke Google Calendar.
            </p>
            <Link
              href="/profil/subscription"
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#1E2761] px-6 py-3 text-sm font-semibold text-white"
            >
              Lihat Paket Premium
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-800">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1E2761]">Kalender</h1>
            <p className="mt-1 text-sm text-slate-600">
              Lihat deadline tugas dan jadwal belajar bulanan.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm"
          >
            <Download size={16} />
            Export Google Calendar
          </button>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-bold text-[#1E2761]">
              {format(currentMonth, "MMMM yyyy", { locale: localeId })}
            </h2>
            <button
              type="button"
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500">
            {weekDays.map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startWeekday }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10 sm:h-12" />
            ))}
            {days.map((day) => {
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const dayTasks = tasks.filter((t) =>
                isSameDay(parseISO(t.deadline), day),
              );
              const daySchedules = schedules.filter((s) =>
                isSameDay(parseISO(s.waktu_mulai), day),
              );
              const hasDeadline = dayTasks.length > 0;
              const hasSchedule = daySchedules.length > 0;

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  className={`relative flex h-10 flex-col items-center justify-center rounded-xl text-sm transition sm:h-12 ${
                    isSelected
                      ? "bg-[#1E2761] text-white"
                      : isToday
                        ? "bg-[#028090]/10 font-bold text-[#028090]"
                        : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{format(day, "d")}</span>
                  <div className="mt-0.5 flex gap-0.5">
                    {hasDeadline && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-red-500"}`}
                      />
                    )}
                    {hasSchedule && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-[#028090]"}`}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Deadline tugas
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#028090]" />
              Jadwal belajar
            </div>
          </div>
        </section>

        {selectedDate && (
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-[#1E2761]">
              {format(selectedDate, "EEEE, d MMMM yyyy", { locale: localeId })}
            </h3>

            {loading ? (
              <p className="mt-3 text-sm text-slate-500">Memuat...</p>
            ) : (
              <div className="mt-3 space-y-4">
                {selectedTasks.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-red-600">
                      Deadline Tugas
                    </h4>
                    <ul className="space-y-2">
                      {selectedTasks.map((task) => (
                        <li
                          key={task.id}
                          className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-red-500" />
                            <span className="font-medium text-slate-900">
                              {task.title}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            Status: {task.status}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedSchedules.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-[#028090]">
                      Jadwal Belajar
                    </h4>
                    <ul className="space-y-2">
                      {selectedSchedules.map((schedule) => (
                        <li
                          key={schedule.id}
                          className="rounded-xl border border-[#028090]/10 bg-[#028090]/5 px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <CalendarDays size={14} className="text-[#028090]" />
                            <span className="font-medium text-slate-900">
                              {schedule.title}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {format(parseISO(schedule.waktu_mulai), "HH:mm")} -{" "}
                            {format(parseISO(schedule.waktu_selesai), "HH:mm")}
                          </p>
                          {schedule.rekomendasi_ai && (
                            <p className="mt-0.5 text-xs italic text-slate-400">
                              {schedule.rekomendasi_ai}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedTasks.length === 0 && selectedSchedules.length === 0 && (
                  <p className="text-sm text-slate-500">
                    Tidak ada tugas atau jadwal di tanggal ini.
                  </p>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
