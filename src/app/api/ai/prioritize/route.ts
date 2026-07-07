import { NextResponse } from "next/server";

import { analyzeTaskPriorities } from "@/lib/ai/prioritize-tasks";
import type {
  PrioritizeApiError,
  PrioritizeApiResponse,
} from "@/lib/ai/types";
import { createClient } from "@/lib/supabase/server";

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

    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id, title, task_type, due_date, estimated_hours, status")
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

    const prioritizedTasks = await analyzeTaskPriorities(tasks);

    const updateResults = await Promise.all(
      prioritizedTasks.map((task) =>
        supabase
          .from("tasks")
          .update({
            prioritas: task.prioritas,
            tingkat_kesulitan: task.tingkat_kesulitan,
            updated_at: new Date().toISOString(),
          })
          .eq("id", task.id)
          .eq("user_id", user.id),
      ),
    );

    const failedUpdate = updateResults.find((result) => result.error);

    if (failedUpdate?.error) {
      return NextResponse.json<PrioritizeApiError>(
        {
          success: false,
          error: `Failed to save prioritization results: ${failedUpdate.error.message}`,
        },
        { status: 500 },
      );
    }

    return NextResponse.json<PrioritizeApiResponse>({
      success: true,
      analyzedCount: prioritizedTasks.length,
      tasks: prioritizedTasks,
    });
  } catch (error) {
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
