export const TASK_TYPES = [
  { value: "tugas", label: "Tugas" },
  { value: "ujian", label: "Ujian" },
  { value: "proyek", label: "Proyek" },
  { value: "presentasi", label: "Presentasi" },
] as const;

export type TaskType = (typeof TASK_TYPES)[number]["value"];

export type TaskFormValues = {
  title: string;
  taskType: TaskType | "";
  deadlineDate: string;
  deadlineTime: string;
  estimatedHours: string;
};

export type TaskFormErrors = Partial<Record<keyof TaskFormValues, string>>;

export function validateTaskForm(values: TaskFormValues): TaskFormErrors {
  const errors: TaskFormErrors = {};

  const title = values.title.trim();
  if (!title) {
    errors.title = "Nama tugas wajib diisi.";
  } else if (title.length < 3) {
    errors.title = "Nama tugas minimal 3 karakter.";
  } else if (title.length > 120) {
    errors.title = "Nama tugas maksimal 120 karakter.";
  }

  if (!values.taskType) {
    errors.taskType = "Jenis tugas wajib dipilih.";
  } else if (
    !TASK_TYPES.some((type) => type.value === values.taskType)
  ) {
    errors.taskType = "Jenis tugas tidak valid.";
  }

  if (!values.deadlineDate) {
    errors.deadlineDate = "Tanggal deadline wajib diisi.";
  }

  if (!values.deadlineTime) {
    errors.deadlineTime = "Waktu deadline wajib diisi.";
  }

  if (values.deadlineDate && values.deadlineTime) {
    const deadline = new Date(`${values.deadlineDate}T${values.deadlineTime}`);

    if (Number.isNaN(deadline.getTime())) {
      errors.deadlineDate = "Deadline tidak valid.";
    } else if (deadline.getTime() <= Date.now()) {
      errors.deadlineDate = "Deadline harus di masa depan.";
    }
  }

  const hours = Number(values.estimatedHours);
  if (!values.estimatedHours.trim()) {
    errors.estimatedHours = "Estimasi waktu wajib diisi.";
  } else if (Number.isNaN(hours)) {
    errors.estimatedHours = "Estimasi waktu harus berupa angka.";
  } else if (hours <= 0) {
    errors.estimatedHours = "Estimasi waktu harus lebih dari 0 jam.";
  } else if (hours > 999) {
    errors.estimatedHours = "Estimasi waktu maksimal 999 jam.";
  } else if (!/^\d+(\.\d{1})?$/.test(values.estimatedHours.trim())) {
    errors.estimatedHours = "Gunakan format angka, maksimal 1 desimal.";
  }

  return errors;
}

export function buildDueDateIso(deadlineDate: string, deadlineTime: string) {
  return new Date(`${deadlineDate}T${deadlineTime}`).toISOString();
}

export function getTaskTypeLabel(taskType: TaskType) {
  return TASK_TYPES.find((type) => type.value === taskType)?.label ?? taskType;
}
