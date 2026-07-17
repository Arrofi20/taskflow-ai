import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ?? "";
const cronSecret = process.env.CRON_SECRET ?? "";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:support@taskflow-ai.app",
    vapidPublicKey,
    vapidPrivateKey,
  );
}

function getServiceClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ success: false, error: "VAPID keys not configured" }, { status: 500 });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ success: false, error: "Supabase service key not configured" }, { status: 500 });
  }

  const supabase = getServiceClient();

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { data: usersWithSubs } = await supabase
    .from("push_subscriptions")
    .select("user_id");

  if (!usersWithSubs || usersWithSubs.length === 0) {
    return NextResponse.json({ success: true, sent: 0 });
  }

  const uniqueUserIds = [...new Set(usersWithSubs.map((s) => s.user_id))];

  let sentCount = 0;
  const debug = { userCount: uniqueUserIds.length, users: [] as unknown[] };

  for (const user_id of uniqueUserIds) {
    const { data: allActiveTasks } = await supabase
      .from("tasks")
      .select("id,nama_tugas,deadline,estimasi_waktu,status,risk_percentage,ai_score")
      .eq("user_id", user_id)
      .neq("status", "completed")
      .order("deadline", { ascending: true });

    if (!allActiveTasks || allActiveTasks.length === 0) {
      debug.users.push({ user_id, taskCount: 0, reason: "no active tasks" });
      continue;
    }

    const urgentTasks = allActiveTasks.filter(
      (t) => t.deadline && new Date(t.deadline) <= tomorrow && new Date(t.deadline) >= now,
    );
    const highRiskTasks = allActiveTasks.filter(
      (t) => t.risk_percentage != null && t.risk_percentage > 70,
    );
    const upcomingTasks = allActiveTasks.filter(
      (t) => t.deadline && new Date(t.deadline) > tomorrow && new Date(t.deadline) <= nextWeek,
    );

    debug.users.push({
      user_id,
      taskCount: allActiveTasks.length,
      urgent: urgentTasks.length,
      highRisk: highRiskTasks.length,
      upcoming: upcomingTasks.length,
      sampleDeadline: allActiveTasks[0]?.deadline,
    });

    if (urgentTasks.length === 0 && highRiskTasks.length === 0 && upcomingTasks.length === 0) {
      continue;
    }

    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", user_id);

    if (!subscriptions || subscriptions.length === 0) continue;

    let title = "";
    let body = "";

    if (highRiskTasks.length > 0) {
      const taskNames = highRiskTasks.slice(0, 3).map((t) => t.nama_tugas).join(", ");
      const maxRisk = Math.max(...highRiskTasks.map((t) => t.risk_percentage ?? 0));
      title = `🔥 ${highRiskTasks.length} tugas berisiko tinggi telat!`;
      body = highRiskTasks.length === 1
        ? `"${highRiskTasks[0].nama_tugas}" — risiko ${highRiskTasks[0].risk_percentage}% telat`
        : `"${taskNames}" — risiko maks ${maxRisk}%`;
    } else if (urgentTasks.length > 0) {
      const taskNames = urgentTasks.slice(0, 3).map((t) => t.nama_tugas).join(", ");
      title = `⚠️ ${urgentTasks.length} tugas mendekati deadline!`;
      body = urgentTasks.length === 1
        ? `"${urgentTasks[0].nama_tugas}" deadline ${formatDeadline(urgentTasks[0].deadline)}`
        : `"${taskNames}" dan ${urgentTasks.length - 1} lainnya`;
    } else if (upcomingTasks.length > 0) {
      title = `📋 ${upcomingTasks.length} tugas minggu ini`;
      body = upcomingTasks.slice(0, 2).map((t) => t.nama_tugas).join(", ");
    }

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({
            title,
            body,
            tag: "cron-deadline",
            data: { url: "/dashboard" },
          }),
        );
        sentCount++;
      } catch (err) {
        const status = (err as { statusCode?: number })?.statusCode;
        debug.users.push({ endpoint: sub.endpoint.slice(0, 40), sendError: status ?? String(err) });
        if (status === 404 || status === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
      }
    }
  }

  return NextResponse.json({ success: true, sent: sentCount, debug });
}

function formatDeadline(deadline: string) {
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return deadline;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}