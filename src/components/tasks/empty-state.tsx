import { ClipboardList } from "lucide-react";

export function EmptyTasksState() {
  return (
    <div className="card-vibrant flex flex-col items-center justify-center rounded-3xl px-6 py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#1E2761]/10 to-[#028090]/10">
        <ClipboardList className="h-8 w-8 text-[#1E2761]" />
      </div>
      <p className="text-base font-semibold text-slate-800">
        Belum ada tugas
      </p>
      <p className="mt-1 max-w-xs text-sm text-slate-500">
        Tambahkan tugas pertama kamu dan biarkan AI mengatur prioritas serta jadwal belajar.
      </p>
    </div>
  );
}
