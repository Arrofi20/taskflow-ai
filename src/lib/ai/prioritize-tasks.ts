import { generateGeminiJson } from "@/lib/ai/gemini";
import type {
  PrioritizeTasksResponse,
  PrioritizedTaskResult,
  TaskForPrioritization,
} from "@/lib/ai/types";

const PRIORITIZE_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          ai_score: { type: "integer" },
          risk_percentage: { type: "integer" },
          tingkat_kesulitan: { type: "integer" },
          alasan: { type: "string" },
          faktor_analisis: {
            type: "object",
            properties: {
              deadline_weight: { type: "number" },
              jenis_weight: { type: "number" },
              estimasi_weight: { type: "number" },
              histori_weight: { type: "number" },
            },
          },
          rekomendasi_tindakan: { type: "string" },
          strategi_mitigasi: { type: "string" },
          waktu_pengerjaan_optimal: { type: "string" },
        },
        required: ["id", "ai_score", "risk_percentage", "tingkat_kesulitan", "alasan"],
      },
    },
  },
  required: ["tasks"],
};

function buildPrioritizePrompt(tasks: TaskForPrioritization[], isPremium: boolean, taskHistory?: Array<{ jenis_tugas: string; status: string; estimasi_waktu: number | null; completed_at: string | null; created_at: string }>) {
  const taskPayload = JSON.stringify(tasks, null, 2);

  if (isPremium) {
    const historyAnalysis = taskHistory && taskHistory.length > 0
      ? taskHistory.map((t) => ({
          jenis: t.jenis_tugas,
          estimasi: t.estimasi_waktu,
          selesai: t.status === "completed",
          waktu_pengerjaan: t.completed_at && t.created_at
            ? Math.round((new Date(t.completed_at).getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60) * 10) / 10
            : null,
        }))
      : [];

    return `Anda adalah asisten produktivitas TaskFlow AI PREMIUM. Analisis mendalam daftar tugas mahasiswa berikut dengan DETAIL LENGKAP untuk setiap tugas.

Daftar tugas:
${taskPayload}

Data historis penyelesaian tugas pengguna:
${historyAnalysis.length > 0 ? JSON.stringify(historyAnalysis, null, 2) : "Belum ada data historis"}

ANALISIS PREMIUM (wajib untuk setiap tugas):

1. BOBOT ANALISIS (harus dihitung dan disertakan):
   - Deadline Weight (bobot 35%): Hitung proporsi berdasarkan sisa hari. Sisa ≤1 hari = 100%, ≤3 hari = 70%, ≤7 hari = 40%, >7 hari = 20%.
   - Jenis Tugas Weight (bobot 20%): Ujian=100%, Presentasi=85%, Proyek=70%, Praktikum=50%, Tugas=35%.
   - Estimasi vs Sisa Waktu Weight (bobot 25%): Jika estimasi > sisa waktu = 100%. Rasio estimasi/sisa_waktu × 100%.
   - Histori Weight (bobot 20%): Analisis pola penyelesaian. Jika tugas serupa sering terlambat, bobot naik.

2. REKOMENDASI TINDAKAN (per tugas):
   - Berikan 1-2 langkah spesifik yang harus dilakukan SEGERA (contoh: "Kerjakan bagian pendahuluan hari ini", "Kumpulkan bahan referensi sebelum malam ini").

3. STRATEGI MITIGASI (per tugas):
   - Jika risiko > 40%, berikan strategi pengurangan risiko (contoh: "Bagi menjadi 3 sub-tugas", "Minta bantuan teman untuk bagian X", "Gunakan teknik Pomodoro 25 menit").

4. WAKTU PENGERJAAN OPTIMAL (per tugas):
   - Berdasarkan tingkat kesulitan dan jam produktif, rekomendasikan kapan mulai mengerjakan (contoh: "Mulai pengerjaan hari Rabu jam 18:00 saat energi tinggi").

Aturan output:
- "ai_score" = 0-100 (prioritas dinamis).
- "risk_percentage" = 0-100% (probabilitas keterlambatan).
- "tingkat_kesulitan" = 1-10.
- "faktor_analisis" = objek dengan deadline_weight, jenis_weight, estimasi_weight, histori_weight (semua number 0-100).
- "rekomendasi_tindakan" = 1-2 langkah spesifik dalam Bahasa Indonesia.
- "strategi_mitigasi" = strategi konkret jika risiko > 40%, atau null jika risiko ≤ 40%.
- "waktu_pengerjaan_optimal" = rekomendasi waktu mulai spesifik (hari + jam).
- Setiap tugas HARUS muncul tepat sekali. Jangan ubah id.

Daftar tugas (JSON):
${taskPayload}`;
  }

  // Free: Standard prompt
  return `Anda adalah asisten produktivitas TaskFlow AI. Analisis daftar tugas mahasiswa berikut dan tentukan skor prioritas dinamis, tingkat kesulitan, dan probabilitas risiko keterlambatan.

Kriteria analisis (simulasi model AI melalui prompt engineering):
1. Deadline (bobot 35%) — sisa hari hingga deadline. Semakin dekat, skor prioritas dan risiko naik.
2. Jenis tugas (bobot 20%) — urutan urgensi bawaan: Ujian > Presentasi > Proyek > Praktikum > Tugas.
3. Estimasi waktu vs sisa waktu (bobot 25%) — jika estimasi pengerjaan mendekati atau melebihi sisa waktu sebelum deadline, skor prioritas dan risiko naik drastis.
4. Histori keterlambatan implisit (bobot 20%) — anggap tugas dengan jenis serupa dan deadline singkat historis sering terlambat. Tugas pertama kali dengan deadline < 2 hari anggap risiko tinggi.

Aturan output:
- "ai_score" adalah skor prioritas dinamis 0-100 (0 = rendah, 100 = sangat tinggi).
- "risk_percentage" adalah probabilitas keterlambatan 0-100%.
- "tingkat_kesulitan" adalah skor kesulitan 1-10.
- Setiap tugas pada input HARUS muncul tepat sekali di output.
- Jangan menambah atau mengubah id tugas.
- "alasan" singkat dalam Bahasa Indonesia (maksimal 1 kalimat).

Daftar tugas (JSON):
${taskPayload}`;
}

function validatePrioritizeResponse(
  response: PrioritizeTasksResponse,
  inputTaskIds: Set<string>,
  isPremium: boolean,
): PrioritizedTaskResult[] {
  if (!Array.isArray(response.tasks) || response.tasks.length === 0) {
    throw new Error("Gemini returned an invalid task list.");
  }

  if (response.tasks.length !== inputTaskIds.size) {
    throw new Error("Gemini response does not include all tasks.");
  }

  const seenIds = new Set<string>();
  const validated: PrioritizedTaskResult[] = [];

  for (const item of response.tasks) {
    if (!inputTaskIds.has(item.id)) {
      throw new Error(`Unknown task id in Gemini response: ${item.id}`);
    }

    if (seenIds.has(item.id)) {
      throw new Error(`Duplicate task id in Gemini response: ${item.id}`);
    }

    if (!Number.isInteger(item.ai_score) || item.ai_score < 0 || item.ai_score > 100) {
      throw new Error(`Invalid ai_score for task ${item.id}.`);
    }

    if (!Number.isInteger(item.risk_percentage) || item.risk_percentage < 0 || item.risk_percentage > 100) {
      throw new Error(`Invalid risk_percentage for task ${item.id}.`);
    }

    if (
      !Number.isInteger(item.tingkat_kesulitan) ||
      item.tingkat_kesulitan < 1 ||
      item.tingkat_kesulitan > 10
    ) {
      throw new Error(`Invalid tingkat_kesulitan for task ${item.id}.`);
    }

    seenIds.add(item.id);

    const result: PrioritizedTaskResult = {
      id: item.id,
      ai_score: item.ai_score,
      risk_percentage: item.risk_percentage,
      tingkat_kesulitan: item.tingkat_kesulitan,
      alasan: item.alasan.trim(),
    };

    if (isPremium) {
      if (item.faktor_analisis && typeof item.faktor_analisis === "object") {
        result.faktor_analisis = {
          deadline_weight: Number((item.faktor_analisis as Record<string, unknown>).deadline_weight ?? 0),
          jenis_weight: Number((item.faktor_analisis as Record<string, unknown>).jenis_weight ?? 0),
          estimasi_weight: Number((item.faktor_analisis as Record<string, unknown>).estimasi_weight ?? 0),
          histori_weight: Number((item.faktor_analisis as Record<string, unknown>).histori_weight ?? 0),
        };
      }
      if (typeof item.rekomendasi_tindakan === "string") {
        result.rekomendasi_tindakan = item.rekomendasi_tindakan;
      }
      if (typeof item.strategi_mitigasi === "string") {
        result.strategi_mitigasi = item.strategi_mitigasi;
      }
      if (typeof item.waktu_pengerjaan_optimal === "string") {
        result.waktu_pengerjaan_optimal = item.waktu_pengerjaan_optimal;
      }
    }

    validated.push(result);
  }

  return validated;
}

export async function analyzeTaskPriorities(
  tasks: TaskForPrioritization[],
  isPremium: boolean = false,
  taskHistory?: Array<{ jenis_tugas: string; status: string; estimasi_waktu: number | null; completed_at: string | null; created_at: string }>,
) {
  if (tasks.length === 0) {
    throw new Error("No tasks available for prioritization.");
  }

  const inputTaskIds = new Set(tasks.map((task) => task.id));
  const prompt = buildPrioritizePrompt(tasks, isPremium, taskHistory);

  const response = await generateGeminiJson<PrioritizeTasksResponse>(
    prompt,
    PRIORITIZE_RESPONSE_SCHEMA,
  );

  return validatePrioritizeResponse(response, inputTaskIds, isPremium);
}
