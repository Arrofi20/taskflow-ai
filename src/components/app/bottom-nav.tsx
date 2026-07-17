"use client";

import {
  CalendarDays,
  CheckSquare,
  LayoutDashboard,
  Calendar,
  User,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

const PREMIUM_ROUTES = ["/kalender"];

const navConfig = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, gradient: "from-[#1E2761] to-[#028090]" },
  { href: "/tugas", label: "Tugas", icon: CheckSquare, gradient: "from-[#ff6b6b] to-[#ff8e8e]" },
  { href: "/jadwal", label: "Jadwal", icon: CalendarDays, gradient: "from-[#6bcb77] to-[#81ecec]" },
  { href: "/kalender", label: "Kalender", icon: Calendar, gradient: "from-[#a66cff] to-[#c084fc]" },
  { href: "/profil", label: "Profil", icon: User, gradient: "from-[#ffd93d] to-[#ffb5a7]" },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [urgentCount, setUrgentCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function loadPremium() {
      const { data: { session } } = await supabase.auth.getSession();
      const meta = session?.user.user_metadata;
      let premium = false;
      if (meta && typeof meta.is_premium === "boolean") {
        premium = meta.is_premium;
      } else if (meta && typeof meta.plan === "string") {
        premium = meta.plan.toLowerCase() === "premium";
      } else if (meta && typeof meta.subscription === "string") {
        premium = meta.subscription.toLowerCase() === "premium";
      }
      setIsPremium(premium);
    }

    async function loadUrgentTasks() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const now = new Date();
      const wibOffset = 7 * 60 * 60 * 1000;
      const nowWib = new Date(now.getTime() + wibOffset);
      const todayStr = nowWib.toISOString().slice(0, 10);
      const tomorrow = new Date(nowWib.getTime() + 24 * 60 * 60 * 1000);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);
      const { count } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id)
        .neq("status", "completed")
        .gte("deadline", `${todayStr}T00:00:00+07:00`)
        .lte("deadline", `${tomorrowStr}T23:59:59+07:00`);
      setUrgentCount(count ?? 0);
    }

    loadPremium();
    loadUrgentTasks();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  function handleNavClick(href: string) {
    const isPremiumRoute = PREMIUM_ROUTES.includes(href);
    if (isPremiumRoute && isPremium === false) {
      setToast("Fitur ini butuh Premium");
      setTimeout(() => router.push("/profil/subscription"), 800);
      return;
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    router.push(href);
  }

  return (
    <>
      {toast && (
        <div className="fixed left-1/2 top-20 z-[60] -translate-x-1/2 animate-fade-in">
          <div className="rounded-2xl bg-[#1E2761] px-5 py-3 text-sm font-medium text-white shadow-lg shadow-[#1E2761]/20">
            {toast}
          </div>
        </div>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#1E2761]/6 bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-lg items-stretch justify-around px-1 sm:max-w-2xl sm:px-4 lg:max-w-5xl xl:max-w-6xl">
          {navConfig.map(({ href, label, icon: Icon, gradient }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <button
                key={href}
                type="button"
                onClick={() => handleNavClick(href)}
                className={`relative flex min-w-0 flex-1 touch-manipulation flex-col items-center gap-0.5 px-1 py-2.5 text-[11px] font-medium transition-all duration-300 active:scale-90 sm:gap-1 sm:px-3 sm:py-3 sm:text-xs ${
                  isActive
                    ? "text-white"
                    : "text-slate-400 hover:text-[#1E2761]"
                }`}
              >
                <div className={`relative rounded-xl p-2 transition-all duration-300 ${isActive ? `bg-gradient-to-br ${gradient} shadow-md` : ""}`}>
                  <Icon
                    className={`h-5 w-5 transition-all duration-300 sm:h-6 sm:w-6 ${isActive ? "text-white scale-110 drop-shadow-sm" : "text-slate-400"}`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {urgentCount > 0 && href === "/tugas" && (
                    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-br from-[#ff6b6b] to-[#ff8e8e] px-1 text-[10px] font-bold text-white shadow-sm shadow-[#ff6b6b]/30">
                      {urgentCount > 9 ? "9+" : urgentCount}
                    </span>
                  )}
                  {href === "/kalender" && isPremium === false && (
                    <span className="absolute -right-1.5 -top-1 rounded bg-gradient-to-br from-[#1E2761] to-[#028090] px-1 text-[8px] font-bold text-white shadow-sm">
                      PREM
                    </span>
                  )}
                </div>
                <span className={`truncate transition-all ${isActive ? "font-semibold text-[#1E2761]" : ""}`}>{label}</span>
                {isActive && (
                  <span className={`absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gradient-to-r ${gradient}`} />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
