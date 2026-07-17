import { NextResponse } from "next/server";

import type {
  ScheduleApiError,
  ScheduleApiResponse,
  ScheduleGenerationRequest,
} from "@/lib/ai/types";
import { createClient } from "@/lib/supabase/server";
import { getIsPremium } from "@/lib/premium";

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

    const isPremium = await getIsPremium(supabase, user.id);

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

    // Ambil jam produktif historis dari DB
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: activityLogs } = await supabase
      .from("user_activity_logs")
      .select("active_at")
      .eq("user_id", user.id)
      .gte("active_at", oneWeekAgo)
      .order("active_at", { ascending: false });

    const hourCounts = new Map<number, number>();
    (activityLogs ?? []).forEach((log) => {
      const hour = new Date(log.active_at).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
    });
    const productiveHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour);

    // Premium: Fetch additional data for personalized scheduling
    let completionHistory: Array<{ created_at: string; completed_at: string | null; estimasi_waktu: number | null; jenis_tugas: string | null; tingkat_kesulitan: number | null }> = [];
    let taskTypeSuccessRates: Record<string, { total: number; completed: number }> = {};

    if (isPremium) {
      const { data: completedTasks } = await supabase
        .from("tasks")
        .select("created_at,completed_at,estimasi_waktu,jenis_tugas,tingkat_kesulitan")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(30);

      completionHistory = completedTasks ?? [];

      // Calculate success rates per task type
      const { data: allTasks } = await supabase
        .from("tasks")
        .select("jenis_tugas,status")
        .eq("user_id", user.id);

      (allTasks ?? []).forEach((t) => {
        const type = t.jenis_tugas ?? "tugas";
        if (!taskTypeSuccessRates[type]) {
          taskTypeSuccessRates[type] = { total: 0, completed: 0 };
        }
        taskTypeSuccessRates[type].total++;
        if (t.status === "completed") {
          taskTypeSuccessRates[type].completed++;
        }
      });
    }

    let prompt: string;

    if (isPremium) {
      // Premium: Enhanced personalized prompt
      const completionAnalysis = completionHistory.length > 0
        ? completionHistory.map((t) => {
            const created = new Date(t.created_at);
            const completed = t.completed_at ? new Date(t.completed_at) : null;
            const hoursTaken = completed ? (completed.getTime() - created.getTime()) / (1000 * 60 * 60) : null;
            const dayOfWeek = created.getDay();
            const hourOfDay = completed ? completed.getHours() : created.getHours();
            return {
              jenis: t.jenis_tugas,
              estimasi: t.estimasi_waktu,
              aktual: hoursTaken ? Math.round(hoursTaken * 10) / 10 : null,
              hari: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][dayOfWeek],
              jam_selesai: hourOfDay,
              kesulitan: t.tingkat_kesulitan,
            };
          })
        : [];

      const successRateText = Object.entries(taskTypeSuccessRates)
        .map(([type, data]) => `${type}: ${data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0}% selesai (${data.completed}/${data.total})`)
        .join(", ");

      prompt = `Anda adalah asisten jadwal belajar TaskFlow AI PREMIUM. Susun jadwal belajar SANGAT PERSONAL berdasarkan pola belajar historis pengguna.

Tugas yang perlu dijadwalkan:
${JSON.stringify(tasks, null, 2)}

Slot waktu kosong pengguna:
${JSON.stringify(freeSlots, null, 2)}

Jam produktif historis (paling sering aktif): ${productiveHours.length > 0 ? `${productiveHours.join(", ")}:00` : "belum ada data"}

ANALISIS POLA BELAJAR PENGGUNA (data historis):
- Riwayat penyelesaian tugas: ${completionAnalysis.length > 0 ? JSON.stringify(completionAnalysis, null, 2) : "Belum ada data penyelesaian"}
- Tingkat keberhasilan per jenis tugas: ${successRateText || "Belum ada data"}

ATURAN PERSONAL PREMIUM:
1. Setiap tugas HARUS dijadwalkan SEBELUM deadline-nya.
2. Total durasi jadwal untuk setiap tugas harus sesuai estimasi waktu.
3. Analisis pola penyelesaian historis pengguna:
   - Jika pengguna biasanya selesai tugas lebih cepat dari estimasi, jadwalkan lebih efisien.
   - Jika pengguna biasanya mepet deadline, tambahkan buffer waktu.
4. Tempatkan tugas berdasarkan "jam energi" pengguna:
   - Jam produktif tinggi → tugas sulit (tingkat_kesulitan ≥ 7)
   - Jam produktif sedang → tugas sedang
   - Jam rendah → tugas mudah atau istirahat
5. Sertakan WAKTU ISTIRAHAT antar sesi belajar (minimal 10 menit per 2 jam belajar).
6. Analisis jenis tugas yang berhasil diselesaikan → prioritaskan pola yang berhasil.
7. Rekomendasikan strategi belajar spesifik berdasarkan data historis.
8. Output JSON dengan property "schedules" yang berisi array objek:
   {"taskId":"...","title":"...","scheduled_date":"YYYY-MM-DD","start_time":"HH:mm","end_time":"HH:mm","rekomendasi_ai":"...","durasi_istirahat":menit,"energi_level":"tinggi/sedang/rendah","tips_fokus":"saran spesifik"}

Analisis belajar pengguna akan ditambahkan di output "analisis_gaya_belajar" dengan struktur:
{"tipe_belajar":"visual/auditori/kinestetik","jam_optimal":["HH:mm"],"pola_belajar":"deskripsi pola"}

Dan "rekomendasi_umum" berisi array saran personal (maksimal 3).`;
    } else {
      // Free: Standard prompt
      prompt = `Anda adalah asisten jadwal belajar TaskFlow AI. Susun jadwal belajar optimal untuk tugas-tugas berikut berdasarkan deadline, estimasi waktu, slot waktu kosong, dan jam produktif pengguna.

Tugas:
${JSON.stringify(tasks, null, 2)}

Slot waktu kosong (jadwal valid):
${JSON.stringify(freeSlots, null, 2)}

Jam produktif historis pengguna (paling sering aktif): ${productiveHours.length > 0 ? productiveHours.join(", ") : "belum ada data"}

Aturan ketat:
1. Setiap tugas HARUS dijadwalkan SEBELUM deadline-nya.
2. Total durasi jadwal untuk setiap tugas harus sesuai estimasi waktu.
3. Prioritaskan tugas dengan ai_score lebih tinggi (0-100, semakin tinggi semakin prioritas).
4. Gunakan slot waktu kosong yang tersedia. Jangan pernah menjadwalkan di luar slot kosong.
5. Jika jam produktif tersedia dan beririsan dengan slot kosong, tempatkan tugas prioritas tinggi di jam-jam tersebut.
6. Jadwal belajar HARUS realistis: maksimal jam 22:00. Hari kerja (Senin-Jumat) idealnya 18:00-22:00 jika slot tersedia. Hari libur (Sabtu-Minggu) boleh 08:00-22:00.
7. Untuk setiap jadwal, sertakan "rekomendasi_ai" berupa 1 kalimat singkat (dalam Bahasa Indonesia) yang menjelaskan mengapa tugas dijadwalkan di waktu tersebut (contoh: "Dijadwalkan di jam produktifmu karena tugas ini memiliki prioritas tinggi").
8. Output JSON dengan property "schedules" yang berisi array objek {"taskId":"...","title":"...","scheduled_date":"YYYY-MM-DD","start_time":"HH:mm","end_time":"HH:mm","rekomendasi_ai":"..."}.`;
    }

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

    const parsed = JSON.parse(content) as {
      schedules?: Array<Record<string, unknown>>;
      analisis_gaya_belajar?: { tipe_belajar: string; jam_optimal: string[]; pola_belajar: string };
      rekomendasi_umum?: string[];
    };
    const schedules = parsed.schedules ?? [];
    const analisisGayaBelajar = parsed.analisis_gaya_belajar;
    const rekomendasiUmum = parsed.rekomendasi_umum;

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return NextResponse.json<ScheduleApiError>(
        { success: false, error: "Gemini returned no schedule items." },
        { status: 502 },
      );
    }

    // Hapus jadwal lama untuk tugas yang dijadwalkan ulang agar tidak duplikat
    const taskIds = tasks.map((t) => t.id);
    await supabase.from("schedules").delete().eq("user_id", user.id).in("task_id", taskIds);

    const insertPayload = schedules.map((schedule) => {
      const scheduledDate = String(schedule.scheduled_date ?? "");
      const startTime = String(schedule.start_time ?? "");
      const endTime = String(schedule.end_time ?? "");

      return {
        user_id: user.id,
        task_id: String(schedule.taskId ?? ""),
        waktu_mulai: `${scheduledDate}T${startTime}:00+07:00`,
        waktu_selesai: `${scheduledDate}T${endTime}:00+07:00`,
        rekomendasi_ai: typeof schedule.rekomendasi_ai === "string" ? schedule.rekomendasi_ai : null,
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

    // Log activity
    try {
      await supabase.from("activity_history").insert({
        user_id: user.id,
        action: "Jadwal belajar dihasilkan",
        category: "schedule",
        detail: { schedule_count: schedules.length },
      });
    } catch {
      // Silent fail
    }

    return NextResponse.json<ScheduleApiResponse>({
      success: true,
      schedules: schedules.map((schedule) => ({
        taskId: String(schedule.taskId ?? ""),
        title: String(schedule.title ?? ""),
        scheduled_date: String(schedule.scheduled_date ?? ""),
        start_time: String(schedule.start_time ?? ""),
        end_time: String(schedule.end_time ?? ""),
        rekomendasi_ai: typeof schedule.rekomendasi_ai === "string" ? schedule.rekomendasi_ai : undefined,
        durasi_istirahat: typeof schedule.durasi_istirahat === "number" ? schedule.durasi_istirahat : undefined,
        energi_level: typeof schedule.energi_level === "string" ? schedule.energi_level as "tinggi" | "sedang" | "rendah" : undefined,
        tips_fokus: typeof schedule.tips_fokus === "string" ? schedule.tips_fokus : undefined,
      })),
      ...(isPremium && analisisGayaBelajar && { analisis_gaya_belajar: analisisGayaBelajar }),
      ...(isPremium && rekomendasiUmum && { rekomendasi_umum: rekomendasiUmum }),
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
