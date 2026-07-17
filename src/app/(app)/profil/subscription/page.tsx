"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Crown,
  Sparkles,
  Building2,
  Loader2,
  Clock,
  Zap,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

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
  b2b: [
    "Dashboard dosen/pengajar",
    "Monitoring tugas mahasiswa",
    "Laporan produktivitas kelas",
    "Manajemen banyak pengguna",
    "Support prioritas",
  ],
};

export default function SubscriptionPage() {
  const router = useRouter();
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function loadStatus() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      const { data: profile } = await supabase
        .from("users")
        .select("is_premium,premium_until")
        .eq("id", user.id)
        .single();

      let premium = false;
      let until: string | null = null;

      if (profile?.is_premium != null) {
        premium = profile.is_premium;
        until = profile.premium_until;
      } else {
        const meta = user.user_metadata;
        if (meta && typeof meta.is_premium === "boolean") {
          premium = meta.is_premium;
        } else if (meta && typeof meta.plan === "string") {
          premium = meta.plan.toLowerCase() === "premium";
        }
      }

      // Check if trial expired
      if (premium && until && new Date(until) < new Date()) {
        premium = false;
        // Auto-downgrade
        await supabase
          .from("users")
          .update({ is_premium: false, premium_until: null })
          .eq("id", user.id);
        await supabase.auth.updateUser({
          data: { is_premium: false, plan: "free", subscription: "free" },
        });
      }

      if (mounted) {
        setIsPremium(premium);
        setPremiumUntil(until);
        setLoading(false);
      }
    }

    loadStatus();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  async function handleActivateTrial() {
    setActivating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/premium/upgrade", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setIsPremium(true);
        const until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        setPremiumUntil(until);
        setMessage("Trial 30 hari berhasil diaktifkan!");

        fetch("/api/activity/history/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "Trial Premium diaktifkan",
            category: "premium",
            detail: { from: "Free", to: "Premium" },
          }),
        }).catch(() => {});

        setTimeout(() => router.refresh(), 1500);
      } else {
        setMessage(data.error ?? "Gagal mengaktifkan trial.");
      }
    } catch {
      setMessage("Terjadi kesalahan jaringan.");
    } finally {
      setActivating(false);
    }
  }

  async function handleDowngrade() {
    if (!confirm("Kembali ke paket Free? Fitur premium akan dinonaktifkan.")) return;
    setDeactivating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/premium/downgrade", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setIsPremium(false);
        setPremiumUntil(null);
        setMessage("Berhasil kembali ke paket Free.");

        fetch("/api/activity/history/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "Kembali ke paket Free",
            category: "premium",
            detail: { from: "Premium", to: "Free" },
          }),
        }).catch(() => {});

        setTimeout(() => router.refresh(), 1500);
      } else {
        setMessage(data.error ?? "Gagal menurunkan paket.");
      }
    } catch {
      setMessage("Terjadi kesalahan jaringan.");
    } finally {
      setDeactivating(false);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

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

        {/* Status saat ini */}
        {!loading && isPremium !== null && (
          <section
            className={`rounded-[28px] p-5 text-white shadow-sm ${
              isPremium
                ? "bg-gradient-to-r from-[#1E2761] to-[#028090]"
                : "bg-gradient-to-r from-slate-500 to-slate-600"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {isPremium ? <Crown size={18} /> : <Zap size={18} />}
                  <p className="text-sm font-semibold">
                    Paket Saat Ini: {isPremium ? "Premium" : "Free"}
                  </p>
                </div>
                {isPremium && premiumUntil && (
                  <p className="mt-1 text-sm text-white/80">
                    Berlaku hingga {formatDate(premiumUntil)}
                  </p>
                )}
                {!isPremium && (
                  <p className="mt-1 text-sm text-white/80">
                    Aktifkan trial untuk membuka semua fitur premium
                  </p>
                )}
              </div>
              {isPremium && (
                <div className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur-sm">
                  AKTIF
                </div>
              )}
            </div>
          </section>
        )}

        {message && (
          <div
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              message.includes("Gagal") || message.includes("Kesalahan")
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {/* FREE */}
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-[#1E2761]">Free</p>
                <p className="text-sm text-slate-500">Cocok untuk pemula</p>
              </div>
              {!isPremium && (
                <div className="rounded-full bg-[#028090] px-3 py-1 text-sm font-semibold text-white">
                  Aktif
                </div>
              )}
              {isPremium && (
                <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                  Gratis
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2">
              {features.free.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700"
                >
                  <Check size={16} className="mt-0.5 text-[#028090]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {isPremium && (
              <button
                type="button"
                onClick={handleDowngrade}
                disabled={deactivating}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-60"
              >
                {deactivating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Kembali ke Free"
                )}
              </button>
            )}
          </section>

          {/* PREMIUM */}
          <section className="rounded-3xl border border-[#028090]/20 bg-[#028090]/5 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-[#1E2761]">Premium</p>
                <p className="text-sm text-slate-600">Fitur lebih lengkap dan personal</p>
              </div>
              {isPremium && (
                <div className="rounded-full bg-[#028090] px-3 py-1 text-sm font-semibold text-white">
                  Aktif
                </div>
              )}
              {!isPremium && (
                <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                  Populer
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2">
              {features.premium.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-2 rounded-xl bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <Check size={16} className="mt-0.5 text-[#028090]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-white p-3">
              {!isPremium ? (
                <>
                  <p className="text-sm text-slate-500">Trial 30 hari gratis. Batalkan kapan saja.</p>
                  <p className="mt-1 text-2xl font-bold text-[#1E2761]">Rp 29.000</p>
                  <p className="text-sm text-slate-500">per bulan setelah trial</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-500">Paket aktif</p>
                  <p className="mt-1 text-2xl font-bold text-[#1E2761]">Premium</p>
                  {premiumUntil && (
                    <p className="text-sm text-slate-500">hingga {formatDate(premiumUntil)}</p>
                  )}
                </>
              )}
            </div>

            {!isPremium && (
              <button
                type="button"
                onClick={handleActivateTrial}
                disabled={activating}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1E2761] px-4 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
              >
                {activating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                {activating ? "Mengaktifkan..." : "Coba Premium 30 Hari Gratis"}
              </button>
            )}
          </section>
        </div>

        {/* B2B - Segera Hadir */}
        <section className="rounded-3xl border border-[#1E2761]/10 bg-[#1E2761]/5 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 size={20} className="text-[#1E2761]" />
              <p className="text-lg font-semibold text-[#1E2761]">B2B Licensing</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              <Clock size={12} />
              Segera Hadir
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Solusi AI untuk Kampus, Bimbel &amp; Lembaga Pendidikan.
          </p>

          <div className="mt-4 space-y-2">
            {features.b2b.map((item) => (
              <div
                key={item}
                className="flex items-start gap-2 rounded-xl bg-white px-3 py-2 text-sm text-slate-700"
              >
                <Check size={16} className="mt-0.5 text-[#028090]" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            disabled
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-300 px-4 py-3 text-sm font-semibold text-slate-500 cursor-not-allowed"
          >
            Coming Soon
          </button>
        </section>
      </div>
    </main>
  );
}
