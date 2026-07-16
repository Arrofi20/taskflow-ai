import { addDays, format, parseISO, subDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AIGenerateButton } from "@/components/schedule/ai-generate-button";
import { CalendarFilter } from "@/components/schedule/calendar-filter";
import { createClient } from "@/lib/supabase/server";
import { getTaskTypeLabel } from "@/lib/tasks/validation";

type ScheduleItem = {
  id: string;
  title: string;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  rekomendasi_ai: string | null;
};

function readStringValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

function normalizeScheduleItem(record: Record<string, unknown>): ScheduleItem {
  const waktuMulai = readStringValue(record, ["waktu_mulai"]);
  const waktuSelesai = readStringValue(record, ["waktu_selesai"]);

  const nestedTasks = record.tasks as Record<string, unknown> | undefined;
  const taskTitle =
    typeof nestedTasks?.nama_tugas === "string" ? nestedTasks.nama_tugas : null;

  let date: string | null = null;
  let startTime: string | null = null;
  let endTime: string | null = null;

  if (waktuMulai) {
    const parsed = parseISO(waktuMulai);
    if (!Number.isNaN(parsed.getTime())) {
      date = format(parsed, "yyyy-MM-dd");
      startTime = format(parsed, "HH:mm");
    }
  }

  if (waktuSelesai) {
    const parsed = parseISO(waktuSelesai);
    if (!Number.isNaN(parsed.getTime())) {
      endTime = format(parsed, "HH:mm");
    }
  }

  return {
    id: String(record.id ?? ""),
    title:
      taskTitle ??
      readStringValue(record, ["title", "nama_kegiatan", "nama_tugas", "judul"]) ??
      "Jadwal",
    date,
    start_time: startTime,
    end_time: endTime,
    rekomendasi_ai: readStringValue(record, ["rekomendasi_ai"]),
  };
}

function formatTimeRange(startTime: string | null, endTime: string | null) {
  if (!startTime && !endTime) return "Sepanjang hari";
  if (startTime && endTime) return `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`;
  if (startTime) return `Mulai ${startTime.slice(0, 5)}`;

  return `Selesai ${endTime!.slice(0, 5)}`;
}

export default async function JadwalPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const selectedDate =
    resolvedSearchParams?.date ?? format(new Date(), "yyyy-MM-dd");
  const selectedDateObject = parseISO(selectedDate);

  const selectedDateStart = `${selectedDate}T00:00:00+07:00`;
  const selectedDateEnd = `${selectedDate}T23:59:59+07:00`;

  const { data: scheduleRows, error } = await supabase
    .from("schedules")
    .select("id, waktu_mulai, waktu_selesai, rekomendasi_ai, tasks!inner(nama_tugas, jenis_tugas)")
    .eq("user_id", authData.user.id)
    .gte("waktu_mulai", selectedDateStart)
    .lte("waktu_mulai", selectedDateEnd)
    .order("waktu_mulai", { ascending: true });

  const normalizedSchedules = (scheduleRows ?? []).map((record) =>
    normalizeScheduleItem(record as Record<string, unknown>),
  );

  const visibleSchedules = normalizedSchedules.filter((schedule) => {
    if (!schedule.date) {
      return true;
    }

    return schedule.date === selectedDate;
  });

  // Ambil juga tugas yang deadline-nya jatuh pada tanggal ini
  const { data: deadlineTasks } = await supabase
    .from("tasks")
    .select("id,nama_tugas,jenis_tugas,deadline,prioritas,status")
    .eq("user_id", authData.user.id)
    .neq("status", "completed")
    .gte("deadline", selectedDateStart)
    .lte("deadline", selectedDateEnd)
    .order("deadline", { ascending: true });

  const normalizedDeadlineTasks = (deadlineTasks ?? []).map((task) => ({
    id: String(task.id ?? ""),
    title: String(task.nama_tugas ?? "Tugas"),
    task_type: String(task.jenis_tugas ?? "tugas") as
      | "tugas"
      | "ujian"
      | "proyek"
      | "presentasi"
      | "praktikum",
    deadline: typeof task.deadline === "string" ? task.deadline : null,
    prioritas: typeof task.prioritas === "number" ? task.prioritas : null,
  }));

  return (
    <main className="px-4 py-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E2761]">Jadwal</h1>
          <p className="mt-1 text-sm text-slate-600">
            Kelola jadwal belajar harian Anda dengan timeline yang terurut.
          </p>
        </div>

        <AIGenerateButton selectedDate={selectedDate} />
      </div>

      <div className="mb-4 flex items-center justify-between rounded-2xl card-vibrant p-3">
        <Link
          href={`/jadwal?date=${format(subDays(selectedDateObject, 1), "yyyy-MM-dd")}`}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Sebelumnya
        </Link>

        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {format(selectedDateObject, "EEEE", { locale: localeId })}
          </p>
          <CalendarFilter selectedDate={selectedDate} />
        </div>

        <Link
          href={`/jadwal?date=${format(addDays(selectedDateObject, 1), "yyyy-MM-dd")}`}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Berikutnya
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Gagal memuat jadwal dari database.
        </div>
      ) : (
        <div className="space-y-6">
          {visibleSchedules.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1E2761]">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-[#028090] to-[#6bcb77] text-[8px] text-white">B</span>
                Jadwal Belajar
              </h2>
              <ul className="space-y-3">
                {visibleSchedules.map((schedule) => (
                  <li
                    key={schedule.id}
                    className="card-vibrant rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{schedule.title}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {formatTimeRange(schedule.start_time, schedule.end_time)}
                        </p>
                        {schedule.rekomendasi_ai && (
                          <p className="mt-1 text-xs italic text-slate-500">
                            {schedule.rekomendasi_ai}
                          </p>
                        )}
                      </div>
                      <span className="rounded-full bg-[#028090]/10 px-3 py-1 text-xs font-semibold text-[#028090]">
                        {schedule.date ? format(parseISO(schedule.date), "d MMM", { locale: localeId }) : "Hari ini"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {normalizedDeadlineTasks.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1E2761]">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-[#ff6b6b] to-[#ff8e8e] text-[8px] text-white">D</span>
                Deadline Tugas
              </h2>
              <ul className="space-y-3">
                {normalizedDeadlineTasks.map((task) => (
                  <li
                    key={task.id}
                    className="card-vibrant rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{task.title}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          Deadline: {task.deadline ? format(parseISO(task.deadline), "HH:mm", { locale: localeId }) : "--:--"}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#ff6b6b]/10 px-3 py-1 text-xs font-semibold text-[#ff6b6b]">
                        {getTaskTypeLabel(task.task_type)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {visibleSchedules.length === 0 && normalizedDeadlineTasks.length === 0 && (
            <div className="card-vibrant rounded-2xl px-6 py-10 text-center text-sm text-slate-600">
              <p className="mb-1">Belum ada jadwal untuk tanggal ini.</p>
              <p className="text-xs text-slate-500">
                Tekan &ldquo;Regenerasi AI&rdquo; untuk membuat jadwal otomatis dari tugas aktif Anda.
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
