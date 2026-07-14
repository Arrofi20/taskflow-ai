"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Clock, CheckSquare, ChevronRight, SkipForward } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

const steps = [
  {
    title: "Selamat Datang di TaskFlow AI",
    description:
      "Bukan to-do list biasa — ini adalah AI yang bantu kamu belajar lebih cerdas dengan prioritas otomatis, jadwal belajar personal, dan deadline alert.",
    icon: Sparkles,
  },
  {
    title: "Atur Waktu Kosongmu",
    description:
      "Beritahu kami kapan kamu punya waktu luang setiap harinya, agar AI bisa menyusun jadwal belajar yang paling pas untukmu.",
    icon: Clock,
  },
  {
    title: "Tambah Tugas Pertama",
    description:
      "Mulai dengan menambahkan tugas atau ujian pertamamu. TaskFlow AI akan langsung menganalisis dan memberikan prioritas.",
    icon: CheckSquare,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [freeTimeSlots, setFreeTimeSlots] = useState<
    { hari: string; jam_mulai: string; jam_selesai: string }[]
  >([]);
  const [saving, setSaving] = useState(false);

  const hariList = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const meta = user.user_metadata;
      if (meta?.onboarding_completed) {
        router.replace("/dashboard");
        return;
      }

      setLoading(false);
    }
    checkUser();
  }, [router, supabase]);

  async function finishOnboarding() {
    setSaving(true);
    await supabase.auth.updateUser({
      data: { onboarding_completed: true },
    });

    // Simpan waktu kosong jika ada
    const { data: { user } } = await supabase.auth.getUser();
    if (user && freeTimeSlots.length > 0) {
      await supabase.from("free_time").insert(
        freeTimeSlots.map((slot) => ({
          user_id: user.id,
          hari: slot.hari,
          jam_mulai: slot.jam_mulai,
          jam_selesai: slot.jam_selesai,
        })),
      );
    }

    router.push("/dashboard");
  }

  function addFreeTimeSlot(hari: string) {
    setFreeTimeSlots((prev) => [
      ...prev,
      { hari, jam_mulai: "08:00", jam_selesai: "10:00" },
    ]);
  }

  function updateFreeTimeSlot(
    index: number,
    field: "jam_mulai" | "jam_selesai",
    value: string,
  ) {
    setFreeTimeSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot)),
    );
  }

  function removeFreeTimeSlot(index: number) {
    setFreeTimeSlots((prev) => prev.filter((_, i) => i !== index));
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Memuat...</p>
      </div>
    );
  }

  const StepIcon = steps[currentStep].icon;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 px-4 py-6 text-slate-800">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-[#1E2761]">
              Langkah {currentStep + 1} dari {steps.length}
            </span>
            <button
              type="button"
              onClick={finishOnboarding}
              className="flex items-center gap-1 text-slate-500 hover:text-[#1E2761]"
            >
              <SkipForward size={14} />
              Lewati
            </button>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[#028090] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#028090]/10 text-[#028090]">
            <StepIcon size={32} />
          </div>

          <h1 className="mt-4 text-2xl font-bold text-[#1E2761]">
            {steps[currentStep].title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {steps[currentStep].description}
          </p>

          {currentStep === 1 && (
            <div className="mt-6 space-y-4">
              {hariList.map((hari) => {
                const slots = freeTimeSlots.filter((s) => s.hari === hari);
                return (
                  <div key={hari} className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[#1E2761]">{hari}</p>
                      <button
                        type="button"
                        onClick={() => addFreeTimeSlot(hari)}
                        className="rounded-lg bg-[#028090]/10 px-2 py-1 text-xs font-medium text-[#028090]"
                      >
                        + Tambah slot
                      </button>
                    </div>
                    {slots.length === 0 && (
                      <p className="mt-2 text-xs text-slate-400">
                        Belum ada waktu kosong
                      </p>
                    )}
                    <div className="mt-2 space-y-2">
                      {slots.map((slot, idx) => {
                        const globalIndex = freeTimeSlots.findIndex(
                          (s) => s.hari === hari && s === slot,
                        );
                        return (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="time"
                              value={slot.jam_mulai}
                              onChange={(e) =>
                                updateFreeTimeSlot(globalIndex, "jam_mulai", e.target.value)
                              }
                              className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                            />
                            <span className="text-sm text-slate-500">-</span>
                            <input
                              type="time"
                              value={slot.jam_selesai}
                              onChange={(e) =>
                                updateFreeTimeSlot(globalIndex, "jam_selesai", e.target.value)
                              }
                              className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => removeFreeTimeSlot(globalIndex)}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              Hapus
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {currentStep === 2 && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-600">
                Yuk tambahkan tugas pertamamu sebagai contoh!
              </p>
              <button
                type="button"
                onClick={() => router.push("/tugas/tambah")}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#1E2761] px-4 py-2.5 text-sm font-semibold text-white"
              >
                <CheckSquare size={16} />
                Tambah Tugas
              </button>
              <p className="mt-3 text-xs text-slate-400">
                Atau langsung ke dashboard dan tambahkan nanti.
              </p>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="mt-6 flex gap-3">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => s - 1)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Sebelumnya
            </button>
          )}
          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => s + 1)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1E2761] px-4 py-3 text-sm font-semibold text-white"
            >
              Lanjut
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={finishOnboarding}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#028090] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Mulai Gunakan TaskFlow"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
