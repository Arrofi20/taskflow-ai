import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f8f9fe] via-[#f0f4ff] to-[#fef9f0] p-4">
      <div className="card-vibrant w-full max-w-sm rounded-3xl p-6 text-center">
        <h1 className="text-4xl font-bold text-[#1E2761]">404</h1>
        <p className="mt-2 text-lg font-semibold text-slate-700">Halaman Tidak Ditemukan</p>
        <p className="mt-1 text-sm text-slate-500">
          Halaman yang Anda cari tidak tersedia atau sudah dipindahkan.
        </p>
        <Link
          href="/dashboard"
          className="gradient-bright-primary mt-4 inline-block w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </main>
  );
}
