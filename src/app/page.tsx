import Link from "next/link";
import {
  Sparkles,
  CalendarDays,
  Bell,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Zap,
  BookOpen,
  ShieldCheck,
  BarChart3,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f9fe] via-[#f0f4ff] to-[#fef9f0] text-slate-800">
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#1E2761] via-[#1a2a6b] to-[#028090] px-4 py-16 text-white sm:px-8 sm:py-24">
        <div className="absolute inset-0 animate-gradient bg-[length:200%_200%] bg-gradient-to-r from-[#1E2761] via-[#028090] via-[#FF6B6B] to-[#1E2761] opacity-20" />
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/5" />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
            <Sparkles size={14} />
            TaskFlow AI
          </div>
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Bukan to-do list biasa — AI yang tahu mana tugas yang harus kamu kerjain sekarang
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-white/80 sm:text-lg">
            Prioritas otomatis, jadwal belajar personal, dan prediksi risiko keterlambatan yang bikin produktivitasmu naik level.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b6b] to-[#ff8e8e] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
            >
              Mulai Gratis Sekarang
              <ArrowRight size={16} />
            </Link>
          </div>
          <p className="mt-3 text-xs text-white/60">Digunakan oleh mahasiswa di seluruh Indonesia</p>
        </div>
      </header>

      {/* Bagaimana cara kerjanya */}
      <section className="px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-[#1E2761] sm:text-3xl">
            Bagaimana cara kerjanya?
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Tambah Tugas",
                desc: "Masukkan nama tugas, mata kuliah, jenis, deadline, dan estimasi waktu.",
                icon: Zap,
                gradient: "from-[#1E2761] to-[#2a3675]",
              },
              {
                step: "2",
                title: "AI Menganalisis",
                desc: "AI menghitung skor prioritas 0-100, tingkat kesulitan, dan risiko keterlambatan.",
                icon: Sparkles,
                gradient: "from-[#028090] to-[#03a3b5]",
              },
              {
                step: "3",
                title: "Jadwal & Alert",
                desc: "Dapatkan jadwal belajar optimal di jam produktifmu dan alert proaktif sebelum deadline.",
                icon: Bell,
                gradient: "from-[#ff6b6b] to-[#ff8e8e]",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group card-vibrant rounded-3xl p-6 transition hover:-translate-y-1"
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} text-white shadow-sm transition group-hover:scale-110`}>
                  <item.icon size={22} />
                </div>
                <div className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-[#1E2761]">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-[#1E2761]">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fitur */}
      <section className="px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-[#1E2761] sm:text-3xl">
            Fitur Utama
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Tiga pilar AI untuk mengoptimalkan cara kamu belajar
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <div className="group card-vibrant rounded-3xl p-6 transition hover:-translate-y-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#1E2761] to-[#2a3675] text-white shadow-sm transition group-hover:scale-110">
                <Sparkles size={22} />
              </div>
              <h3 className="text-lg font-bold text-[#1E2761]">
                AI Task Prioritization
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                AI menganalisis deadline, jenis tugas, dan histori untuk menghasilkan skor prioritas 0-100 secara real-time.
              </p>
            </div>

            <div className="group card-vibrant rounded-3xl p-6 transition hover:-translate-y-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#028090] to-[#03a3b5] text-white shadow-sm transition group-hover:scale-110">
                <CalendarDays size={22} />
              </div>
              <h3 className="text-lg font-bold text-[#1E2761]">
                AI Study Schedule
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Jadwal belajar otomatis berdasarkan jam produktif historismu dan slot waktu kosong yang kamu atur.
              </p>
            </div>

            <div className="group card-vibrant rounded-3xl p-6 transition hover:-translate-y-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6b6b] to-[#ff8e8e] text-white shadow-sm transition group-hover:scale-110">
                <Bell size={22} />
              </div>
              <h3 className="text-lg font-bold text-[#1E2761]">
                AI Deadline Alert
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Prediksi probabilitas keterlambatan per tugas. Alert proaktif muncul jauh sebelum deadline saat risiko &gt; 70%.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Perbandingan */}
      <section className="px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-[#1E2761] sm:text-3xl">
            TaskFlow AI vs To-Do List Biasa
          </h2>

          <div className="mt-10 overflow-hidden rounded-3xl card-vibrant">
            <div className="grid grid-cols-3 border-b border-[#1E2761]/8 bg-gradient-to-r from-[#f0f4ff] to-[#fef9f0] px-4 py-3 text-sm font-semibold text-slate-700">
              <div>Fitur</div>
              <div className="text-center">To-Do List Biasa</div>
              <div className="text-center text-[#028090]">TaskFlow AI</div>
            </div>
            {[
              ["Skor prioritas 0-100", false, true],
              ["Prediksi risiko telat", false, true],
              ["Jadwal belajar AI", false, true],
              ["Jam produktif personal", false, true],
              ["Alert proaktif", false, true],
              ["Analisis produktivitas", false, true],
              ["Gratis", true, true],
            ].map(([feature, basic, tf]) => (
              <div
                key={String(feature)}
                className="grid grid-cols-3 border-b border-[#1E2761]/5 px-4 py-3 text-sm last:border-0"
              >
                <div className="text-slate-700">{String(feature)}</div>
                <div className="flex justify-center">
                  {basic ? (
                    <CheckCircle2 size={18} className="text-[#6bcb77]" />
                  ) : (
                    <XCircle size={18} className="text-slate-200" />
                  )}
                </div>
                <div className="flex justify-center">
                  {tf ? (
                    <CheckCircle2 size={18} className="text-[#028090]" />
                  ) : (
                    <XCircle size={18} className="text-slate-200" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof + CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1E2761] via-[#1a2a6b] to-[#028090] px-4 py-16 text-white sm:px-8 sm:py-24">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-white/5" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 flex items-center justify-center gap-2">
            <ShieldCheck size={20} />
            <span className="text-sm font-medium opacity-80">Digunakan oleh mahasiswa di seluruh Indonesia</span>
          </div>
          <h2 className="text-2xl font-bold sm:text-4xl">
            Siap naik level produktivitasmu?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base opacity-80">
            Bergabung dengan ribuan mahasiswa yang sudah menggunakan TaskFlow AI untuk mengatur tugas dan jadwal belajar.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b6b] to-[#ff8e8e] px-8 py-4 text-sm font-bold text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
            >
              Mulai Gratis Sekarang
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-[#1E2761]/8 px-4 py-12 text-slate-600 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-bold text-[#1E2761]">TaskFlow AI</h3>
              <p className="mt-1 text-sm text-slate-400">
                Belajar lebih cerdas dengan AI.
              </p>
            </div>
            <div className="flex gap-4">
              <a
                href="#"
                className="rounded-full bg-gradient-to-br from-[#f0f4ff] to-[#fef9f0] p-2 text-[#1E2761] shadow-sm transition hover:shadow-md"
                aria-label="Instagram"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              <a
                href="#"
                className="rounded-full bg-gradient-to-br from-[#f0f4ff] to-[#fef9f0] p-2 text-[#1E2761] shadow-sm transition hover:shadow-md"
                aria-label="Twitter"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              </a>
              <a
                href="#"
                className="rounded-full bg-gradient-to-br from-[#f0f4ff] to-[#fef9f0] p-2 text-[#1E2761] shadow-sm transition hover:shadow-md"
                aria-label="LinkedIn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
            </div>
          </div>
          <div className="mt-8 border-t border-[#1E2761]/8 pt-6 text-center text-xs text-slate-400">
            &copy; {new Date().getFullYear()} TaskFlow AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
