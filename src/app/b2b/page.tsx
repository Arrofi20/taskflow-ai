"use client";

import Link from "next/link";
import {
  Building2,
  BarChart3,
  Users,
  FileText,
  ArrowLeft,
  Clock,
  Mail,
} from "lucide-react";

export default function B2BPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Hero */}
      <header className="bg-gradient-to-br from-[#1E2761] to-[#028090] px-4 py-16 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
          >
            <ArrowLeft size={16} />
            Kembali ke Dashboard
          </Link>
          <div className="mt-6 flex items-center gap-3">
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Solusi AI untuk Kampus &amp; Bimbel
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur-sm">
              <Clock size={14} />
              Segera Hadir
            </span>
          </div>
          <p className="mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
            Tingkatkan produktivitas mahasiswa dan siswa dengan sistem manajemen
            tugas berbasis AI yang terintegrasi penuh.
          </p>
        </div>
      </header>

      {/* Fitur B2B */}
      <section className="px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-[#1E2761] sm:text-3xl">
            B2B Licensing
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1E2761]/10 text-[#1E2761]">
                <BarChart3 size={24} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#1E2761]">
                Dashboard Dosen/Pengajar
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Pantau progres tugas dan aktivitas belajar seluruh kelas dalam
                satu dashboard terpadu.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#028090]/10 text-[#028090]">
                <Users size={24} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#1E2761]">
                Monitoring Tugas Mahasiswa
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Lihat siapa yang mengerjakan tepat waktu, terlambat, atau belum
                mulai mengerjakan.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <FileText size={24} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#1E2761]">
                Laporan Produktivitas Kelas
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Generate laporan mingguan dan bulanan untuk evaluasi kinerja
                akademik kelas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-slate-50 px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-[#1E2761] sm:text-3xl">
            Pricing
          </h2>

          <div className="mt-10 rounded-3xl border border-[#1E2761]/10 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <Building2 size={28} className="text-[#1E2761]" />
              <h3 className="text-xl font-bold text-[#1E2761]">
                Paket Kampus / Lembaga
              </h3>
            </div>
            <p className="mt-4 text-sm text-slate-500">Harga</p>
            <p className="mt-1 text-5xl font-bold text-[#1E2761]">
              Rp 5.000.000
            </p>
            <p className="mt-1 text-sm text-slate-500">/ kampus / tahun</p>

            <ul className="mt-6 space-y-3 text-sm text-slate-600">
              {[
                "Unlimited mahasiswa/siswa",
                "Dashboard admin & dosen",
                "Monitoring real-time",
                "Laporan produktivitas otomatis",
                "Support prioritas",
                "Training penggunaan",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#028090]">&#10003;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Coming Soon CTA */}
      <section className="px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-xl text-center">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8">
            <Clock size={48} className="mx-auto text-amber-500" />
            <h2 className="mt-4 text-2xl font-bold text-[#1E2761]">
              Segera Hadir
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Fitur B2B Licensing sedang dalam pengembangan. Daftarkan minat Anda
              agar kami hubungi saat fitur ini resmi diluncurkan.
            </p>
            <a
              href="mailto:hello@taskflow-ai.app?subject=Interest%20B2B%20Licensing"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#1E2761] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#028090] transition"
            >
              <Mail size={16} />
              Hubungi Kami via Email
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1E2761] px-4 py-8 text-center text-xs text-white/50">
        &copy; {new Date().getFullYear()} TaskFlow AI. All rights reserved.
      </footer>
    </div>
  );
}
