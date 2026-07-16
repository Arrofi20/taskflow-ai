"use client";

import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CheckCircle2, Clock3, Crown, Plus, Sparkles } from "lucide-react";
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
      const { error } = await supabase
        .from("tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
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
      router.refresh();
    } catch {
      setActionError("Gagal menandai tugas selesai.");
    } finally {
      setCompletingId(null);
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
            };
          }),
        ),
      );
      router.refresh();
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
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleMarkComplete(task.id)}
                    disabled={completingId === task.id}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#1E2761]/15 bg-[#1E2761]/5 px-4 py-2.5 text-sm font-semibold text-[#1E2761] transition hover:bg-[#1E2761]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {completingId === task.id
                      ? "Menyimpan..."
                      : "Tandai Selesai"}
                  </button>
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
