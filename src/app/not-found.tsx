import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-4xl font-bold text-[#1E2761]">404</h1>
        <p className="mt-2 text-lg font-semibold text-slate-700">Halaman Tidak Ditemukan</p>
        <p className="mt-1 text-sm text-slate-500">
          Halaman yang Anda cari tidak tersedia atau sudah dipindahkan.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block w-full rounded-2xl bg-[#1E2761] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#17204f]"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </main>
  );
}
