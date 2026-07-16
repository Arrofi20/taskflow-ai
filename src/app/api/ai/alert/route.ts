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

function buildPrompt(
  userName: string,
  tasks: Array<Record<string, unknown>>,
  completedHistory: Array<{ jenis_tugas: string; actual_hours: number | null; estimasi_waktu: number | null }>,
) {
  return `Anda adalah asisten TaskFlow AI. Lakukan dua hal:
1. Prediksi probabilitas keterlambatan (0-100%) untuk setiap tugas aktif berdasarkan sisa waktu, estimasi pengerjaan, dan histori penyelesaian tugas serupa.
2. Buat 1-3 pesan peringatan proaktif jika ada tugas dengan risiko > 70%.

Nama user: ${userName}

Tugas aktif:
${JSON.stringify(tasks, null, 2)}

Histori penyelesaian tugas serupa (completed):
${JSON.stringify(completedHistory, null, 2)}

Instruksi:
1. Hitung "risk_percentage" per tugas dengan simulasi variabel:
   - Sisa hari = (deadline - hari ini).
   - Buffer ratio = estimasi_waktu / sisa_hari. Jika > 3 jam/hari, risiko naik.
   - Histori serupa: jika jenis_tugas yang sama di histori memiliki actual_hours > estimasi_waktu, risiko naik 15-25%.
   - Deadline < 24 jam: risiko minimal 50%.
   - Deadline lewat: risiko 100%.
2. Kembalikan JSON dengan format:
{
  "riskPredictions": [
    {"task_id":"...","risk_percentage":78,"reason":"..."}
  ],
  "alerts": [
    {"title":"...","message":"...","severity":"low|medium|high"}
  ]
}
3. Jika tidak ada tugas berisiko, alerts bisa kosong array.
4. Jangan buat alert kosong.`;
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

    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id,nama_tugas,jenis_tugas,deadline,estimasi_waktu,status")
      .eq("user_id", user.id)
      .neq("status", "completed")
      .order("deadline", { ascending: true });

    if (tasksError) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch tasks for alert generation." },
        { status: 500 },
      );
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ success: true, alerts: [], riskPredictions: [] });
    }

    // Ambil histori tugas selesai untuk prediksi
    const { data: history } = await supabase
      .from("tasks")
      .select("jenis_tugas,actual_hours,estimasi_waktu")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .not("actual_hours", "is", null)
      .limit(20);

    const normalizedTasks = tasks.map((task) => ({
      id: task.id,
      title: task.nama_tugas,
      jenis_tugas: task.jenis_tugas,
      deadline: task.deadline,
      estimasi_waktu: task.estimasi_waktu,
      status: task.status,
      deadlineLabel: formatDeadlineLabel(task.deadline),
      hoursRemaining: task.deadline
        ? Math.max(0, Math.round((new Date(task.deadline).getTime() - new Date(nowIso).getTime()) / (1000 * 60 * 60)))
        : null,
    }));

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY ?? "",
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: buildPrompt(user.user_metadata?.full_name ?? user.email ?? "Pengguna", normalizedTasks, history ?? []) }] }],
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

    let parsed: {
      riskPredictions?: Array<Record<string, unknown>>;
      alerts?: Array<Record<string, unknown>>;
    };
    try {
      parsed = JSON.parse(content) as typeof parsed;
    } catch {
      return NextResponse.json(
        { success: false, error: "Gemini returned invalid JSON." },
        { status: 502 },
      );
    }

    const riskPredictions = (parsed.riskPredictions ?? []).filter(
      (rp): rp is { task_id: string; risk_percentage: number } =>
        typeof rp.task_id === "string" && typeof rp.risk_percentage === "number",
    );

    // Update risk_percentage di DB — lewati jika kolom belum ada (migration 007)
    if (riskPredictions.length > 0) {
      try {
        await Promise.all(
          riskPredictions.map((rp) =>
            supabase
              .from("tasks")
              .update({ risk_percentage: Number(rp.risk_percentage) })
              .eq("id", String(rp.task_id))
              .eq("user_id", user.id),
          ),
        );
      } catch {
        // Kolom risk_percentage mungkin belum ada — skip
      }
    }

    const alerts = (parsed.alerts ?? []).filter(
      (alert) => typeof alert.title === "string" && typeof alert.message === "string",
    );

    if (alerts.length > 0) {
      const insertPayload: Database["public"]["Tables"]["alerts"]["Insert"][] = alerts.map((alert) => ({
        user_id: user.id,
        task_id: riskPredictions[0]?.task_id ?? null,
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
    }

    return NextResponse.json({ success: true, alerts, riskPredictions });
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
