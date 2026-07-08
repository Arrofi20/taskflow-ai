"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, Clock3, Edit3, Mail, ShieldCheck } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { createClient } from "@/lib/supabase/client";

export default function ProfilPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [fullName, setFullName] = useState("Pengguna");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("Free");
  const [draftName, setDraftName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      const name =
        (user.user_metadata?.full_name as string | undefined) ?? "Pengguna";
      const savedPlan =
        ((user.user_metadata?.plan as string | undefined) ??
          (user.user_metadata?.subscription as string | undefined) ??
          "free")
          .toLowerCase();

      setFullName(name);
      setDraftName(name);
      setEmail(user.email ?? "");
      setPlan(savedPlan === "premium" ? "Premium" : "Free");
      setLoading(false);
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  async function handleSaveName(event: React.FormEvent) {
    event.preventDefault();

    const nextName = draftName.trim();
    if (!nextName) {
      setMessage("Nama tidak boleh kosong.");
      return;
    }

    setSavingName(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({
      data: { full_name: nextName },
    });

    setSavingName(false);

    if (error) {
      setMessage("Gagal memperbarui nama.");
      return;
    }

    setFullName(nextName);
    setIsEditingName(false);
    setMessage("Nama berhasil diperbarui.");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-800">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <section className="rounded-[28px] bg-gradient-to-r from-[#1E2761] to-[#028090] p-5 text-white shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-white/80">Halo,</p>
              <h1 className="mt-1 text-2xl font-bold">
                {loading ? "Memuat profil..." : fullName}
              </h1>
            </div>
            <div
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                plan === "Premium"
                  ? "bg-emerald-400/20 text-emerald-100"
                  : "bg-white/15 text-white"
              }`}
            >
              {plan}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/15 p-3 text-sm">
            <ShieldCheck size={16} />
            <span>Status akun: {plan}</span>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1E2761]">Informasi akun</h2>
            <button
              type="button"
              onClick={() => {
                setDraftName(fullName);
                setIsEditingName(true);
                setMessage(null);
              }}
              className="flex items-center gap-1 rounded-full bg-[#028090]/10 px-3 py-1.5 text-sm font-medium text-[#028090]"
            >
              <Edit3 size={15} />
              Edit nama
            </button>
          </div>

          {isEditingName ? (
            <form onSubmit={handleSaveName} className="mt-4 space-y-3">
              <label className="block text-sm text-slate-700">
                <span className="mb-1 block font-medium">Nama lengkap</span>
                <input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#028090]"
                  placeholder="Masukkan nama lengkap"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={savingName}
                  className="rounded-2xl bg-[#1E2761] px-4 py-2 text-sm font-semibold text-white"
                >
                  {savingName ? "Menyimpan..." : "Simpan"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraftName(fullName);
                    setIsEditingName(false);
                    setMessage(null);
                  }}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-sm text-slate-500">Nama lengkap</p>
                <p className="mt-1 font-semibold text-slate-900">{fullName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Email</p>
                <div className="mt-1 flex items-center gap-2 font-semibold text-slate-900">
                  <Mail size={15} className="text-[#028090]" />
                  <span>{email || "-"}</span>
                </div>
              </div>
            </div>
          )}

          {message ? (
            <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600">
              {message}
            </p>
          ) : null}
        </section>

        <section className="space-y-3">
          <Link
            href="/profil/waktu-kosong"
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#028090]/10 p-2 text-[#028090]">
                <Clock3 size={18} />
              </div>
              <div>
                <p className="font-semibold text-[#1E2761]">Waktu Kosong</p>
                <p className="text-sm text-slate-500">Atur slot waktu belajar</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </Link>

          <Link
            href="/profil/subscription"
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#1E2761]/10 p-2 text-[#1E2761]">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="font-semibold text-[#1E2761]">Subscription</p>
                <p className="text-sm text-slate-500">Lihat paket premium</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </Link>
        </section>

        <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
