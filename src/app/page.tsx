import Link from "next/link";
import {
  Sparkles,
  CalendarDays,
  Bell,
  CheckCircle2,
  XCircle,
  Crown,
  Building2,
  Star,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Hero */}
      <header className="bg-gradient-to-br from-[#1E2761] to-[#028090] px-4 py-16 text-white sm:px-8 sm:py-24">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium">
            <Sparkles size={14} />
            TaskFlow AI
          </div>
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Bukan to-do list biasa — AI yang bantu kamu belajar lebih cerdas
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-white/80 sm:text-lg">
            Prioritas otomatis, jadwal belajar personal, dan deadline alert yang
            bikin produktivitasmu naik level.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#1E2761] shadow-lg transition hover:bg-slate-100"
            >
              Mulai Gratis
            </Link>
            <Link
              href="/b2b"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              <Building2 size={16} />
              Solusi Kampus & Bimbel
            </Link>
          </div>
        </div>
      </header>

      {/* Fitur Utama */}
      <section className="px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-[#1E2761] sm:text-3xl">
            Fitur Utama
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            Tiga pilar AI untuk mengoptimalkan cara kamu belajar
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1E2761]/10 text-[#1E2761]">
                <Sparkles size={24} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#1E2761]">
                AI Task Prioritization
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                AI menganalisis deadline, kesulitan, dan jenis tugas untuk
                menentukan prioritas yang paling optimal.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#028090]/10 text-[#028090]">
                <CalendarDays size={24} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#1E2761]">
                AI Study Schedule
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Jadwal belajar otomatis berdasarkan waktu kosongmu dan deadline
                tugas yang mendekat.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Bell size={24} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#1E2761]">
                AI Deadline Alert
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Notifikasi cerdas saat deadline kurang dari 24 jam dengan
                rekomendasi langkah selanjutnya.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Perbandingan */}
      <section className="bg-slate-50 px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-[#1E2761] sm:text-3xl">
            TaskFlow AI vs To-Do List Biasa
          </h2>

          <div className="mt-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <div>Fitur</div>
              <div className="text-center">To-Do List Biasa</div>
              <div className="text-center text-[#028090]">TaskFlow AI</div>
            </div>
            {[
              ["Prioritas otomatis", false, true],
              ["Jadwal belajar AI", false, true],
              ["Deadline alert pintar", false, true],
              ["Analisis produktivitas", false, true],
              ["Sinkronisasi kalender", false, true],
              ["Gratis", true, true],
            ].map(([feature, basic, tf]) => (
              <div
                key={String(feature)}
                className="grid grid-cols-3 border-b border-slate-100 px-4 py-3 text-sm last:border-0"
              >
                <div className="text-slate-700">{feature}</div>
                <div className="flex justify-center">
                  {basic ? (
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  ) : (
                    <XCircle size={18} className="text-slate-300" />
                  )}
                </div>
                <div className="flex justify-center">
                  {tf ? (
                    <CheckCircle2 size={18} className="text-[#028090]" />
                  ) : (
                    <XCircle size={18} className="text-slate-300" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-[#1E2761] sm:text-3xl">
            Pilih Paketmu
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#1E2761]">Free</h3>
              <p className="mt-1 text-sm text-slate-500">Untuk pemula</p>
              <p className="mt-4 text-3xl font-bold text-[#1E2761]">Rp 0</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 text-[#028090]" />
                  Maksimal 5 tugas aktif
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 text-[#028090]" />
                  Prioritas & jadwal dasar
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 text-[#028090]" />
                  Notifikasi basic
                </li>
              </ul>
              <Link
                href="/register"
                className="mt-6 block w-full rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Mulai Gratis
              </Link>
            </div>

            <div className="relative rounded-3xl border border-[#028090]/20 bg-[#028090]/5 p-6 shadow-sm">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#028090] px-3 py-1 text-xs font-bold text-white">
                POPULER
              </div>
              <h3 className="text-lg font-bold text-[#1E2761]">Premium</h3>
              <p className="mt-1 text-sm text-slate-500">Untuk yang serius</p>
              <p className="mt-4 text-3xl font-bold text-[#1E2761]">Rp 29.000</p>
              <p className="text-xs text-slate-500">/ bulan</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 text-[#028090]" />
                  Unlimited tugas aktif
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 text-[#028090]" />
                  Sinkronisasi kalender
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 text-[#028090]" />
                  Analisis produktivitas
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 text-[#028090]" />
                  Jadwal personal AI
                </li>
              </ul>
              <Link
                href="/register"
                className="mt-6 block w-full rounded-xl bg-[#1E2761] py-3 text-center text-sm font-semibold text-white transition hover:bg-[#028090]"
              >
                Upgrade ke Premium
              </Link>
            </div>

            <div className="rounded-3xl border border-[#1E2761]/10 bg-[#1E2761]/5 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#1E2761]">B2B</h3>
              <p className="mt-1 text-sm text-slate-500">Kampus & bimbel</p>
              <p className="mt-4 text-3xl font-bold text-[#1E2761]">Rp 5jt</p>
              <p className="text-xs text-slate-500">/ kampus / tahun</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 text-[#028090]" />
                  Dashboard dosen/pengajar
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 text-[#028090]" />
                  Monitoring tugas mahasiswa
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 text-[#028090]" />
                  Laporan produktivitas kelas
                </li>
              </ul>
              <Link
                href="/b2b"
                className="mt-6 block w-full rounded-xl border border-[#1E2761] py-3 text-center text-sm font-semibold text-[#1E2761] transition hover:bg-[#1E2761]/5"
              >
                Hubungi Kami
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-slate-50 px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-[#1E2761] sm:text-3xl">
            Apa Kata Mereka
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Andi, Mahasiswa Teknik",
                text: "TaskFlow AI bantu aku nggak pernah telat ngumpul tugas lagi. Prioritasnya super akurat!",
              },
              {
                name: "Siti, Siswa SMA",
                text: "Jadwal belajarnu pas banget sama waktu kosongku. Ujian jadi lebih tenang.",
              },
              {
                name: "Pak Budi, Dosen",
                text: "Fitur B2B sangat membantu monitoring progres mahasiswa dalam satu dashboard.",
              },
            ].map((item) => (
              <div
                key={item.name}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="mt-3 text-sm text-slate-600">{item.text}</p>
                <p className="mt-4 text-xs font-semibold text-[#1E2761]">
                  {item.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1E2761] px-4 py-12 text-white sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-bold">TaskFlow AI</h3>
              <p className="mt-1 text-sm text-white/70">
                Belajar lebih cerdas dengan AI.
              </p>
            </div>
            <div className="flex gap-4">
              <a
                href="#"
                className="rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20"
                aria-label="Instagram"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              <a
                href="#"
                className="rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20"
                aria-label="Twitter"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              </a>
              <a
                href="#"
                className="rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20"
                aria-label="LinkedIn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
            </div>
          </div>
          <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/50">
            &copy; {new Date().getFullYear()} TaskFlow AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
