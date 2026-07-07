import { addDays, endOfDay, format, startOfDay } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, StudySchedule, Task } from "@/lib/supabase/database.types";

type AppSupabaseClient = SupabaseClient<Database>;

export type DashboardSummary = {
  totalTasks: number;
  tasksToday: number;
  approachingDeadline: number;
};

export type DashboardData = {
  fullName: string;
  summary: DashboardSummary;
  priorityTasks: Pick<Task, "id" | "title" | "due_date" | "priority" | "status">[];
  todaySchedule: Pick<StudySchedule, "id" | "title" | "start_time" | "end_time">[];
};

export async function getDashboardData(
  supabase: AppSupabaseClient,
  userId: string,
  fallbackName?: string | null,
): Promise<DashboardData> {
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const todayStart = startOfDay(now).toISOString();
  const todayEnd = endOfDay(now).toISOString();
  const deadlineEnd = endOfDay(addDays(now, 3)).toISOString();

  const [
    profileResult,
    totalTasksResult,
    tasksTodayResult,
    approachingDeadlineResult,
    priorityTasksResult,
    todayScheduleResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle(),
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
      .gte("due_date", todayStart)
      .lte("due_date", todayEnd),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .neq("status", "completed")
      .not("due_date", "is", null)
      .gte("due_date", now.toISOString())
      .lte("due_date", deadlineEnd),
    supabase
      .from("tasks")
      .select("id, title, due_date, priority, status")
      .eq("user_id", userId)
      .neq("status", "completed")
      .order("priority", { ascending: false })
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(3),
    supabase
      .from("study_schedules")
      .select("id, title, start_time, end_time")
      .eq("user_id", userId)
      .eq("scheduled_date", today)
      .order("start_time", { ascending: true, nullsFirst: false }),
  ]);

  const fullName =
    profileResult.data?.full_name ?? fallbackName ?? "Pengguna";

  return {
    fullName,
    summary: {
      totalTasks: totalTasksResult.count ?? 0,
      tasksToday: tasksTodayResult.count ?? 0,
      approachingDeadline: approachingDeadlineResult.count ?? 0,
    },
    priorityTasks: priorityTasksResult.data ?? [],
    todaySchedule: todayScheduleResult.data ?? [],
  };
}
