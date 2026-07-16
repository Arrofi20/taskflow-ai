export function getScoreColorClass(score: number | null) {
  if (score == null) return "bg-slate-100 text-slate-600";
  if (score <= 40) return "bg-emerald-500";
  if (score <= 70) return "bg-amber-400";
  return "bg-red-500";
}

export function getScoreLabel(score: number | null) {
  if (score == null) return "Belum Dianalisis";
  if (score <= 40) return "Rendah";
  if (score <= 70) return "Sedang";
  return "Tinggi";
}
