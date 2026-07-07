"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { addDays, format, parseISO } from "date-fns";
import { Sparkles } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type AIGenerateButtonProps = {
  selectedDate: string;
};

type TaskItem = {
  id: string;
  title: string;
  deadline: string | null;
  estimated_hours: number | null;
  task_type: string | null;
  prioritas: number | null;
};

function buildFreeSlots(selectedDate: string, tasks: TaskItem[]) {
  // Cari deadline terjauh dari tugas aktif untuk menentukan rentang slot
  let maxDays = 7;

  if (tasks.length > 0) {
    const now = parseISO(selectedDate).getTime();
    const deadlines = tasks
      .filter((t) => t.deadline)
      .map((t) => new Date(t.deadline!).getTime())
      .filter((ts) => !Number.isNaN(ts));

    if (deadlines.length > 0) {
      const farthest = Math.max(...deadlines);
      const diffDays = Math.ceil((farthest - now) / (1000 * 60 * 60 * 24)) + 1;
      maxDays = Math.max(1, Math.min(diffDays, 14)); // minimal 1 hari, maksimal 14 hari
    }
  }

  const slots = [];

  for (let i = 0; i < maxDays; i++) {
    const date = addDays(parseISO(selectedDate), i);
    const day = format(date, "yyyy-MM-dd");

    // Tentukan hari libur dengan asumsi WIB (jam 12 siang)
    const middayWib = new Date(`${day}T12:00:00+07:00`);
    const dayOfWeek = middayWib.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    slots.push({
      day,
      start: isWeekend ? "08:00" : "18:00",
      end: "22:00",
    });
  }

  return slots;
}

export function AIGenerateButton({ selectedDate }: AIGenerateButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Sesi tidak valid. Silakan masuk kembali.");
        return;
      }

      // Ambil tugas aktif agar slot waktu dan jadwal benar-benar sinkron dengan input user
      const { data: dbTasks, error: tasksError } = await supabase
        .from("tasks")
        .select(
          "id,nama_tugas,jenis_tugas,deadline,estimasi_waktu,prioritas,tingkat_kesulitan,status",
        )
        .eq("user_id", user.id)
        .neq("status", "completed")
        .order("created_at", { ascending: true });

      if (tasksError) {
        setError("Gagal memuat tugas untuk generate jadwal.");
        return;
      }

      const tasks: TaskItem[] = (dbTasks ?? []).map((task) => ({
        id: task.id,
        title: task.nama_tugas,
        deadline: task.deadline,
        estimated_hours: task.estimasi_waktu,
        task_type: task.jenis_tugas,
        prioritas: task.prioritas,
      }));

      if (tasks.length === 0) {
        setError("Tidak ada tugas aktif untuk dijadwalkan.");
        return;
      }

      const freeSlots = buildFreeSlots(selectedDate, tasks);

      const response = await fetch("/api/ai/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks,
          freeSlots,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error ?? "Gagal generate jadwal AI.");
        return;
      }

      router.refresh();
    } catch {
      setError("Terjadi kesalahan saat generate jadwal AI.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isLoading}
        className="inline-flex items-center gap-2 rounded-xl border border-[#028090]/20 bg-[#028090]/10 px-3 py-2 text-sm font-semibold text-[#028090] transition hover:bg-[#028090]/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Sparkles className="h-4 w-4" />
        {isLoading ? "Menggenerate..." : "Regenerasi AI"}
      </button>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
