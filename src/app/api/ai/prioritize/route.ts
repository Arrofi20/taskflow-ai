import { NextResponse } from "next/server";

import { analyzeTaskPriorities } from "@/lib/ai/prioritize-tasks";
import { GeminiRateLimitError } from "@/lib/ai/gemini";
import type {
  PrioritizeApiError,
  PrioritizeApiResponse,
} from "@/lib/ai/types";
import { createClient } from "@/lib/supabase/server";
import { getIsPremium } from "@/lib/premium";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<PrioritizeApiError>(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const isPremium = await getIsPremium(supabase, user.id);

    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select(
        "id,nama_tugas,jenis_tugas,deadline,estimasi_waktu,status,prioritas,tingkat_kesulitan",
      )
      .eq("user_id", user.id)
      .neq("status", "completed")
      .order("created_at", { ascending: true });

    if (tasksError) {
      return NextResponse.json<PrioritizeApiError>(
        {
          success: false,
          error: "Failed to fetch tasks. Ensure database migrations are applied.",
        },
        { status: 500 },
      );
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json<PrioritizeApiError>(
        { success: false, error: "No active tasks found for prioritization." },
        { status: 400 },
      );
    }

    const normalizedTasks = tasks.map((task) => ({
      id: task.id,
      title: task.nama_tugas,
      task_type: task.jenis_tugas ?? "tugas",
      due_date: task.deadline,
      estimated_hours: task.estimasi_waktu,
      status: task.status,
    }));

    // Premium: Fetch task history for enhanced analysis
    let taskHistory: Array<{ jenis_tugas: string; status: string; estimasi_waktu: number | null; completed_at: string | null; created_at: string }> | undefined;

    if (isPremium) {
      const { data: historyTasks } = await supabase
        .from("tasks")
        .select("jenis_tugas,status,estimasi_waktu,completed_at,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      taskHistory = historyTasks ?? undefined;
    }

    const prioritizedTasks = await analyzeTaskPriorities(normalizedTasks, isPremium, taskHistory);

    // Simpan hasil AI ke DB — lewati jika kolom belum ada (migration 007)
    try {
      await Promise.all(
        prioritizedTasks.map((task) =>
          supabase
            .from("tasks")
            .update({
              prioritas: task.ai_score,
              ai_score: task.ai_score,
              risk_percentage: task.risk_percentage,
              tingkat_kesulitan: task.tingkat_kesulitan,
            })
            .eq("id", task.id)
            .eq("user_id", user.id),
        ),
      );
    } catch {
      // Kolom ai_score/risk_percentage mungkin belum ada — skip
    }

    return NextResponse.json<PrioritizeApiResponse>({
      success: true,
      analyzedCount: prioritizedTasks.length,
      tasks: prioritizedTasks,
    });
  } catch (error) {
    if (error instanceof GeminiRateLimitError) {
      return NextResponse.json(
        {
          success: false,
          error: "Kuota AI sudah habis. Tunggu sebentar lalu coba lagi, atau upgrade ke Premium untuk akses unlimited.",
          retry_after: error.retryAfter,
          code: "RATE_LIMIT",
        },
        { status: 429 },
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error during task prioritization.";

    const status = message.includes("GEMINI_API_KEY") ? 500 : 502;

    return NextResponse.json<PrioritizeApiError>(
      { success: false, error: message },
      { status },
    );
  }
}
