"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import {
  TASK_TYPES,
  type TaskFormErrors,
  type TaskFormValues,
  type TaskType,
  validateTaskForm,
} from "@/lib/tasks/validation";

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-[#028090] focus:ring-2 focus:ring-[#028090]/20";

const labelClassName = "mb-1.5 block text-sm font-medium text-slate-700";

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<TaskFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [values, setValues] = useState<TaskFormValues>({
    title: "",
    mataKuliah: "",
    taskType: "",
    deadlineDate: "",
    deadlineTime: "",
    estimatedHours: "",
  });

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
        setFormError("Tugas tidak ditemukan.");
        setLoading(false);
        return;
      }

      let deadlineDate = "";
      let deadlineTime = "";
      if (data.deadline) {
        const d = new Date(data.deadline);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        deadlineDate = `${year}-${month}-${day}`;
        deadlineTime = `${hours}:${minutes}`;
      }

      setValues({
        title: data.nama_tugas,
        mataKuliah: data.mata_kuliah ?? "",
        taskType: (data.jenis_tugas as TaskType) ?? "tugas",
        deadlineDate,
        deadlineTime,
        estimatedHours: data.estimasi_waktu != null ? String(data.estimasi_waktu) : "",
      });

      setLoading(false);
    }

    loadTask();
  }, [taskId]);

  function updateField<K extends keyof TaskFormValues>(
    field: K,
    value: TaskFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const errors = validateTaskForm(values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setFormError("Sesi tidak valid.");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("tasks")
      .update({
        nama_tugas: values.title.trim(),
        mata_kuliah: values.mataKuliah.trim() || null,
        jenis_tugas: values.taskType || "tugas",
        deadline: `${values.deadlineDate}T${values.deadlineTime}:00+07:00`,
        estimasi_waktu: Math.round(Number(values.estimatedHours)),
      })
      .eq("id", taskId)
      .eq("user_id", user.id);

    if (updateError) {
      setFormError(updateError.message);
      setSaving(false);
      return;
    }

    fetch("/api/activity/history/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "Tugas diedit",
        category: "task",
        detail: { task_name: values.title.trim() },
      }),
    }).catch(() => {});

    router.push("/tugas");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#028090]" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <Link
        href="/tugas"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#028090] hover:text-[#1E2761]"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke daftar tugas
      </Link>

      <div className="card-vibrant rounded-2xl p-5">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1E2761]">Edit Tugas</h1>
          <p className="mt-1 text-sm text-slate-600">
            Ubah detail tugas untuk melacak deadline dan estimasi waktu.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {formError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {formError}
            </div>
          )}

          <div>
            <label htmlFor="title" className={labelClassName}>
              Nama Tugas <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={values.title}
              onChange={(event) => updateField("title", event.target.value)}
              maxLength={120}
              className={inputClassName}
              placeholder="Contoh: UTS Pemrograman Web"
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={fieldErrors.title ? "title-error" : undefined}
            />
            {fieldErrors.title && (
              <p id="title-error" className="mt-1.5 text-sm text-red-600">
                {fieldErrors.title}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="mataKuliah" className={labelClassName}>
              Mata Kuliah
            </label>
            <input
              id="mataKuliah"
              name="mataKuliah"
              type="text"
              value={values.mataKuliah}
              onChange={(event) => updateField("mataKuliah", event.target.value)}
              className={inputClassName}
              placeholder="Contoh: Pemrograman Web"
              aria-invalid={Boolean(fieldErrors.mataKuliah)}
              aria-describedby={fieldErrors.mataKuliah ? "mataKuliah-error" : undefined}
            />
            {fieldErrors.mataKuliah && (
              <p id="mataKuliah-error" className="mt-1.5 text-sm text-red-600">
                {fieldErrors.mataKuliah}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="taskType" className={labelClassName}>
              Jenis Tugas <span className="text-red-500">*</span>
            </label>
            <select
              id="taskType"
              name="taskType"
              value={values.taskType}
              onChange={(event) =>
                updateField("taskType", event.target.value as TaskType | "")
              }
              className={inputClassName}
              aria-invalid={Boolean(fieldErrors.taskType)}
              aria-describedby={
                fieldErrors.taskType ? "taskType-error" : undefined
              }
            >
              <option value="">Pilih jenis tugas</option>
              {TASK_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {fieldErrors.taskType && (
              <p id="taskType-error" className="mt-1.5 text-sm text-red-600">
                {fieldErrors.taskType}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="deadlineDate" className={labelClassName}>
                Tanggal Deadline
              </label>
              <input
                id="deadlineDate"
                name="deadlineDate"
                type="date"
                value={values.deadlineDate}
                onChange={(event) =>
                  updateField("deadlineDate", event.target.value)
                }
                className={inputClassName}
                aria-invalid={Boolean(fieldErrors.deadlineDate)}
                aria-describedby={
                  fieldErrors.deadlineDate ? "deadlineDate-error" : undefined
                }
              />
              {fieldErrors.deadlineDate && (
                <p
                  id="deadlineDate-error"
                  className="mt-1.5 text-sm text-red-600"
                >
                  {fieldErrors.deadlineDate}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="deadlineTime" className={labelClassName}>
                Waktu Deadline
              </label>
              <input
                id="deadlineTime"
                name="deadlineTime"
                type="time"
                value={values.deadlineTime}
                onChange={(event) =>
                  updateField("deadlineTime", event.target.value)
                }
                className={inputClassName}
                aria-invalid={Boolean(fieldErrors.deadlineTime)}
                aria-describedby={
                  fieldErrors.deadlineTime ? "deadlineTime-error" : undefined
                }
              />
              {fieldErrors.deadlineTime && (
                <p
                  id="deadlineTime-error"
                  className="mt-1.5 text-sm text-red-600"
                >
                  {fieldErrors.deadlineTime}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="estimatedHours" className={labelClassName}>
              Estimasi Waktu Pengerjaan (jam)
            </label>
            <input
              id="estimatedHours"
              name="estimatedHours"
              type="number"
              inputMode="decimal"
              min="0.5"
              step="0.5"
              value={values.estimatedHours}
              onChange={(event) =>
                updateField("estimatedHours", event.target.value)
              }
              className={inputClassName}
              placeholder="Contoh: 2.5"
              aria-invalid={Boolean(fieldErrors.estimatedHours)}
              aria-describedby={
                fieldErrors.estimatedHours ? "estimatedHours-error" : undefined
              }
            />
            {fieldErrors.estimatedHours && (
              <p
                id="estimatedHours-error"
                className="mt-1.5 text-sm text-red-600"
              >
                {fieldErrors.estimatedHours}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-[#1E2761] px-4 py-3.5 text-base font-semibold text-white transition hover:bg-[#028090] focus:outline-none focus:ring-2 focus:ring-[#028090]/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </form>
      </div>
    </div>
  );
}
