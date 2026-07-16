export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f8f9fe] via-[#f0f4ff] to-[#fef9f0]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#028090] border-t-transparent" />
        <p className="text-sm font-medium text-slate-500">Memuat...</p>
      </div>
    </div>
  );
}
