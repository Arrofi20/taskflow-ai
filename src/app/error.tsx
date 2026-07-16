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
      <body className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f8f9fe] via-[#f0f4ff] to-[#fef9f0] p-4">
        <div className="card-vibrant w-full max-w-sm rounded-3xl p-6 text-center">
          <h2 className="text-xl font-bold text-[#1E2761]">Terjadi Kesalahan</h2>
          <p className="mt-2 text-sm text-slate-500">
            Maaf, aplikasi mengalami masalah. Silakan coba lagi.
          </p>
          <button
            onClick={() => reset()}
            className="gradient-bright-primary mt-4 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
          >
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  );
}
