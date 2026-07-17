import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatIcsDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const isPremium = user.user_metadata?.is_premium === true
      || user.user_metadata?.plan === "premium"
      || user.user_metadata?.subscription === "premium";

    if (!isPremium) {
      return NextResponse.json({ success: false, error: "Fitur ini hanya untuk pengguna Premium." }, { status: 403 });
    }

    const [tasksRes, schedulesRes] = await Promise.all([
      supabase
        .from("tasks")
        .select("id, nama_tugas, jenis_tugas, deadline, status, estimasi_waktu, mata_kuliah")
        .eq("user_id", user.id)
        .neq("status", "completed")
        .gte("deadline", new Date(0).toISOString()),
      supabase
        .from("schedules")
        .select("id, task_id, waktu_mulai, waktu_selesai, rekomendasi_ai, tasks!inner(nama_tugas)")
        .eq("user_id", user.id)
        .gte("waktu_mulai", new Date(0).toISOString()),
    ]);

    const tasks = tasksRes.data ?? [];
    const schedules = schedulesRes.data ?? [];

    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//TaskFlow AI//Kalender//ID",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:TaskFlow AI - Jadwal & Deadline",
      "X-WR-TIMEZONE:Asia/Jakarta",
    ];

    // Deadline tugas sebagai event
    for (const task of tasks) {
      const dueDate = task.deadline ? formatIcsDate(task.deadline) : "";
      if (!dueDate) continue;

      const summary = `[Deadline] ${escapeIcsText(task.nama_tugas)}`;
      const desc = `Tipe: ${task.jenis_tugas}\nEstimasi: ${task.estimasi_waktu ?? "-"} jam\nStatus: ${task.status}${task.mata_kuliah ? `\nMata Kuliah: ${task.mata_kuliah}` : ""}`;

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:task-deadline-${task.id}@taskflow-ai`);
      lines.push(`DTSTART:${dueDate}`);
      lines.push(`DTEND:${dueDate}`);
      lines.push(`SUMMARY:${summary}`);
      lines.push(`DESCRIPTION:${escapeIcsText(desc)}`);
      lines.push("CATEGORIES:DEADLINE");
      lines.push("TRANSP:OPAQUE");
      lines.push("END:VEVENT");
    }

    // Jadwal belajar sebagai event
    for (const sched of schedules) {
      const nested = (sched as Record<string, unknown>).tasks as Record<string, unknown> | undefined;
      const taskTitle = typeof nested?.nama_tugas === "string" ? nested.nama_tugas : "Belajar";
      const summary = `[Jadwal] ${escapeIcsText(taskTitle)}`;
      const startIcs = sched.waktu_mulai ? formatIcsDate(sched.waktu_mulai) : "";
      const endIcs = sched.waktu_selesai ? formatIcsDate(sched.waktu_selesai) : "";
      if (!startIcs || !endIcs) continue;

      const desc = sched.rekomendasi_ai
        ? `Rekomendasi AI: ${escapeIcsText(sched.rekomendasi_ai)}`
        : "Jadwal belajar TaskFlow AI";

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:schedule-${sched.id}@taskflow-ai`);
      lines.push(`DTSTART:${startIcs}`);
      lines.push(`DTEND:${endIcs}`);
      lines.push(`SUMMARY:${summary}`);
      lines.push(`DESCRIPTION:${escapeIcsText(desc)}`);
      lines.push("CATEGORIES:SCHEDULE");
      lines.push("TRANSP:OPAQUE");
      lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");

    const icsContent = lines.join("\r\n");

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="taskflow-ai-kalender.ics"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
