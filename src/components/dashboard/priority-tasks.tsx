import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Flag } from "lucide-react";

import { getPriorityBadge } from "@/lib/tasks/priority-badge";
import { getTaskTypeLabel } from "@/lib/tasks/validation";

type PriorityTask = {
  id: string;
  title: string;
  task_type: string | null;
  deadline: string | null;
  prioritas: number | null;
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
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Flag className="h-5 w-5 text-[#028090]" />
        <h2 className="text-base font-semibold text-[#1E2761]">
          Prioritas Tertinggi
        </h2>
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          Belum ada tugas aktif. Tambahkan tugas untuk melihat prioritas di sini.
        </p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => {
            const badge = getPriorityBadge(task.prioritas, tasks.length);

            return (
              <li
                key={task.id}
                className="rounded-xl border border-slate-100 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">
                      {task.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDueDate(task.deadline)}
                      {task.task_type && (
                        <span className="ml-1.5 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          {getTaskTypeLabel(task.task_type as import("@/lib/supabase/database.types").TaskType)}
                        </span>
                      )}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
