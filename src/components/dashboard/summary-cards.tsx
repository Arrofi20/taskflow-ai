import { AlertCircle, CalendarClock, ListTodo } from "lucide-react";

type SummaryCardsProps = {
  totalTasks: number;
  tasksToday: number;
  approachingDeadline: number;
};

const cards = [
  {
    key: "totalTasks" as const,
    label: "Total Tugas",
    icon: ListTodo,
    accent: "bg-[#1E2761]/10 text-[#1E2761]",
  },
  {
    key: "tasksToday" as const,
    label: "Tugas Hari Ini",
    icon: CalendarClock,
    accent: "bg-[#028090]/10 text-[#028090]",
  },
  {
    key: "approachingDeadline" as const,
    label: "Mendekati Deadline",
    icon: AlertCircle,
    accent: "bg-amber-100 text-amber-700",
  },
];

export function SummaryCards({
  totalTasks,
  tasksToday,
  approachingDeadline,
}: SummaryCardsProps) {
  const values = { totalTasks, tasksToday, approachingDeadline };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(({ key, label, icon: Icon, accent }) => (
        <div
          key={key}
          className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-1 text-3xl font-bold text-[#1E2761]">
                {values[key]}
              </p>
            </div>
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}
            >
              <Icon className="h-5 w-5" />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
