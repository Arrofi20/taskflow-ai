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
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  Link2,
  Unlink,
  RefreshCw,
  Crown,
  Check,
  Loader2,
  ExternalLink,
  Download,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  const [googleConnected, setGoogleConnected] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const checkGoogleConnection = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data } = await supabase
        .from("google_tokens")
        .select("id,last_synced_at")
        .eq("user_id", session.user.id)
        .maybeSingle();
      const row = data as { last_synced_at?: string | null } | null;
      setGoogleConnected(!!row);
      setLastSynced(row?.last_synced_at ?? null);
    } catch {
      setGoogleConnected(false);
    }
  }, [supabase]);

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
      if (premium) checkGoogleConnection();
    }
    checkPremium();
  }, [supabase, checkGoogleConnection]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const syncStatus = params.get("sync");
    if (syncStatus === "success") {
      setGoogleConnected(true);
      setSyncResult("Berhasil terhubung!");
      setTimeout(() => setSyncResult(null), 3000);
      checkGoogleConnection();
    } else if (syncStatus === "error") {
      setSyncResult("Gagal menghubungkan Google Calendar.");
      setTimeout(() => setSyncResult(null), 5000);
    }
    if (syncStatus) {
      window.history.replaceState({}, "", "/kalender");
    }
  }, [checkGoogleConnection]);

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

  async function handleGoogleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/google/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncResult(`Berhasil sinkron! ${data.synced} item dikirim ke Google Calendar.`);
        checkGoogleConnection();
      } else {
        setSyncResult(data.error ?? "Gagal sinkron.");
      }
    } catch {
      setSyncResult("Terjadi kesalahan jaringan.");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncResult(null), 5000);
    }
  }

  async function handleGoogleDisconnect() {
    if (!confirm("Putuskan koneksi Google Calendar?")) return;
    try {
      await fetch("/api/google/disconnect", { method: "POST" });
      setGoogleConnected(false);
      setLastSynced(null);
      setSyncResult("Koneksi Google Calendar diputus.");
      setTimeout(() => setSyncResult(null), 3000);
    } catch {
      setSyncResult("Gagal memutus koneksi.");
      setTimeout(() => setSyncResult(null), 3000);
    }
  }

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
              Kalender bulanan dengan integrasi tugas, jadwal belajar, dan sinkronisasi Google Calendar hanya tersedia untuk pengguna Premium.
            </p>
          </section>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <Crown size={48} className="mx-auto text-amber-500" />
            <h2 className="mt-4 text-xl font-bold text-[#1E2761]">
              Upgrade ke Premium
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Dapatkan kalender bulanan dengan integrasi tugas dan jadwal belajar,
              serta sinkronisasi ke Google Calendar.
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
    <main className="min-h-screen px-4 py-5 text-slate-800">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1E2761]">Kalender</h1>
            <p className="mt-1 text-sm text-slate-600">
              Lihat deadline tugas dan jadwal belajar bulanan.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isPremium && (
              <button
                type="button"
                onClick={() => window.open("/api/kalender/export", "_blank")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#028090]/30 bg-[#028090]/10 px-3 py-2 text-xs font-medium text-[#028090] shadow-sm hover:bg-[#028090]/15"
              >
                <Download size={14} />
                Export ICS
              </button>
            )}
            {googleConnected ? (
              <>
                <span className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                  <Check size={12} />
                  Terhubung
                </span>
                <button
                  type="button"
                  onClick={handleGoogleSync}
                  disabled={syncing}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  {syncing ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  {syncing ? "Sync..." : "Sinkron"}
                </button>
                <button
                  type="button"
                  onClick={handleGoogleDisconnect}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 shadow-sm hover:bg-red-50"
                >
                  <Unlink size={14} />
                  Putuskan
                </button>
              </>
            ) : (
              <a
                href="/api/google/auth"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <Link2 size={14} />
                Hubungkan Google Calendar
                <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>

        {syncResult && (
          <div
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              syncResult.includes("Gagal") || syncResult.includes("Kesalahan") || syncResult.includes("Putus")
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {syncResult}
          </div>
        )}

        {googleConnected && lastSynced && (
          <p className="text-xs text-slate-500">
            Terakhir disinkronkan: {format(parseISO(lastSynced), "d MMM yyyy, HH:mm", { locale: localeId })}
          </p>
        )}

        <section className="card-vibrant rounded-3xl p-4">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-bold text-[#1E2761]">
              {format(currentMonth, "MMMM yyyy", { locale: localeId })}
            </h2>
            <button
              type="button"
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-600">
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
              const dayCompleted = dayTasks.filter((t) => t.status === "completed");
              const dayPending = dayTasks.filter((t) => t.status !== "completed" && new Date(t.deadline) >= new Date());
              const dayOverdue = dayTasks.filter((t) => t.status !== "completed" && new Date(t.deadline) < new Date());
              const daySchedules = schedules.filter((s) =>
                isSameDay(parseISO(s.waktu_mulai), day),
              );

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  className={`relative flex h-10 flex-col items-center justify-center rounded-xl text-sm transition sm:h-12 ${
                    isSelected
                      ? "bg-[#1E2761] text-white shadow-sm"
                      : isToday
                        ? "bg-[#028090]/10 font-bold text-[#028090]"
                        : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{format(day, "d")}</span>
                  <div className="mt-0.5 flex gap-0.5">
                    {dayPending.length > 0 && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-[#ff6b6b]"}`}
                      />
                    )}
                    {dayOverdue.length > 0 && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-slate-800"}`}
                      />
                    )}
                    {dayCompleted.length > 0 && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-emerald-500"}`}
                      />
                    )}
                    {daySchedules.length > 0 && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-amber-400"}`}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Jadwal belajar
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Selesai
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#ff6b6b]" />
              Deadline
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-800" />
              Terlambat
            </div>
          </div>
        </section>

        {selectedDate && (
          <section className="card-vibrant rounded-3xl p-4">
            <h3 className="text-lg font-semibold text-[#1E2761]">
              {format(selectedDate, "EEEE, d MMMM yyyy", { locale: localeId })}
            </h3>

            {loading ? (
              <p className="mt-3 text-sm text-slate-600">Memuat...</p>
            ) : (
              <div className="mt-3 space-y-4">
                {selectedSchedules.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-amber-600">
                      Jadwal Belajar
                    </h4>
                    <ul className="space-y-2">
                      {selectedSchedules.map((schedule) => (
                        <li
                          key={schedule.id}
                          className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <CalendarDays size={14} className="text-amber-500" />
                            <span className="font-medium text-slate-900">
                              {schedule.title}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-600">
                            {format(parseISO(schedule.waktu_mulai), "HH:mm")} -{" "}
                            {format(parseISO(schedule.waktu_selesai), "HH:mm")}
                          </p>
                          {schedule.rekomendasi_ai && (
                            <p className="mt-0.5 text-xs italic text-slate-500">
                              {schedule.rekomendasi_ai}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedTasks.filter((t) => t.status === "completed").length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-emerald-600">
                      Selesai
                    </h4>
                    <ul className="space-y-2">
                      {selectedTasks.filter((t) => t.status === "completed").map((task) => (
                        <li
                          key={task.id}
                          className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <Check size={14} className="text-emerald-500" />
                            <span className="font-medium text-slate-900 line-through">
                              {task.title}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedTasks.filter((t) => t.status !== "completed" && new Date(t.deadline) >= new Date()).length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-[#ff6b6b]">
                      Deadline
                    </h4>
                    <ul className="space-y-2">
                      {selectedTasks.filter((t) => t.status !== "completed" && new Date(t.deadline) >= new Date()).map((task) => (
                        <li
                          key={task.id}
                          className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-[#ff6b6b]" />
                            <span className="font-medium text-slate-900">
                              {task.title}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-600">
                            Status: {task.status}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedTasks.filter((t) => t.status !== "completed" && new Date(t.deadline) < new Date()).length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-800">
                      Terlambat
                    </h4>
                    <ul className="space-y-2">
                      {selectedTasks.filter((t) => t.status !== "completed" && new Date(t.deadline) < new Date()).map((task) => (
                        <li
                          key={task.id}
                          className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-slate-800">&#9679;</span>
                            <span className="font-medium text-slate-900">
                              {task.title}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-600">
                            Deadline: {format(parseISO(task.deadline), "d MMM, HH:mm")}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedTasks.length === 0 && selectedSchedules.length === 0 && (
                  <p className="text-sm text-slate-600">
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
