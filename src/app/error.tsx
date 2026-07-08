"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="id">
      <body className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-xl font-bold text-[#1E2761]">Terjadi Kesalahan</h2>
          <p className="mt-2 text-sm text-slate-500">
            Maaf, aplikasi mengalami masalah. Silakan coba lagi.
          </p>
          <button
            onClick={() => reset()}
            className="mt-4 w-full rounded-2xl bg-[#1E2761] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#17204f]"
          >
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  );
}
