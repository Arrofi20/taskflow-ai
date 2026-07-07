"use client";

import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CheckCircle2, Clock3, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { TaskStatus, TaskType } from "@/lib/supabase/database.types";
import { getPriorityBadge } from "@/lib/tasks/priority-badge";
import { getTaskTypeLabel } from "@/lib/tasks/validation";

function sortTasksByPriority(tasks: TaskListItem[]) {
  return [...tasks].sort((a, b) => {
    if (a.prioritas == null && b.prioritas == null) {
      return (a.due_date ?? "").localeCompare(b.due_date ?? "");
    }

    if (a.prioritas == null) return 1;
    if (b.prioritas == null) return -1;

    if (a.prioritas !== b.prioritas) {
      return a.prioritas - b.prioritas;
    }

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
  tingkat_kesulitan: number | null;
  status: TaskStatus;
};

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

  const activeTasks = sortTasksByPriority(
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
          updated_at: new Date().toISOString(),
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
        sortTasksByPriority(
          current.map((task) => {
            const result = data.tasks.find(
              (item: { id: string }) => item.id === task.id,
            );

            if (!result) return task;

            return {
              ...task,
              prioritas: result.prioritas,
              tingkat_kesulitan: result.tingkat_kesulitan,
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

  return (
    <>
      <main className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1E2761]">Daftar Tugas</h1>
          <p className="mt-1 text-sm text-slate-600">
            Tugas diurutkan berdasarkan prioritas AI.
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

        {activeTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
            <p className="text-sm text-slate-600">
              {tasks.length === 0
                ? "Belum ada tugas."
                : "Semua tugas sudah selesai."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {activeTasks.map((task) => {
              const badge = getPriorityBadge(
                task.prioritas,
                activeTasks.length,
              );

              return (
                <li
                  key={task.id}
                  className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">
                          {task.title}
                        </p>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        {getTaskTypeLabel(task.task_type)}
                        {task.tingkat_kesulitan != null &&
                          ` · Kesulitan ${task.tingkat_kesulitan}/10`}
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
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#1E2761] text-white shadow-lg shadow-[#1E2761]/30 transition hover:bg-[#028090] focus:outline-none focus:ring-2 focus:ring-[#028090]/40"
        aria-label="Tambah tugas"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </>
  );
}
