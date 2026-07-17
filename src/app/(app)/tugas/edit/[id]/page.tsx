"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { TaskType } from "@/lib/supabase/database.types";
import { getTaskTypeLabel } from "@/lib/tasks/validation";

const taskTypes: TaskType[] = ["tugas", "ujian", "proyek", "presentasi", "praktikum"];

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [mataKuliah, setMataKuliah] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("tugas");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("23:59");
  const [estimatedHours, setEstimatedHours] = useState("1");

  useEffect(() => {
    async function loadTask() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: fetchError } = await supabase
        .from("tasks")
        .select("nama_tugas,mata_kuliah,jenis_tugas,deadline,estimasi_waktu")
        .eq("id", taskId)
        .eq("user_id", user.id)
        .single();

      if (fetchError || !data) {
        setError("Tugas tidak ditemukan.");
        setLoading(false);
        return;
      }

      setTitle(data.nama_tugas);
      setMataKuliah(data.mata_kuliah ?? "");
      setTaskType((data.jenis_tugas as TaskType) ?? "tugas");

      if (data.deadline) {
        const d = new Date(data.deadline);
        setDeadlineDate(d.toISOString().slice(0, 10));
        setDeadlineTime(
          `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
        );
      }

      if (data.estimasi_waktu != null) {
        setEstimatedHours(String(data.estimasi_waktu));
      }

      setLoading(false);
    }

    loadTask();
  }, [taskId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || title.trim().length < 3) {
      setError("Nama tugas minimal 3 karakter.");
      return;
    }
    if (!deadlineDate) {
      setError("Tanggal deadline wajib diisi.");
      return;
    }
    if (!estimatedHours || parseFloat(estimatedHours) <= 0) {
      setError("Estimasi waktu harus lebih dari 0.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Sesi tidak valid.");
      setSaving(false);
      return;
    }

    const deadline = `${deadlineDate}T${deadlineTime}:00+07:00`;

    const { error: updateError } = await supabase
      .from("tasks")
      .update({
        nama_tugas: title.trim(),
        mata_kuliah: mataKuliah.trim() || null,
        jenis_tugas: taskType,
        deadline,
        estimasi_waktu: parseFloat(estimatedHours),
      })
      .eq("id", taskId)
      .eq("user_id", user.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    fetch("/api/activity/history/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "Tugas diedit",
        category: "task",
        detail: { task_name: title.trim() },
      }),
    }).catch(() => {});

    router.push("/tugas");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6">
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#028090]" />
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-6">
      <Link
        href="/tugas"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#028090] hover:text-[#1E2761]"
      >
        <ArrowLeft size={16} />
        Kembali
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-[#1E2761]">Edit Tugas</h1>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Nama Tugas *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#028090]"
            placeholder="Contoh: UTS Pemrograman Web"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Mata Kuliah
          </label>
          <input
            type="text"
            value={mataKuliah}
            onChange={(e) => setMataKuliah(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#028090]"
            placeholder="Contoh: Pemrograman Web"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Jenis Tugas *
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {taskTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTaskType(type)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                  taskType === type
                    ? "border-[#028090] bg-[#028090]/10 text-[#028090]"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {getTaskTypeLabel(type)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Tanggal Deadline *
            </label>
            <input
              type="date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#028090]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Waktu Deadline *
            </label>
            <input
              type="time"
              value={deadlineTime}
              onChange={(e) => setDeadlineTime(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#028090]"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Estimasi Waktu (jam) *
          </label>
          <input
            type="number"
            min={0.5}
            step={0.5}
            max={999}
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#028090]"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1E2761] px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#028090] disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : null}
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </form>
    </main>
  );
}
