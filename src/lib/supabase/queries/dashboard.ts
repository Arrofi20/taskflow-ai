import { addDays, format } from "date-fns";
import { parseISO } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import { getIsPremium } from "@/lib/premium";

type AppSupabaseClient = SupabaseClient<Database>;

export type DashboardSummary = {
  totalTasks: number;
  tasksToday: number;
  approachingDeadline: number;
};

export type DashboardPriorityTask = {
  id: string;
  title: string;
  task_type: string | null;
  deadline: string | null;
  prioritas: number | null;
  ai_score: number | null;
  risk_percentage: number | null;
  status: string;
};

export type DashboardScheduleItem = {
  id: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
  rekomendasi_ai: string | null;
  // Premium fields
  durasi_istirahat?: number | null;
  energi_level?: "tinggi" | "sedang" | "rendah" | null;
  tips_fokus?: string | null;
};

export type DashboardData = {
  fullName: string;
  summary: DashboardSummary;
  priorityTasks: DashboardPriorityTask[];
  todaySchedule: DashboardScheduleItem[];
  // Premium fields
  analisisGayaBelajar?: {
    tipe_belajar: string;
    jam_optimal: string[];
    pola_belajar: string;
  } | null;
  rekomendasiUmum?: string[] | null;
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

function normalizePriorityTask(record: Record<string, unknown>): DashboardPriorityTask {
  const taskType = readStringValue(record, ["jenis_tugas", "task_type"]);

  return {
    id: String(record.id ?? ""),
    title: readStringValue(record, ["nama_tugas", "title"]) ?? "Tugas",
    task_type:
      taskType && ["tugas", "ujian", "proyek", "presentasi", "praktikum"].includes(taskType)
        ? taskType
        : null,
    deadline:
      typeof record.deadline === "string"
        ? record.deadline
        : typeof record.due_date === "string"
          ? record.due_date
          : null,
    prioritas:
      typeof record.prioritas === "number"
        ? record.prioritas
        : typeof record.priority === "number"
          ? record.priority
          : null,
    ai_score:
      typeof record.ai_score === "number"
        ? record.ai_score
        : null,
    risk_percentage:
      typeof record.risk_percentage === "number"
        ? record.risk_percentage
        : null,
    status:
      typeof record.status === "string"
        ? record.status
        : "pending",
  };
}

function normalizeScheduleItem(record: Record<string, unknown>): DashboardScheduleItem {
  const waktuMulai = readStringValue(record, ["waktu_mulai"]);
  const waktuSelesai = readStringValue(record, ["waktu_selesai"]);

  // Supabase join mengembalikan nested object "tasks"
  const nestedTasks = record.tasks as Record<string, unknown> | undefined;
  const taskTitle =
    typeof nestedTasks?.nama_tugas === "string"
      ? nestedTasks.nama_tugas
      : null;

  let startTime: string | null = null;
  let endTime: string | null = null;

  if (waktuMulai) {
    const parsed = parseISO(waktuMulai);
    if (!Number.isNaN(parsed.getTime())) {
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
    start_time: startTime,
    end_time: endTime,
    rekomendasi_ai: typeof record.rekomendasi_ai === "string" ? record.rekomendasi_ai : null,
    durasi_istirahat: typeof record.durasi_istirahat === "number" ? record.durasi_istirahat : null,
    energi_level: typeof record.energi_level === "string" ? record.energi_level as "tinggi" | "sedang" | "rendah" : null,
    tips_fokus: typeof record.tips_fokus === "string" ? record.tips_fokus : null,
  };
}

export async function getDashboardData(
  supabase: AppSupabaseClient,
  userId: string,
  fallbackName?: string | null,
): Promise<DashboardData> {
  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");
  const todayStart = `${todayStr}T00:00:00+07:00`;
  const todayEnd = `${todayStr}T23:59:59+07:00`;
  const deadlineEndStr = format(addDays(now, 3), "yyyy-MM-dd");
  const deadlineEnd = `${deadlineEndStr}T23:59:59+07:00`;

  const [
    totalTasksResult,
    tasksTodayResult,
    approachingDeadlineResult,
    priorityTasksResult,
    todayScheduleResult,
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .neq("status", "completed"),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .neq("status", "completed")
      .gte("deadline", todayStart)
      .lte("deadline", todayEnd),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .neq("status", "completed")
      .gte("deadline", now.toISOString())
      .lte("deadline", deadlineEnd),
    supabase
      .from("tasks")
      .select("id,nama_tugas,jenis_tugas,deadline,prioritas,ai_score,risk_percentage,status")
      .eq("user_id", userId)
      .neq("status", "completed")
      .order("prioritas", { ascending: true, nullsFirst: true })
      .order("deadline", { ascending: true })
      .limit(3),
    supabase
      .from("schedules")
      .select("id, waktu_mulai, waktu_selesai, rekomendasi_ai, tasks!inner(nama_tugas)")
      .eq("user_id", userId)
      .gte("waktu_mulai", todayStart)
      .lte("waktu_mulai", todayEnd)
      .order("waktu_mulai", { ascending: true })
      .limit(3),
  ]);

  const fullName = fallbackName ?? "Pengguna";

  // Check premium status
  const isPremium = await getIsPremium(supabase, userId);

  let analisisGayaBelajar: DashboardData["analisisGayaBelajar"] = null;
  let rekomendasiUmum: DashboardData["rekomendasiUmum"] = null;

  if (isPremium) {
    // Fetch latest schedule generation result for learning style analysis
    const { data: latestSchedule } = await supabase
      .from("schedules")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // For now, we'll use a placeholder - in production, this would come from the AI response
    // The actual data is stored in the schedule generation response and passed to the client
    // We'll fetch it from the client-side after schedule generation
  }

  return {
    fullName,
    summary: {
      totalTasks: totalTasksResult.count ?? 0,
      tasksToday: tasksTodayResult.count ?? 0,
      approachingDeadline: approachingDeadlineResult.count ?? 0,
    },
    priorityTasks: (priorityTasksResult.data ?? []).map((record) =>
      normalizePriorityTask(record as Record<string, unknown>),
    ),
    todaySchedule: (todayScheduleResult.data ?? []).map((record) =>
      normalizeScheduleItem(record as Record<string, unknown>),
    ),
    analisisGayaBelajar,
    rekomendasiUmum,
  };
}
