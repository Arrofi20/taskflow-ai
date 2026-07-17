"use client";

import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  CalendarDays,
  Sparkles,
  CreditCard,
  LogIn,
  RefreshCw,
  Activity,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type ActivityItem = {
  id: string;
  action: string;
  category: string;
  detail: Record<string, unknown> | null;
  created_at: string;
};

const categories = [
  { value: "all", label: "Semua" },
  { value: "task", label: "Tugas", icon: CheckCircle2 },
  { value: "schedule", label: "Jadwal", icon: CalendarDays },
  { value: "ai", label: "AI", icon: Sparkles },
  { value: "premium", label: "Premium", icon: CreditCard },
  { value: "auth", label: "Akun", icon: LogIn },
  { value: "google", label: "Google", icon: RefreshCw },
  { value: "other", label: "Lainnya", icon: Activity },
];

function getCategoryIcon(category: string) {
  switch (category) {
    case "task": return <CheckCircle2 size={14} />;
    case "schedule": return <CalendarDays size={14} />;
    case "ai": return <Sparkles size={14} />;
    case "premium": return <CreditCard size={14} />;
    case "auth": return <LogIn size={14} />;
    case "google": return <RefreshCw size={14} />;
    default: return <Activity size={14} />;
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case "task":
      return "bg-blue-100 text-blue-700";
    case "schedule":
      return "bg-amber-100 text-amber-700";
    case "ai":
      return "bg-purple-100 text-purple-700";
    case "premium":
      return "bg-emerald-100 text-emerald-700";
    case "auth":
      return "bg-slate-100 text-slate-700";
    case "google":
      return "bg-sky-100 text-sky-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function formatDetail(detail: Record<string, unknown> | null): string | null {
  if (!detail) return null;
  const parts: string[] = [];
  if (typeof detail.task_name === "string") parts.push(detail.task_name);
  if (typeof detail.title === "string") parts.push(detail.title);
  if (typeof detail.schedule_count === "number") parts.push(`${detail.schedule_count} jadwal`);
  if (typeof detail.synced === "number") parts.push(`${detail.synced} item`);
  if (typeof detail.risk === "number") parts.push(`risiko ${detail.risk}%`);
  if (typeof detail.from === "string" && typeof detail.to === "string") {
    parts.push(`${detail.from} → ${detail.to}`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export default function RiwayatPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(0);
  const limit = 20;

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      const params = new URLSearchParams({
        category,
        limit: String(limit),
        offset: String(page * limit),
      });

      const res = await fetch(`/api/activity/history?${params}`);
      const data = await res.json();

      if (mounted && data.success) {
        setActivities(data.activities);
        setTotal(data.total);
        setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [category, page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-800">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/profil"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1E2761] shadow-sm"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-sm font-medium text-[#028090]">Profil</p>
            <h1 className="text-2xl font-bold text-[#1E2761]">Riwayat Aktivitas</h1>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => {
                setCategory(cat.value);
                setPage(0);
              }}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                category === cat.value
                  ? "bg-[#1E2761] text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Activity list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-[#028090]" />
          </div>
        ) : activities.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
            <Activity size={48} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">Belum ada aktivitas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${getCategoryColor(
                      activity.category,
                    )}`}
                  >
                    {getCategoryIcon(activity.category)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {activity.action}
                    </p>
                    {formatDetail(activity.detail) && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatDetail(activity.detail)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock size={10} />
                    {format(parseISO(activity.created_at), "d MMM, HH:mm", {
                      locale: localeId,
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-slate-500">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
