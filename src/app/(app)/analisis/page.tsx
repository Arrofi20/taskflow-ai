"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, CheckCircle2, Clock3, Sparkles } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type TaskRow = {
  id: string;
  nama_tugas: string;
  jenis_tugas: string;
  deadline: string;
  status: string;
  created_at: string;
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

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("tasks")
        .select("id,nama_tugas,jenis_tugas,deadline,status,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (!mounted) {
        return;
      }

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
    if (tasks.length === 0) {
      return 0;
    }

    const completed = tasks.filter((task) => task.status === "completed").length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  const mostCommonType = useMemo(() => {
    const counts = tasks.reduce<Record<string, number>>((accumulator, task) => {
      const type = task.jenis_tugas || "Lainnya";
      accumulator[type] = (accumulator[type] ?? 0) + 1;
      return accumulator;
    }, {});

    const entries = Object.entries(counts).sort((left, right) => right[1] - left[1]);
    return entries[0]?.[0] ?? "Belum ada data";
  }, [tasks]);

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
                  {tasks.filter((task) => task.status === "completed").length}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-[#028090]">
                  <Clock3 size={16} />
                  <p className="text-sm font-semibold">Tepat waktu</p>
                </div>
                <p className="mt-3 text-3xl font-bold text-[#1E2761]">{completionRate}%</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-[#028090]">
                  <Sparkles size={16} />
                  <p className="text-sm font-semibold">Paling sering</p>
                </div>
                <p className="mt-3 text-xl font-bold text-[#1E2761]">{mostCommonType}</p>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-[#1E2761]">Tugas selesai vs belum selesai per minggu</h2>
              <div className="mt-4 space-y-3">
                {weeklyStats.map((item) => (
                  <div key={item.weekLabel} className="rounded-2xl bg-slate-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">Minggu {item.weekLabel}</p>
                      <p className="text-xs text-slate-500">{item.completed + item.pending} tugas</p>
                    </div>
                    <div className="flex h-3 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-[#028090]"
                        style={{ width: `${(item.completed / Math.max(item.completed + item.pending, 1)) * 100}%` }}
                      />
                      <div
                        className="h-full rounded-full bg-[#1E2761]"
                        style={{ width: `${(item.pending / Math.max(item.completed + item.pending, 1)) * 100}%` }}
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
                <h2 className="text-lg font-semibold text-[#1E2761]">Persentase tugas selesai tepat waktu</h2>
                <div className="mt-4 flex items-end gap-3">
                  <p className="text-4xl font-bold text-[#028090]">{completionRate}%</p>
                  <p className="pb-1 text-sm text-slate-500">dari total tugas</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-[#1E2761]">Jenis tugas paling banyak</h2>
                <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                  <p className="text-xl font-bold text-[#1E2761]">{mostCommonType}</p>
                  <p className="mt-1 text-sm text-slate-500">berdasarkan jumlah tugas yang tersimpan</p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
