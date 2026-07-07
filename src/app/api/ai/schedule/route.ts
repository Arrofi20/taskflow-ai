import { NextResponse } from "next/server";

import type {
  ScheduleApiError,
  ScheduleApiResponse,
  ScheduleGenerationRequest,
} from "@/lib/ai/types";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ScheduleApiError>(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as Partial<ScheduleGenerationRequest>;

    let tasks = body?.tasks;

    if (!tasks || tasks.length === 0) {
      const { data: dbTasks, error: tasksError } = await supabase
        .from("tasks")
        .select(
          "id,nama_tugas,jenis_tugas,deadline,estimasi_waktu,prioritas,tingkat_kesulitan,status",
        )
        .eq("user_id", user.id)
        .neq("status", "completed")
        .order("created_at", { ascending: true });

      if (tasksError) {
        return NextResponse.json<ScheduleApiError>(
          { success: false, error: "Failed to fetch tasks for schedule generation." },
          { status: 500 },
        );
      }

      tasks = (dbTasks ?? []).map((task) => ({
        id: task.id,
        title: task.nama_tugas,
        deadline: task.deadline,
        estimated_hours: task.estimasi_waktu,
        task_type: task.jenis_tugas,
        prioritas: task.prioritas,
      }));
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json<ScheduleApiError>(
        { success: false, error: "No active tasks found for schedule generation." },
        { status: 400 },
      );
    }

    const freeSlots = body?.freeSlots ?? [];

    const prompt = `Anda adalah asisten jadwal belajar TaskFlow AI. Susun jadwal belajar optimal untuk tugas-tugas berikut berdasarkan deadline, estimasi waktu, dan slot waktu kosong.

Tugas:
${JSON.stringify(tasks, null, 2)}

Slot waktu kosong:
${JSON.stringify(freeSlots, null, 2)}

Aturan ketat:
1. Setiap tugas HARUS dijadwalkan SEBELUM deadline-nya. Jangan pernah menjadwalkan tugas setelah deadline sudah lewat.
2. Total durasi jadwal untuk setiap tugas harus sesuai dengan estimasi waktu (estimated_hours). Jangan kurangi dan jangan tambahkan terlalu banyak.
3. Prioritaskan tugas dengan deadline lebih dekat dan prioritas lebih tinggi (nilai prioritas lebih kecil = lebih tinggi).
4. Gunakan slot waktu kosong yang tersedia secara efisien dan hindari bentrok antar tugas.
5. Jadwal belajar HARUS realistis: jangan pernah menjadwalkan belajar sebelum jam yang tersedia di slot, dan jangan pernah melewati jam 22:00 (maksimal jam 10 malam). Hari kerja (Senin-Jumat) hanya boleh 18:00-22:00. Hari libur (Sabtu-Minggu) boleh 08:00-22:00. Jangan pernah menjadwalkan belajar di tengah malam.
6. Output JSON dengan property "schedules" yang berisi array objek {"taskId":"...","title":"...","scheduled_date":"YYYY-MM-DD","start_time":"HH:mm","end_time":"HH:mm"}.`;


    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY ?? "",
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
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
      return NextResponse.json<ScheduleApiError>(
        { success: false, error: payload?.error?.message ?? "Failed to generate schedule." },
        { status: 502 },
      );
    }

    const parsed = JSON.parse(content) as { schedules?: Array<Record<string, unknown>> };
    const schedules = parsed.schedules ?? [];

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return NextResponse.json<ScheduleApiError>(
        { success: false, error: "Gemini returned no schedule items." },
        { status: 502 },
      );
    }

    const insertPayload = schedules.map((schedule) => {
      const scheduledDate = String(schedule.scheduled_date ?? "");
      const startTime = String(schedule.start_time ?? "");
      const endTime = String(schedule.end_time ?? "");

      return {
        user_id: user.id,
        task_id: String(schedule.taskId ?? ""),
        waktu_mulai: `${scheduledDate}T${startTime}:00+07:00`,
        waktu_selesai: `${scheduledDate}T${endTime}:00+07:00`,
        rekomendasi_ai: null as string | null,
      };
    });

    const { error: insertError } = await supabase
      .from("schedules")
      .insert(insertPayload);

    if (insertError) {
      return NextResponse.json<ScheduleApiError>(
        { success: false, error: insertError.message },
        { status: 500 },
      );
    }

    return NextResponse.json<ScheduleApiResponse>({
      success: true,
      schedules: schedules.map((schedule) => ({
        taskId: String(schedule.taskId ?? ""),
        title: String(schedule.title ?? ""),
        scheduled_date: String(schedule.scheduled_date ?? ""),
        start_time: String(schedule.start_time ?? ""),
        end_time: String(schedule.end_time ?? ""),
      })),
    });
  } catch (error) {
    return NextResponse.json<ScheduleApiError>(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error during schedule generation.",
      },
      { status: 500 },
    );
  }
}
