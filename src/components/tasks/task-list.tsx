"use client";

import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CheckCircle2, Clock3, Crown, Plus, Sparkles, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { EmptyTasksState } from "@/components/tasks/empty-state";
import { PriorityScoreBar } from "@/components/tasks/priority-score-bar";
import { RiskIndicator } from "@/components/tasks/risk-indicator";
import { createClient } from "@/lib/supabase/client";
import type { TaskStatus, TaskType } from "@/lib/supabase/database.types";
import { getTaskTypeLabel } from "@/lib/tasks/validation";

function sortTasksByAiScore(tasks: TaskListItem[]) {
  return [...tasks].sort((a, b) => {
    const scoreA = a.ai_score ?? -1;
    const scoreB = b.ai_score ?? -1;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return (a.due_date ?? "").localeCompare(b.due_date ?? "");
  });
}

export type TaskListItem = {
  id: string;
  title: string;
  task_type: TaskType;
  due_date: string | null;
  estimated_hours: number | null;
  prioritas: number | null;
  ai_score: number | null;
  risk_percentage: number | null;
  tingkat_kesulitan: string | null;
  status: TaskStatus;
  // Premium fields
  faktor_analisis?: {
    deadline_weight: number;
    jenis_weight: number;
    estimasi_weight: number;
    histori_weight: number;
  };
  rekomendasi_tindakan?: string | null;
  strategi_mitigasi?: string | null;
  waktu_pengerjaan_optimal?: string | null;
};

type ScheduleMap = Record<string, { start: string; end: string }>;

type TaskListProps = {
  initialTasks: TaskListItem[];
  fetchError?: string | null;
};

export function TaskList({ initialTasks, fetchError }: TaskListProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [actionError, setActionError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [activeCount, setActiveCount] = useState(0);
  const [schedules, setSchedules] = useState<ScheduleMap>({});
  const [loadingSchedules, setLoadingSchedules] = useState(true);

  useEffect(() => {
    setTasks(initialTasks);
    setActiveCount(initialTasks.filter((t) => t.status !== "completed").length);
  }, [initialTasks]);

  useEffect(() => {
    const supabase = createClient();
    async function loadPremium() {
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
    loadPremium();
  }, []);

  useEffect(() => {
    const supabase = createClient();
    async function loadSchedules() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const now = new Date();
      const todayStart = `${now.toISOString().slice(0, 10)}T00:00:00+07:00`;
      const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const weekEndStr = `${weekEnd.toISOString().slice(0, 10)}T23:59:59+07:00`;

      const { data } = await supabase
        .from("schedules")
        .select("task_id,waktu_mulai,waktu_selesai")
        .eq("user_id", session.user.id)
        .gte("waktu_mulai", todayStart)
        .lte("waktu_mulai", weekEndStr)
        .order("waktu_mulai", { ascending: true });

      const map: ScheduleMap = {};
      (data ?? []).forEach((s) => {
        const taskId = String(s.task_id);
        if (!map[taskId]) {
          const start = s.waktu_mulai ? format(parseISO(s.waktu_mulai), "HH:mm") : "";
          const end = s.waktu_selesai ? format(parseISO(s.waktu_selesai), "HH:mm") : "";
          map[taskId] = { start, end };
        }
      });
      setSchedules(map);
      setLoadingSchedules(false);
    }
    loadSchedules();
  }, []);

  const activeTasks = sortTasksByAiScore(
    tasks.filter((task) => task.status !== "completed"),
  );

  async function handleMarkComplete(taskId: string) {
    setActionError(null);
    setCompletingId(taskId);

    try {
      const supabase = createClient();

      // Fetch task created_at to calculate actual_hours
      const { data: taskData } = await supabase
        .from("tasks")
        .select("created_at,estimasi_waktu")
        .eq("id", taskId)
        .single();

      const now = new Date();
      let actualHours: number | null = null;
      if (taskData?.created_at) {
        const created = new Date(taskData.created_at);
        const diffMs = now.getTime() - created.getTime();
        actualHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10; // round to 1 decimal
        // If less than 0.5 hours, use estimasi_waktu as fallback
        if (actualHours < 0.5 && taskData.estimasi_waktu) {
          actualHours = taskData.estimasi_waktu;
        }
      }

      const { error } = await supabase
        .from("tasks")
        .update({
          status: "completed",
          completed_at: now.toISOString(),
          actual_hours: actualHours,
        })
        .eq("id", taskId);

      if (error) {
        setActionError(error.message);
        return;
      }

      setTasks((current) =>
        current.map((task) =>
          task.id === taskId ? { ...task, status: "completed" } : task,
        ),
      );
      setActiveCount((c) => Math.max(0, c - 1));

      // Log activity
      const taskName = tasks.find((t) => t.id === taskId)?.title ?? "Tugas";
      fetch("/api/activity/history/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "Tugas diselesaikan",
          category: "task",
          detail: { task_name: taskName },
        }),
      }).catch(() => {});

      router.refresh();
    } catch {
      setActionError("Gagal menandai tugas selesai.");
    } finally {
      setCompletingId(null);
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm("Hapus tugas ini?")) return;
    setActionError(null);
    setDeletingId(taskId);

    try {
      const supabase = createClient();
      const taskName = tasks.find((t) => t.id === taskId)?.title ?? "Tugas";

      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (error) {
        setActionError(error.message);
        return;
      }

      setTasks((current) => current.filter((t) => t.id !== taskId));
      setActiveCount((c) => Math.max(0, c - 1));

      fetch("/api/activity/history/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "Tugas dihapus",
          category: "task",
          detail: { task_name: taskName },
        }),
      }).catch(() => {});

      router.refresh();
    } catch {
      setActionError("Gagal menghapus tugas.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleGeneratePriorities() {
    setActionError(null);
    setIsPrioritizing(true);

    try {
      const response = await fetch("/api/ai/prioritize", { method: "POST" });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setActionError(data.error ?? "Gagal generate prioritas AI.");
        return;
      }

      setTasks((current) =>
        sortTasksByAiScore(
          current.map((task) => {
            const result = data.tasks.find(
              (item: { id: string }) => item.id === task.id,
            );

            if (!result) return task;

            return {
              ...task,
              ai_score: result.ai_score,
              risk_percentage: result.risk_percentage,
              prioritas: result.ai_score,
              tingkat_kesulitan:
                result.tingkat_kesulitan != null
                  ? String(result.tingkat_kesulitan)
                  : null,
              faktor_analisis: result.faktor_analisis ?? undefined,
              rekomendasi_tindakan: result.rekomendasi_tindakan ?? null,
              strategi_mitigasi: result.strategi_mitigasi ?? null,
              waktu_pengerjaan_optimal: result.waktu_pengerjaan_optimal ?? null,
            };
          }),
        ),
      );
      router.refresh();

      // Log activity
      fetch("/api/activity/history/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "AI Prioritas dijalankan",
          category: "ai",
          detail: { task_count: data.tasks?.length ?? 0 },
        }),
      }).catch(() => {});
    } catch {
      setActionError("Gagal menghubungi layanan AI prioritas.");
    } finally {
      setIsPrioritizing(false);
    }
  }

  const showUpgradeBanner = isPremium === false && activeCount >= 5;

  return (
    <>
      <main className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1E2761]">Daftar Tugas</h1>
          <p className="mt-1 text-sm text-slate-600">
            Tugas diurutkan berdasarkan skor prioritas AI.
          </p>

          <button
            type="button"
            onClick={handleGeneratePriorities}
            disabled={isPrioritizing || activeTasks.length === 0}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#028090]/30 bg-[#028090]/10 px-4 py-3 text-sm font-semibold text-[#028090] transition hover:bg-[#028090]/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            {isPrioritizing ? "Menganalisis..." : "Generate AI Prioritas"}
          </button>
        </div>

        {(fetchError || actionError) && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {fetchError ?? actionError}
          </div>
        )}

        {showUpgradeBanner && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <div className="flex items-center gap-2 font-semibold">
              <Crown size={16} />
              Batas tugas aktif tercapai
            </div>
            <p className="mt-1">
              Anda telah mencapai batas maksimal 5 tugas aktif. Selesaikan
              beberapa tugas atau upgrade ke Premium untuk unlimited tugas.
            </p>
            <Link
              href="/profil/subscription"
              className="mt-2 inline-block rounded-lg bg-[#1E2761] px-3 py-1.5 text-xs font-semibold text-white"
            >
              Upgrade ke Premium
            </Link>
          </div>
        )}

        {activeTasks.length === 0 ? (
          <EmptyTasksState />
        ) : (
          <ul className="space-y-4">
            {activeTasks.map((task) => {
              const schedule = schedules[task.id];

              return (
                  <li
                      key={task.id}
                      className="card-vibrant rounded-2xl p-4 transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">
                          {task.title}
                        </p>
                        <RiskIndicator risk={task.risk_percentage} />
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        {getTaskTypeLabel(task.task_type)}
                        {task.tingkat_kesulitan != null &&
                          ` · Kesulitan ${task.tingkat_kesulitan}`}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
                        {task.due_date && (
                          <span className="inline-flex items-center gap-1 font-medium text-[#028090]">
                            <Clock3 className="h-3.5 w-3.5" />
                            {format(parseISO(task.due_date), "d MMM yyyy, HH:mm", {
                              locale: localeId,
                            })}
                          </span>
                        )}
                        {task.estimated_hours != null && (
                          <span className="inline-flex items-center gap-1">
                            Estimasi: {task.estimated_hours} jam
                          </span>
                        )}
                        {schedule && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#1E2761]/10 px-2 py-0.5 text-[#1E2761]">
                            <Clock3 className="h-3 w-3" />
                            Jadwal: {schedule.start} - {schedule.end}
                          </span>
                        )}
                      </div>

                      <div className="mt-4">
                        <PriorityScoreBar score={task.ai_score} />
                      </div>

                      {/* Premium: Detailed Analysis */}
                      {task.faktor_analisis && (
                        <div className="mt-3 rounded-xl bg-gradient-to-r from-[#1E2761]/5 to-[#028090]/5 p-2.5 sm:p-3">
                          <p className="text-[11px] font-semibold text-[#1E2761] sm:text-xs">Analisis Faktor:</p>
                          <div className="mt-1.5 grid grid-cols-2 gap-1 text-[11px] text-slate-600 sm:gap-1.5 sm:text-xs">
                            <span>Deadline: {task.faktor_analisis.deadline_weight}%</span>
                            <span>Jenis: {task.faktor_analisis.jenis_weight}%</span>
                            <span>Estimasi: {task.faktor_analisis.estimasi_weight}%</span>
                            <span>Histori: {task.faktor_analisis.histori_weight}%</span>
                          </div>
                        </div>
                      )}

                      {task.rekomendasi_tindakan && (
                        <div className="mt-2 rounded-lg bg-[#028090]/5 px-2.5 py-2 sm:px-3">
                          <p className="text-[11px] font-medium text-[#028090] sm:text-xs">Rekomendasi:</p>
                          <p className="text-[11px] text-slate-600 sm:text-xs">{task.rekomendasi_tindakan}</p>
                        </div>
                      )}

                      {task.strategi_mitigasi && (
                        <div className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 sm:px-3">
                          <p className="text-[11px] font-medium text-amber-700 sm:text-xs">Strategi Mitigasi:</p>
                          <p className="text-[11px] text-slate-600 sm:text-xs">{task.strategi_mitigasi}</p>
                        </div>
                      )}

                      {task.waktu_pengerjaan_optimal && (
                        <div className="mt-2 text-[11px] text-[#028090] sm:text-xs">
                          <span className="font-medium">Waktu optimal:</span> {task.waktu_pengerjaan_optimal}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleMarkComplete(task.id)}
                      disabled={completingId === task.id}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#1E2761]/15 bg-[#1E2761]/5 px-3 py-3 text-xs font-semibold text-[#1E2761] transition hover:bg-[#1E2761]/10 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-2.5 sm:text-sm"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {completingId === task.id
                        ? "Menyimpan..."
                        : "Selesai"}
                    </button>
                    <Link
                      href={`/tugas/edit/${task.id}`}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      disabled={deletingId === task.id}
                      className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-3 py-3 text-sm font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <Link
        href="/tugas/tambah"
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1E2761] to-[#028090] text-white shadow-lg shadow-[#1E2761]/30 transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#028090]/40"
        aria-label="Tambah tugas"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </>
  );
}
