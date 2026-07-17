"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, Clock3, Edit3, Mail, ShieldCheck, Gift, Zap, History, Bell } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { createClient } from "@/lib/supabase/client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function ProfilPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [fullName, setFullName] = useState("Pengguna");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("Free");
  const [isPremium, setIsPremium] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifStatus, setNotifStatus] = useState<string>("");
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        router.replace("/login");
        return;
      }

      const name = (user.user_metadata?.full_name as string | undefined) ?? "Pengguna";

      const { data: profile } = await supabase
        .from("users")
        .select("is_premium")
        .eq("id", user.id)
        .single();

      let premium = false;
      if (profile?.is_premium != null) {
        premium = profile.is_premium;
      } else {
        const savedPlan = ((user.user_metadata?.plan as string | undefined) ??
          (user.user_metadata?.subscription as string | undefined) ??
          "free").toLowerCase();
        premium = savedPlan === "premium";
      }

      if (mounted) {
        setFullName(name);
        setDraftName(name);
        setEmail(user.email ?? "");
        setIsPremium(premium);
        setPlan(premium ? "Premium" : "Free");
        setLoading(false);
      }
    }

    loadProfile();
    return () => { mounted = false; };
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
    const { error } = await supabase.auth.updateUser({ data: { full_name: nextName } });
    setSavingName(false);
    if (error) {
      setMessage("Gagal memperbarui nama.");
      return;
    }
    setFullName(nextName);
    setIsEditingName(false);
    setMessage("Nama berhasil diperbarui.");
  }

  async function enableNotifications() {
    setNotifLoading(true);
    setNotifStatus("");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setNotifStatus("Browser tidak mendukung notifikasi push.");
        return;
      }
      if (!VAPID_PUBLIC_KEY) {
        setNotifStatus("VAPID key belum dikonfigurasi.");
        return;
      }

      let permission = Notification.permission;
      if (permission === "denied") {
        setNotifStatus("Notifikasi diblokir. Izinkan lewat pengaturan browser lalu refresh.");
        return;
      }
      if (permission !== "granted") {
        permission = await Notification.requestPermission();
      }
      if (permission !== "granted") {
        setNotifStatus("Izin notifikasi ditolak. Coba lagi dan pilih Izinkan.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const sub = subscription.toJSON();
      if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
        setNotifStatus("Gagal membuat subscription.");
        return;
      }

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
        }),
      });

      if (res.ok) {
        setNotifStatus("Notifikasi berhasil diaktifkan! Tes notif akan masuk tiap 6 jam.");
      } else {
        setNotifStatus("Gagal menyimpan subscription (kode " + res.status + ").");
      }
    } catch (err) {
      setNotifStatus("Terjadi error: " + (err instanceof Error ? err.message : "unknown"));
    } finally {
      setNotifLoading(false);
    }
  }

  return (
    <main className="px-4 py-5">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <section className="gradient-bright-primary relative overflow-hidden rounded-[28px] p-5 text-white shadow-lg shadow-[#1E2761]/10">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-white/70">Halo,</p>
                <h1 className="mt-1 text-2xl font-bold">
                  {loading ? "Memuat profil..." : fullName}
                </h1>
              </div>
              <div className={`rounded-full px-3 py-1 text-sm font-semibold backdrop-blur-sm ${
                isPremium ? "bg-amber-400/20 text-amber-100" : "bg-white/15 text-white"
              }`}>
                {isPremium ? "PREMIUM" : "FREE"}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/10 p-3 text-sm backdrop-blur-sm">
              <ShieldCheck size={16} />
              <span>Status akun: {plan}</span>
            </div>
          </div>
        </section>

        <section className="card-vibrant rounded-3xl p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1E2761]">Informasi akun</h2>
            <button
              type="button"
              onClick={() => { setDraftName(fullName); setIsEditingName(true); setMessage(null); }}
              className="flex items-center gap-1 rounded-full bg-gradient-to-br from-[#028090]/10 to-[#03a3b5]/10 px-3 py-1.5 text-sm font-medium text-[#028090]"
            >
              <Edit3 size={15} />
              Edit nama
            </button>
          </div>

          {isEditingName ? (
            <form onSubmit={handleSaveName} className="mt-4 space-y-3">
              <label className="block text-sm text-slate-600">
                <span className="mb-1 block font-medium">Nama lengkap</span>
                <input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#028090] focus:ring-2 focus:ring-[#028090]/20"
                  placeholder="Masukkan nama lengkap"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={savingName}
                  className="rounded-2xl gradient-bright-primary px-4 py-2 text-sm font-semibold text-white shadow-sm"
                >
                  {savingName ? "Menyimpan..." : "Simpan"}
                </button>
                <button
                  type="button"
                  onClick={() => { setDraftName(fullName); setIsEditingName(false); setMessage(null); }}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm"
                >
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-sm text-slate-400">Nama lengkap</p>
                <p className="mt-1 font-semibold text-slate-900">{fullName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Email</p>
                <div className="mt-1 flex items-center gap-2 font-semibold text-slate-900">
                  <Mail size={15} className="text-[#028090]" />
                  <span>{email || "-"}</span>
                </div>
              </div>
            </div>
          )}

          {message ? (
            <p className="mt-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 px-3 py-2 text-sm text-slate-600">
              {message}
            </p>
          ) : null}
        </section>

        <section className="space-y-3">
          <Link
            href="/profil/waktu-kosong"
            className="card-vibrant flex items-center justify-between rounded-2xl px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-[#028090]/10 to-[#03a3b5]/10 p-2 text-[#028090]">
                <Clock3 size={18} />
              </div>
              <div>
                <p className="font-semibold text-[#1E2761]">Waktu Kosong</p>
                <p className="text-xs text-slate-400">Atur slot waktu belajar</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </Link>

          <Link
            href="/profil/subscription"
            className="card-vibrant flex items-center justify-between rounded-2xl px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-[#1E2761]/10 to-[#2a3675]/10 p-2 text-[#1E2761]">
                <Zap size={18} />
              </div>
              <div>
                <p className="font-semibold text-[#1E2761]">Subscription</p>
                <p className="text-xs text-slate-400">
                  {isPremium ? "Kelola paket premium" : "Lihat paket premium"}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </Link>

          <Link
            href="/referral"
            className="card-vibrant flex items-center justify-between rounded-2xl px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-[#ff6b6b]/10 to-[#ff8e8e]/10 p-2 text-[#ff6b6b]">
                <Gift size={18} />
              </div>
              <div>
                <p className="font-semibold text-[#1E2761]">Referral</p>
                <p className="text-xs text-slate-400">Ajak teman dan dapatkan premium gratis</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </Link>

          <Link
            href="/riwayat"
            className="card-vibrant flex items-center justify-between rounded-2xl px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-slate-500/10 to-slate-600/10 p-2 text-slate-600">
                <History size={18} />
              </div>
              <div>
                <p className="font-semibold text-[#1E2761]">Riwayat Aktivitas</p>
                <p className="text-xs text-slate-400">Lihat semua aktivitas Anda</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </Link>
        </section>

        <section className="card-vibrant rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-[#028090]/10 to-[#03a3b5]/10 p-2 text-[#028090]">
              <Bell size={18} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[#1E2761]">Notifikasi Push</p>
              <p className="text-xs text-slate-400">Aktifkan agar dapat pengingat deadline di HP</p>
            </div>
          </div>
          <button
            type="button"
            onClick={enableNotifications}
            disabled={notifLoading}
            className="mt-3 w-full rounded-2xl gradient-bright-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
          >
            {notifLoading ? "Memproses..." : "Aktifkan Notifikasi"}
          </button>
          {notifStatus ? (
            <p className="mt-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 px-3 py-2 text-sm text-slate-600">
              {notifStatus}
            </p>
          ) : null}
        </section>

        <div className="card-vibrant rounded-3xl p-2">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
