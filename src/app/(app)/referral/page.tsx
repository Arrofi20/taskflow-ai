"use client";

import { useEffect, useState } from "react";
import { Gift, Share2, Users, CheckCircle2, Copy } from "lucide-react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { getReferralCode } from "@/lib/premium";

export default function ReferralPage() {
  const [supabase] = useState(() => createClient());
  const [userId, setUserId] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [completedCount, setCompletedCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted || !user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);
      const code = getReferralCode(user.id);
      setReferralCode(code);

      // Ambil jumlah referral yang sudah completed
      const { count } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_id", user.id)
        .eq("status", "completed");

      if (mounted) {
        setCompletedCount(count ?? 0);
        setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  async function handleCopy() {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = referralCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleShare() {
    const shareData = {
      title: "TaskFlow AI - Undangan",
      text: `Daftar TaskFlow AI pakai kode referralku ${referralCode} dan belajar lebih cerdas!`,
      url: typeof window !== "undefined" ? window.location.origin : "",
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  }

  const progressToReward = Math.min(completedCount / 3, 1);
  const remaining = Math.max(3 - completedCount, 0);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-800">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <section className="rounded-[28px] bg-gradient-to-r from-[#1E2761] to-[#028090] p-5 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <Gift size={18} />
            <p className="text-sm font-semibold">Referral</p>
          </div>
          <h1 className="mt-3 text-2xl font-bold">Ajak Teman Belajar Lebih Cerdas</h1>
          <p className="mt-2 text-sm text-white/80">
            Bagikan kode referral Anda dan dapatkan 1 bulan Premium gratis setiap 3 teman berhasil mendaftar.
          </p>
        </section>

        {loading ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Memuat data referral...</p>
          </section>
        ) : (
          <>
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-[#1E2761]">Kode Referral Anda</h2>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xl font-bold tracking-widest text-[#1E2761]">
                  {referralCode}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E2761] px-4 py-3 text-sm font-semibold text-white"
                >
                  {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  {copied ? "Tersalin" : "Salin Kode"}
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#028090]/30 bg-[#028090]/10 px-4 py-3 text-sm font-semibold text-[#028090]"
                >
                  <Share2 size={16} />
                  Bagikan
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-[#028090]">
                <Users size={18} />
                <h2 className="text-lg font-semibold">Progress Referral</h2>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-600">
                    {completedCount} teman berhasil mendaftar
                  </span>
                  <span className="font-semibold text-[#1E2761]">
                    {remaining > 0 ? `${remaining} lagi` : "Reward tersedia!"}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[#028090] transition-all"
                    style={{ width: `${progressToReward * 100}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-semibold">Reward</p>
                <p className="mt-1">
                  Dapatkan <strong>1 bulan Premium gratis</strong> setiap kali 3 teman Anda berhasil mendaftar dan aktif menggunakan TaskFlow AI.
                </p>
              </div>
            </section>
          </>
        )}

        <Link
          href="/profil"
          className="text-center text-sm font-medium text-[#028090] hover:text-[#1E2761]"
        >
          Kembali ke Profil
        </Link>
      </div>
    </main>
  );
}
