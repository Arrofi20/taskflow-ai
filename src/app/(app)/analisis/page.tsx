"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Sparkles,
  TrendingUp,
  Zap,
  Crown,
} from "lucide-react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";

type TaskRow = {
  id: string;
  nama_tugas: string;
  jenis_tugas: string;
  deadline: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  estimasi_waktu: number | null;
  actual_hours: number | null;
};

type WeeklyStats = {
  weekLabel: string;
  completed: number;
  pending: number;
};

function getWeekLabel(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  const week = `${date.getDate()}`.padStart(2, "0");
  const month = date.toLocaleDateString("id-ID", { month: "short" });
  return `${week} ${month}`;
}

export default function AnalisisPage() {
  const [supabase] = useState(() => createClient());
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;
      if (!user) {
        setLoading(false);
        return;
      }

      // Cek premium status
      const { data: profile } = await supabase
        .from("users")
        .select("is_premium")
        .eq("id", user.id)
        .single();

      let premium = false;
      if (profile?.is_premium != null) {
        premium = profile.is_premium;
      } else {
        const meta = user.user_metadata;
        if (meta && typeof meta.is_premium === "boolean")
          premium = meta.is_premium;
        else if (meta && typeof meta.plan === "string")
          premium = meta.plan.toLowerCase() === "premium";
        else if (meta && typeof meta.subscription === "string")
          premium = meta.subscription.toLowerCase() === "premium";
      }

      if (!mounted) return;
      setIsPremium(premium);

      const { data, error } = await supabase
        .from("tasks")
        .select(
          "id,nama_tugas,jenis_tugas,deadline,status,created_at,completed_at,estimasi_waktu,actual_hours",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (!mounted) return;
      if (!error) {
        setTasks((data ?? []) as TaskRow[]);
      }
      setLoading(false);
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const weeklyStats = useMemo(() => {
    const last6Weeks: WeeklyStats[] = [];
    const now = new Date();

    for (let index = 5; index >= 0; index -= 1) {
      const start = new Date(now);
      start.setDate(now.getDate() - index * 7);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      const weekTasks = tasks.filter((task) => {
        const createdAt = task.created_at ? new Date(task.created_at) : null;
        return createdAt && createdAt >= start && createdAt <= end;
      });

      last6Weeks.push({
        weekLabel: getWeekLabel(start.toISOString()),
        completed: weekTasks.filter((task) => task.status === "completed").length,
        pending: weekTasks.filter((task) => task.status !== "completed").length,
      });
    }

    return last6Weeks;
  }, [tasks]);

  const completionRate = useMemo(() => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((task) => task.status === "completed").length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  const onTimeRate = useMemo(() => {
    const completed = tasks.filter((t) => t.status === "completed" && t.completed_at);
    if (completed.length === 0) return 0;
    const onTime = completed.filter((t) => {
      if (!t.completed_at || !t.deadline) return true;
      return new Date(t.completed_at) <= new Date(t.deadline);
    }).length;
    return Math.round((onTime / completed.length) * 100);
  }, [tasks]);

  const lateRate = useMemo(() => {
    return 100 - onTimeRate;
  }, [onTimeRate]);

  const mostCommonType = useMemo(() => {
    const counts = tasks.reduce<Record<string, number>>((accumulator, task) => {
      const type = task.jenis_tugas || "Lainnya";
      accumulator[type] = (accumulator[type] ?? 0) + 1;
      return accumulator;
    }, {});
    const entries = Object.entries(counts).sort((left, right) => right[1] - left[1]);
    return entries[0]?.[0] ?? "Belum ada data";
  }, [tasks]);

  const typeBreakdown = useMemo(() => {
    const counts = tasks.reduce<Record<string, number>>((acc, task) => {
      const type = task.jenis_tugas || "Lainnya";
      acc[type] = (acc[type] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [tasks]);

  const timeEstimateAccuracy = useMemo(() => {
    const withData = tasks.filter(
      (t) => t.estimasi_waktu != null && t.actual_hours != null,
    );
    if (withData.length === 0) return null;
    const avgEstimate =
      withData.reduce((sum, t) => sum + (t.estimasi_waktu ?? 0), 0) /
      withData.length;
    const avgActual =
      withData.reduce((sum, t) => sum + (t.actual_hours ?? 0), 0) /
      withData.length;
    return { avgEstimate: Math.round(avgEstimate * 10) / 10, avgActual: Math.round(avgActual * 10) / 10 };
  }, [tasks]);

  const totalCompleted = tasks.filter((t) => t.status === "completed").length;
  const streakDays = 0; // placeholder until streak system is fully wired

  if (isPremium === false) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-800">
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <section className="rounded-[28px] bg-gradient-to-r from-[#1E2761] to-[#028090] p-5 text-white shadow-sm">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} />
              <p className="text-sm font-semibold">Analisis Produktivitas</p>
            </div>
            <h1 className="mt-3 text-2xl font-bold">Fitur Premium</h1>
            <p className="mt-2 text-sm text-white/80">
              Analisis produktivitas hanya tersedia untuk pengguna Premium.
            </p>
          </section>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <Crown size={48} className="mx-auto text-amber-500" />
            <h2 className="mt-4 text-xl font-bold text-[#1E2761]">
              Upgrade ke Premium
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Dapatkan analisis mendalam tentang produktivitas Anda, grafik
              mingguan, perbandingan estimasi vs aktual, dan banyak lagi.
            </p>
            <Link
              href="/profil/subscription"
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#1E2761] px-6 py-3 text-sm font-semibold text-white"
            >
              <Zap size={16} />
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
        <section className="rounded-[28px] bg-gradient-to-r from-[#1E2761] to-[#028090] p-5 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} />
            <p className="text-sm font-semibold">Analisis Produktivitas Premium</p>
          </div>
          <h1 className="mt-3 text-2xl font-bold">Ringkasan performa Anda</h1>
          <p className="mt-2 text-sm text-white/80">
            Pantau progres, ketercapaian deadline, dan pola tugas dari data Supabase.
          </p>
        </section>

        {loading ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Memuat data analisis...</p>
          </section>
        ) : (
          <>
            <section className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-[#028090]">
                  <CheckCircle2 size={16} />
                  <p className="text-sm font-semibold">Tugas selesai</p>
                </div>
                <p className="mt-3 text-3xl font-bold text-[#1E2761]">
                  {totalCompleted}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-[#028090]">
                  <TrendingUp size={16} />
                  <p className="text-sm font-semibold">Streak hari aktif</p>
                </div>
                <p className="mt-3 text-3xl font-bold text-[#1E2761]">
                  {streakDays}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-[#028090]">
                  <Clock3 size={16} />
                  <p className="text-sm font-semibold">Completion rate</p>
                </div>
                <p className="mt-3 text-3xl font-bold text-[#1E2761]">
                  {completionRate}%
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-[#1E2761]">
                Tugas selesai vs belum selesai per minggu
              </h2>
              <div className="mt-4 space-y-3">
                {weeklyStats.map((item) => (
                  <div key={item.weekLabel} className="rounded-2xl bg-slate-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">
                        Minggu {item.weekLabel}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.completed + item.pending} tugas
                      </p>
                    </div>
                    <div className="flex h-3 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-[#028090]"
                        style={{
                          width: `${(item.completed / Math.max(item.completed + item.pending, 1)) * 100}%`,
                        }}
                      />
                      <div
                        className="h-full rounded-full bg-[#1E2761]"
                        style={{
                          width: `${(item.pending / Math.max(item.completed + item.pending, 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>Selesai: {item.completed}</span>
                      <span>Belum selesai: {item.pending}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-[#1E2761]">
                  Tepat waktu vs terlambat
                </h2>
                <div className="mt-4 flex items-end gap-3">
                  <p className="text-4xl font-bold text-[#028090]">{onTimeRate}%</p>
                  <p className="pb-1 text-sm text-slate-500">tepat waktu</p>
                </div>
                <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[#028090]"
                    style={{ width: `${onTimeRate}%` }}
                  />
                  <div
                    className="h-full rounded-full bg-red-400"
                    style={{ width: `${lateRate}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Tepat waktu: {onTimeRate}%</span>
                  <span>Terlambat: {lateRate}%</span>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-[#1E2761]">
                  Jenis tugas paling banyak
                </h2>
                <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                  <p className="text-xl font-bold text-[#1E2761]">
                    {mostCommonType}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    berdasarkan jumlah tugas yang tersimpan
                  </p>
                </div>
                <div className="mt-3 space-y-2">
                  {typeBreakdown.map(([type, count]) => (
                    <div
                      key={type}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-slate-700 capitalize">{type}</span>
                      <span className="font-semibold text-[#1E2761]">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {timeEstimateAccuracy && (
              <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-[#1E2761]">
                  Rata-rata estimasi vs waktu aktual
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-slate-50 p-3 text-center">
                    <p className="text-sm text-slate-500">Estimasi</p>
                    <p className="mt-1 text-2xl font-bold text-[#028090]">
                      {timeEstimateAccuracy.avgEstimate}j
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 text-center">
                    <p className="text-sm text-slate-500">Aktual</p>
                    <p className="mt-1 text-2xl font-bold text-[#1E2761]">
                      {timeEstimateAccuracy.avgActual}j
                    </p>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
