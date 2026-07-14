"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  BarChart3,
  Users,
  FileText,
  CheckCircle2,
  Send,
  ArrowLeft,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export default function B2BPage() {
  const [form, setForm] = useState({
    institution_name: "",
    contact_name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate() {
    const nextErrors: Partial<typeof form> = {};
    if (!form.institution_name.trim())
      nextErrors.institution_name = "Nama institusi wajib diisi.";
    if (!form.contact_name.trim())
      nextErrors.contact_name = "Nama kontak wajib diisi.";
    if (!form.email.trim()) nextErrors.email = "Email wajib diisi.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      nextErrors.email = "Format email tidak valid.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from("b2b_leads").insert({
      institution_name: form.institution_name.trim(),
      contact_name: form.contact_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      message: form.message.trim() || null,
    });

    setSubmitting(false);
    if (error) {
      setErrors({ email: "Gagal mengirim. Silakan coba lagi." });
    } else {
      setSuccess(true);
      setForm({
        institution_name: "",
        contact_name: "",
        email: "",
        phone: "",
        message: "",
      });
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Hero */}
      <header className="bg-gradient-to-br from-[#1E2761] to-[#028090] px-4 py-16 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
          >
            <ArrowLeft size={16} />
            Kembali ke Beranda
          </Link>
          <h1 className="mt-6 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            Solusi AI untuk Kampus & Bimbel
          </h1>
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
            Fitur Khusus B2B
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
            Pricing B2B
          </h2>

          <div className="mt-10 rounded-3xl border border-[#1E2761]/10 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <Building2 size={28} className="text-[#1E2761]" />
              <h3 className="text-xl font-bold text-[#1E2761]">
                Paket Kampus / Lembaga
              </h3>
            </div>
            <p className="mt-4 text-5xl font-bold text-[#1E2761]">
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
                  <CheckCircle2 size={16} className="mt-0.5 text-[#028090]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Form Hubungi Kami */}
      <section className="px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-xl">
          <h2 className="text-center text-2xl font-bold text-[#1E2761] sm:text-3xl">
            Hubungi Kami
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            Isi form di bawah untuk request demo atau informasi lebih lanjut.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            {success && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Terima kasih! Tim kami akan menghubungi Anda segera.
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Nama Institusi
              </label>
              <input
                value={form.institution_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, institution_name: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#028090]"
                placeholder="Universitas / Bimbel"
              />
              {errors.institution_name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.institution_name}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Nama Kontak
              </label>
              <input
                value={form.contact_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contact_name: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#028090]"
                placeholder="Nama lengkap"
              />
              {errors.contact_name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.contact_name}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#028090]"
                placeholder="email@institusi.ac.id"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Nomor Telepon
              </label>
              <input
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#028090]"
                placeholder="0812xxxxxxx"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Pesan (opsional)
              </label>
              <textarea
                value={form.message}
                onChange={(e) =>
                  setForm((f) => ({ ...f, message: e.target.value }))
                }
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#028090]"
                placeholder="Ceritakan kebutuhan institusi Anda..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E2761] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#028090] disabled:opacity-60"
            >
              <Send size={16} />
              {submitting ? "Mengirim..." : "Kirim Request Demo"}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1E2761] px-4 py-8 text-center text-xs text-white/50">
        &copy; {new Date().getFullYear()} TaskFlow AI. All rights reserved.
      </footer>
    </div>
  );
}
