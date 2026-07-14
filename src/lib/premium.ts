import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type AppSupabaseClient = SupabaseClient<Database>;

const FREE_TASK_LIMIT = 5;

export async function getIsPremium(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<boolean> {
  // Coba ambil dari tabel users (public)
  const { data: profile } = await supabase
    .from("users")
    .select("is_premium")
    .eq("id", userId)
    .single();

  if (profile?.is_premium != null) {
    return profile.is_premium;
  }

  // Fallback ke user_metadata
  const { data: { user } } = await supabase.auth.getUser();
  const meta = user?.user_metadata;
  if (meta && typeof meta.is_premium === "boolean") {
    return meta.is_premium;
  }
  if (meta && typeof meta.plan === "string") {
    return meta.plan.toLowerCase() === "premium";
  }
  if (meta && typeof meta.subscription === "string") {
    return meta.subscription.toLowerCase() === "premium";
  }

  return false;
}

export async function getActiveTaskCount(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .neq("status", "completed");

  if (error) {
    console.error("Failed to count active tasks", error);
    return 0;
  }

  return count ?? 0;
}

export async function canCreateTask(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const isPremium = await getIsPremium(supabase, userId);
  if (isPremium) {
    return { allowed: true, current: 0, limit: Infinity };
  }

  const current = await getActiveTaskCount(supabase, userId);
  return { allowed: current < FREE_TASK_LIMIT, current, limit: FREE_TASK_LIMIT };
}

export function getReferralCode(userId: string): string {
  return `TF${userId.slice(0, 8).toUpperCase()}`;
}
