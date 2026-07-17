import { createClient } from "@/lib/supabase/server";

type ActivityCategory = "task" | "schedule" | "ai" | "premium" | "auth" | "google" | "other";

export async function logActivity(
  userId: string,
  action: string,
  category: ActivityCategory = "other",
  detail?: Record<string, unknown>,
) {
  try {
    const supabase = await createClient();
    await supabase.from("activity_history").insert({
      user_id: userId,
      action,
      category,
      detail: detail ?? null,
    });
  } catch {
    // Silent fail — activity logging is best-effort
  }
}
