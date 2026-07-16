"use client";

import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Flag, Sparkles } from "lucide-react";

import { PriorityScoreBar } from "@/components/tasks/priority-score-bar";
import { RiskIndicator } from "@/components/tasks/risk-indicator";
import type { TaskType } from "@/lib/supabase/database.types";
import { getTaskTypeLabel } from "@/lib/tasks/validation";

type PriorityTask = {
  id: string;
  title: string;
  task_type: string | null;
  deadline: string | null;
  prioritas: number | null;
  ai_score: number | null;
  risk_percentage: number | null;
  status: string;
};

type PriorityTasksProps = {
  tasks: PriorityTask[];
};

function formatDueDate(dueDate: string | null) {
  if (!dueDate) return "Tanpa deadline";
  return format(parseISO(dueDate), "d MMM yyyy, HH:mm", { locale: localeId });
}

export function PriorityTasks({ tasks }: PriorityTasksProps) {
  return (
    <section className="card-vibrant-accent rounded-2xl p-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#1E2761] to-[#028090] text-white shadow-sm">
          <Flag className="h-4 w-4" />
        </div>
        <h2 className="text-base font-semibold text-[#1E2761]">
          Prioritas Tertinggi
        </h2>
        <Sparkles size={14} className="ml-auto text-[#a66cff]" />
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-xl bg-gradient-to-r from-[#f0f4ff] via-[#fef9f0] to-[#f0f4ff] px-4 py-8 text-center">
          <p className="text-sm text-slate-500">
            Belum ada tugas aktif. Tambahkan tugas untuk melihat prioritas di sini.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task, index) => (
            <li
              key={task.id}
              className="group rounded-xl border border-slate-100 bg-white px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-md"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-slate-900">
                      {task.title}
                    </p>
                    <RiskIndicator risk={task.risk_percentage} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDueDate(task.deadline)}
                    {task.task_type && (
                      <span className="ml-1.5 inline-flex rounded-full bg-gradient-to-r from-[#1E2761]/8 to-[#028090]/8 px-2 py-0.5 text-[10px] font-medium text-[#1E2761]">
                        {getTaskTypeLabel(task.task_type as TaskType)}
                      </span>
                    )}
                  </p>
                  <div className="mt-3">
                    <PriorityScoreBar score={task.ai_score ?? task.prioritas} />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
