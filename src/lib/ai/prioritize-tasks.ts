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
        },
        required: ["id", "ai_score", "risk_percentage", "tingkat_kesulitan", "alasan"],
      },
    },
  },
  required: ["tasks"],
};

function buildPrioritizePrompt(tasks: TaskForPrioritization[]) {
  const taskPayload = JSON.stringify(tasks, null, 2);

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
    validated.push({
      id: item.id,
      ai_score: item.ai_score,
      risk_percentage: item.risk_percentage,
      tingkat_kesulitan: item.tingkat_kesulitan,
      alasan: item.alasan.trim(),
    });
  }

  return validated;
}

export async function analyzeTaskPriorities(tasks: TaskForPrioritization[]) {
  if (tasks.length === 0) {
    throw new Error("No tasks available for prioritization.");
  }

  const inputTaskIds = new Set(tasks.map((task) => task.id));
  const prompt = buildPrioritizePrompt(tasks);

  const response = await generateGeminiJson<PrioritizeTasksResponse>(
    prompt,
    PRIORITIZE_RESPONSE_SCHEMA,
  );

  return validatePrioritizeResponse(response, inputTaskIds);
}
