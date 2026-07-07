import { BookOpen, Clock3 } from "lucide-react";

type ScheduleItem = {
  id: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
};

type TodayScheduleProps = {
  schedules: ScheduleItem[];
};

function formatTimeRange(startTime: string | null, endTime: string | null) {
  if (!startTime && !endTime) return "Sepanjang hari";
  if (startTime && endTime) return `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`;
  if (startTime) return `Mulai ${startTime.slice(0, 5)}`;

  return `Selesai ${endTime!.slice(0, 5)}`;
}

export function TodaySchedule({ schedules }: TodayScheduleProps) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-[#028090]" />
        <h2 className="text-base font-semibold text-[#1E2761]">
          Jadwal Belajar Hari Ini
        </h2>
      </div>

      {schedules.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          Tidak ada jadwal belajar hari ini. Atur jadwal di menu Jadwal.
        </p>
      ) : (
        <ul className="space-y-3">
          {schedules.map((schedule) => (
            <li
              key={schedule.id}
              className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#028090]/10 text-[#028090]">
                <Clock3 className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">
                  {schedule.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatTimeRange(schedule.start_time, schedule.end_time)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
