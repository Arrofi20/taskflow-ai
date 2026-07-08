export type PriorityBadge = {
  label: "Tinggi" | "Sedang" | "Rendah" | "Belum Dikategorikan AI";
  className: string;
};

export function getPriorityBadge(
  prioritas: number | null,
  totalTasks: number,
): PriorityBadge {
  if (prioritas == null || totalTasks === 0) {
    return {
      label: "Belum Dikategorikan AI",
      className: "bg-slate-100 text-slate-600",
    };
  }

  if (totalTasks === 1 || prioritas === 1) {
    return {
      label: "Tinggi",
      className: "bg-red-100 text-red-700",
    };
  }

  if (prioritas === totalTasks) {
    return {
      label: "Rendah",
      className: "bg-emerald-100 text-emerald-700",
    };
  }

  const tier = prioritas / totalTasks;

  if (tier <= 0.33) {
    return {
      label: "Tinggi",
      className: "bg-red-100 text-red-700",
    };
  }

  if (tier <= 0.66) {
    return {
      label: "Sedang",
      className: "bg-amber-100 text-amber-700",
    };
  }

  return {
    label: "Rendah",
    className: "bg-emerald-100 text-emerald-700",
  };
}
