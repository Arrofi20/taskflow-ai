"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock3, Plus, Trash2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { FreeTimeItem } from "@/lib/supabase/database.types";

const DAYS = [
  { value: "Senin", label: "Senin" },
  { value: "Selasa", label: "Selasa" },
  { value: "Rabu", label: "Rabu" },
  { value: "Kamis", label: "Kamis" },
  { value: "Jumat", label: "Jumat" },
  { value: "Sabtu", label: "Sabtu" },
  { value: "Minggu", label: "Minggu" },
] as const;

type SlotInput = {
  id: string;
  days: string[];
  startTime: string;
  endTime: string;
};

function createEmptySlot(): SlotInput {
  return {
    id: crypto.randomUUID(),
    days: [],
    startTime: "",
    endTime: "",
  };
}

export default function WaktuKosongPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [slots, setSlots] = useState<SlotInput[]>(() => [createEmptySlot()]);
  const [items, setItems] = useState<FreeTimeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
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

      const { data, error } = await supabase
        .from("free_time")
        .select("*")
        .eq("user_id", user.id)
        .order("hari", { ascending: true });

      if (!mounted) {
        return;
      }

      if (error) {
        setMessage("Gagal memuat waktu kosong.");
        setLoading(false);
        return;
      }

      setItems(data ?? []);
      setLoading(false);
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  function updateSlot(slotId: string, patch: Partial<SlotInput>) {
    setSlots((current) =>
      current.map((slot) => (slot.id === slotId ? { ...slot, ...patch } : slot)),
    );
  }

  function toggleDay(slotId: string, day: string) {
    setSlots((current) =>
      current.map((slot) => {
        if (slot.id !== slotId) {
          return slot;
        }

        if (slot.days.includes(day)) {
          return {
            ...slot,
            days: slot.days.filter((selectedDay) => selectedDay !== day),
          };
        }

        return {
          ...slot,
          days: [...slot.days, day],
        };
      }),
    );
  }

  function addSlot() {
    setSlots((current) => [...current, createEmptySlot()]);
  }

  function removeSlot(slotId: string) {
    setSlots((current) => current.filter((slot) => slot.id !== slotId));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const payload: Array<{ user_id: string; hari: string; jam_mulai: string; jam_selesai: string }> = [];
    const invalidSlots = slots.filter(
      (slot) => slot.days.length === 0 || !slot.startTime || !slot.endTime,
    );

    if (invalidSlots.length > 0) {
      setMessage("Pilih hari, jam mulai, dan jam selesai untuk setiap slot.");
      return;
    }

    for (const slot of slots) {
      if (slot.startTime >= slot.endTime) {
        setMessage("Jam selesai harus lebih besar dari jam mulai.");
        return;
      }

      for (const day of slot.days) {
        payload.push({
          user_id: user.id,
          hari: day,
          jam_mulai: slot.startTime,
          jam_selesai: slot.endTime,
        });
      }
    }

    setSaving(true);

    const { data: inserted, error } = await supabase.from("free_time").insert(payload).select("*");

    setSaving(false);

    if (error) {
      setMessage("Gagal menyimpan waktu kosong.");
      return;
    }

    setItems((current) => [...(inserted ?? []), ...current]);
    setSlots([createEmptySlot()]);
    setMessage("Waktu kosong berhasil disimpan.");
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("free_time").delete().eq("id", id);

    if (error) {
      setMessage("Gagal menghapus slot.");
      return;
    }

    setItems((current) => current.filter((item) => item.id !== id));
    setMessage("Slot berhasil dihapus.");
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
            <h1 className="text-2xl font-bold text-[#1E2761]">Waktu Kosong</h1>
          </div>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[#028090]">
            <Clock3 size={18} />
            <h2 className="font-semibold">Tambah slot waktu kosong</h2>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Pilih hari yang tersedia, lalu tambahkan jam mulai dan selesai. Kamu bisa menambahkan beberapa slot.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            {slots.map((slot, index) => (
              <div key={slot.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#1E2761]">Slot {index + 1}</p>
                  {slots.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeSlot(slot.id)}
                      className="flex items-center gap-1 text-sm text-rose-600"
                    >
                      <Trash2 size={16} />
                      Hapus
                    </button>
                  ) : null}
                </div>

                <div className="mb-3">
                  <p className="mb-2 text-sm font-medium text-slate-700">Pilih hari</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {DAYS.map((day) => {
                      const checked = slot.days.includes(day.value);
                      return (
                        <label
                          key={day.value}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                            checked
                              ? "border-[#028090] bg-[#028090]/10 text-[#028090]"
                              : "border-slate-200 bg-white text-slate-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleDay(slot.id, day.value)}
                            className="h-4 w-4 rounded border-slate-300 text-[#028090] focus:ring-[#028090]"
                          />
                          <span>{day.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm text-slate-700">
                    <span className="mb-1 block font-medium">Jam mulai</span>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(event) => updateSlot(slot.id, { startTime: event.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-[#028090]"
                      required
                    />
                  </label>

                  <label className="text-sm text-slate-700">
                    <span className="mb-1 block font-medium">Jam selesai</span>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(event) => updateSlot(slot.id, { endTime: event.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#028090]"
                      required
                    />
                  </label>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addSlot}
              className="flex items-center gap-2 rounded-xl border border-dashed border-[#028090] px-3 py-2 text-sm font-medium text-[#028090]"
            >
              <Plus size={16} />
              Tambah slot lain
            </button>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-[#1E2761] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#17204f] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Menyimpan..." : "Simpan waktu kosong"}
            </button>
          </form>

          {message ? (
            <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600">{message}</p>
          ) : null}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#1E2761]">Daftar waktu kosong</h2>
            <span className="rounded-full bg-[#028090]/10 px-2.5 py-1 text-xs font-medium text-[#028090]">
              {items.length} slot
            </span>
          </div>

          {loading ? (
            <p className="mt-3 text-sm text-slate-500">Memuat data...</p>
          ) : items.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Belum ada waktu kosong yang tersimpan.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{item.hari}</p>
                    <p className="text-sm text-slate-500">
                      {item.jam_mulai} - {item.jam_selesai}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-full bg-rose-50 p-2 text-rose-600"
                    aria-label={`Hapus ${item.hari}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
