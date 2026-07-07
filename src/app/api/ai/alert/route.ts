import { NextResponse } from "next/server";

import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

function formatDeadlineLabel(deadline: string) {
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) {
    return deadline;
  }

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildPrompt(userName: string, tasks: Array<Record<string, unknown>>) {
  return `Anda adalah asisten TaskFlow AI. Buatkan 1-3 pesan peringatan personal untuk user berikut berdasarkan tugas yang hampir deadline atau sudah lewat deadline.

Nama user: ${userName}

Tugas:
${JSON.stringify(tasks, null, 2)}

Instruksi:
1. Fokus pada tugas yang belum selesai dan memiliki deadline kurang dari 24 jam atau sudah lewat deadline.
2. Tulis pesan yang suportif, singkat, dan personal.
3. Kembalikan JSON dengan format:
{"alerts":[{"title":"...","message":"...","severity":"low|medium|high"}]}
4. Jangan buat alert kosong. Jika tidak ada tugas yang relevan, kembalikan {"alerts": []}.`;
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id,nama_tugas,deadline,status")
      .eq("user_id", user.id)
      .neq("status", "completed")
      .order("deadline", { ascending: true });

    if (tasksError) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch tasks for alert generation." },
        { status: 500 },
      );
    }

    const relevantTasks = (tasks ?? []).filter((task) => {
      const deadline = task.deadline;
      if (!deadline) {
        return false;
      }

      const deadlineDate = new Date(deadline);
      if (Number.isNaN(deadlineDate.getTime())) {
        return false;
      }

      const isNearDeadline = deadlineDate.getTime() >= new Date(nowIso).getTime() && deadlineDate.getTime() <= new Date(next24h).getTime();
      const isOverdue = deadlineDate.getTime() < new Date(nowIso).getTime();
      return isNearDeadline || isOverdue;
    });

    if (relevantTasks.length === 0) {
      return NextResponse.json({ success: true, alerts: [] });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY ?? "",
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: buildPrompt(user.user_metadata?.full_name ?? user.email ?? "Pengguna", relevantTasks.map((task) => ({
            id: task.id,
            title: task.nama_tugas,
            deadline: task.deadline,
            status: task.status,
            deadlineLabel: formatDeadlineLabel(task.deadline),
          }))) }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
      },
    );

    const payload = await response.json();
    const content = payload?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!response.ok || !content) {
      return NextResponse.json(
        { success: false, error: payload?.error?.message ?? "Failed to generate alerts." },
        { status: 502 },
      );
    }

    let parsed: { alerts?: Array<Record<string, unknown>> };
    try {
      parsed = JSON.parse(content) as { alerts?: Array<Record<string, unknown>> };
    } catch {
      return NextResponse.json(
        { success: false, error: "Gemini returned invalid JSON." },
        { status: 502 },
      );
    }

    const alerts = (parsed.alerts ?? []).filter((alert) =>
      typeof alert.title === "string" && typeof alert.message === "string",
    );

    if (alerts.length === 0) {
      return NextResponse.json({ success: true, alerts: [] });
    }

    const insertPayload: Database["public"]["Tables"]["alerts"]["Insert"][] = alerts.map((alert) => ({
      user_id: user.id,
      task_id: relevantTasks[0]?.id ?? null,
      title: String(alert.title ?? "Peringatan"),
      message: String(alert.message ?? ""),
      severity: String(alert.severity ?? "medium"),
      status: "active",
    }));

    const { error: insertError } = await supabase.from("alerts").insert(insertPayload);

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, alerts });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error during alert generation.",
      },
      { status: 500 },
    );
  }
}
