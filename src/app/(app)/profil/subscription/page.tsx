"use client";

import Link from "next/link";
import { ArrowLeft, Check, Crown, Sparkles } from "lucide-react";

const features = {
  free: [
    "Fitur dasar task management",
    "Maksimal 5 tugas aktif",
    "Jadwal sederhana",
    "Notifikasi basic",
  ],
  premium: [
    "Unlimited tugas aktif",
    "Sinkronisasi kalender",
    "Analisis produktivitas",
    "Rekomendasi jadwal lebih personal",
    "Prioritas AI yang lebih detail",
  ],
};

export default function SubscriptionPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-800">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/profil"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1E2761] shadow-sm"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-sm font-medium text-[#028090]">Profil</p>
            <h1 className="text-2xl font-bold text-[#1E2761]">Subscription</h1>
          </div>
        </div>

        <section className="rounded-[28px] bg-gradient-to-r from-[#1E2761] to-[#028090] p-5 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <Crown size={18} />
            <p className="text-sm font-semibold">Upgrade ke Premium</p>
          </div>
          <h2 className="mt-3 text-2xl font-bold">Buka potensi produktivitas Anda</h2>
          <p className="mt-2 text-sm text-white/80">
            Nikmati pengalaman yang lebih cerdas, personal, dan bebas batas untuk mengelola tugas.
          </p>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-[#1E2761]">Free</p>
                <p className="text-sm text-slate-500">Cocok untuk pemula</p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                Gratis
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {features.free.map((item) => (
                <div key={item} className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <Check size={16} className="mt-0.5 text-[#028090]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[#028090]/20 bg-[#028090]/5 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-[#1E2761]">Premium</p>
                <p className="text-sm text-slate-600">Fitur lebih lengkap dan personal</p>
              </div>
              <div className="rounded-full bg-[#028090] px-3 py-1 text-sm font-semibold text-white">
                Populer
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {features.premium.map((item) => (
                <div key={item} className="flex items-start gap-2 rounded-xl bg-white px-3 py-2 text-sm text-slate-700">
                  <Check size={16} className="mt-0.5 text-[#028090]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-white p-3">
              <p className="text-sm text-slate-500">Harga mulai</p>
              <p className="mt-1 text-2xl font-bold text-[#1E2761]">Rp 29.000</p>
              <p className="text-sm text-slate-500">per bulan</p>
              <p className="mt-2 text-sm text-[#028090] font-medium">atau Rp 249.000 / tahun</p>
            </div>

            <button
              type="button"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1E2761] px-4 py-3 text-sm font-semibold text-white shadow-sm"
            >
              <Sparkles size={16} />
              Upgrade sekarang
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}
