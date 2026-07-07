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
          prioritas: { type: "integer" },
          tingkat_kesulitan: { type: "integer" },
          alasan: { type: "string" },
        },
        required: ["id", "prioritas", "tingkat_kesulitan", "alasan"],
      },
    },
  },
  required: ["tasks"],
};

function buildPrioritizePrompt(tasks: TaskForPrioritization[]) {
  const taskPayload = JSON.stringify(tasks, null, 2);

  return `Anda adalah asisten produktivitas TaskFlow AI. Analisis daftar tugas berikut dan tentukan urutan prioritas pengerjaan.

Kriteria analisis:
1. Deadline — tugas dengan deadline lebih dekat mendapat prioritas lebih tinggi.
2. Jenis tugas — ujian dan presentasi biasanya lebih mendesak daripada tugas biasa.
3. Estimasi waktu — pertimbangkan beban kerja vs waktu tersisa sebelum deadline.
4. Tingkat kesulitan — skor 1 (mudah) sampai 10 (sangat sulit) berdasarkan jenis, estimasi jam, dan urgensi.

Aturan output:
- "prioritas" adalah peringkat urutan (1 = paling prioritas, semakin besar semakin rendah).
- Setiap tugas pada input HARUS muncul tepat sekali di output.
- "tingkat_kesulitan" harus antara 1 dan 10.
- "alasan" singkat dalam Bahasa Indonesia (maksimal 1 kalimat).
- Jangan menambah atau mengubah id tugas.

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

    if (!Number.isInteger(item.prioritas) || item.prioritas < 1) {
      throw new Error(`Invalid prioritas for task ${item.id}.`);
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
      prioritas: item.prioritas,
      tingkat_kesulitan: item.tingkat_kesulitan,
      alasan: item.alasan.trim(),
    });
  }

  return validated.sort((a, b) => a.prioritas - b.prioritas);
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
