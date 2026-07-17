"use client";

import { ArrowLeft, Crown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import {
  buildDueDateIso,
  TASK_TYPES,
  type TaskFormErrors,
  type TaskFormValues,
  type TaskType,
  validateTaskForm,
} from "@/lib/tasks/validation";

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-[#028090] focus:ring-2 focus:ring-[#028090]/20";

const labelClassName = "mb-1.5 block text-sm font-medium text-slate-700";

export function AddTaskForm() {
  const router = useRouter();
  const [values, setValues] = useState<TaskFormValues>({
    title: "",
    mataKuliah: "",
    taskType: "",
    deadlineDate: "",
    deadlineTime: "",
    estimatedHours: "",
  });
  const [fieldErrors, setFieldErrors] = useState<TaskFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [taskLimit, setTaskLimit] = useState<{
    current: number;
    limit: number;
    blocked: boolean;
  } | null>(null);

  useEffect(() => {
    async function checkLimit() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("users")
        .select("is_premium")
        .eq("id", user.id)
        .single();

      let isPremium = false;
      if (profile?.is_premium != null) {
        isPremium = profile.is_premium;
      } else {
        const meta = user.user_metadata;
        if (meta && typeof meta.is_premium === "boolean")
          isPremium = meta.is_premium;
        else if (meta && typeof meta.plan === "string")
          isPremium = meta.plan.toLowerCase() === "premium";
        else if (meta && typeof meta.subscription === "string")
          isPremium = meta.subscription.toLowerCase() === "premium";
      }

      if (isPremium) return;

      const { count } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .neq("status", "completed");

      const current = count ?? 0;
      setTaskLimit({ current, limit: 5, blocked: current >= 5 });
    }

    checkLimit();
  }, []);

  function updateField<K extends keyof TaskFormValues>(
    field: K,
    value: TaskFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (taskLimit?.blocked) {
      setFormError(
        "Anda sudah mencapai batas 5 tugas aktif. Upgrade ke Premium untuk unlimited tugas.",
      );
      return;
    }

    const errors = validateTaskForm(values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setFormError("Sesi login tidak valid. Silakan masuk kembali.");
        return;
      }

      const { error } = await supabase.from("tasks").insert({
        user_id: user.id,
        nama_tugas: values.title.trim(),
        mata_kuliah: values.mataKuliah.trim() || null,
        jenis_tugas: values.taskType || "tugas",
        deadline: buildDueDateIso(values.deadlineDate, values.deadlineTime),
        estimasi_waktu: Number(values.estimatedHours),
        status: "pending",
        created_at: new Date().toISOString(),
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      // Log activity
      fetch("/api/activity/history/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "Tugas dibuat",
          category: "task",
          detail: { task_name: values.title.trim(), jenis: values.taskType || "tugas" },
        }),
      }).catch(() => {});

      router.push("/tugas");
      router.refresh();
    } catch {
      setFormError("Terjadi kesalahan saat menyimpan tugas. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
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
          <h1 className="text-2xl font-bold text-[#1E2761]">Tambah Tugas</h1>
          <p className="mt-1 text-sm text-slate-600">
            Isi detail tugas untuk melacak deadline dan estimasi waktu.
          </p>
        </div>

        {taskLimit?.blocked && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <div className="flex items-center gap-2 font-semibold">
              <Crown size={16} />
              Batas tugas aktif tercapai
            </div>
            <p className="mt-1">
              Anda sudah memiliki {taskLimit.current} tugas aktif (maksimal{" "}
              {taskLimit.limit}).
            </p>
            <Link
              href="/profil/subscription"
              className="mt-2 inline-block rounded-lg bg-[#1E2761] px-3 py-1.5 text-xs font-semibold text-white"
            >
              Upgrade ke Premium
            </Link>
          </div>
        )}

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
              className={inputClassName}
              placeholder="Contoh: Essay Sejarah Indonesia"
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
              placeholder="Contoh: Sejarah Indonesia"
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
            disabled={isLoading || taskLimit?.blocked}
            className="w-full rounded-xl bg-[#1E2761] px-4 py-3.5 text-base font-semibold text-white transition hover:bg-[#028090] focus:outline-none focus:ring-2 focus:ring-[#028090]/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Menyimpan..." : "Simpan Tugas"}
          </button>
        </form>
      </div>
    </div>
  );
}
