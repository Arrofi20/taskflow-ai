"use client";

import {
  CalendarDays,
  CheckSquare,
  LayoutDashboard,
  Calendar,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [urgentCount, setUrgentCount] = useState(0);

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
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const { count } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id)
        .neq("status", "completed")
        .gte("deadline", now.toISOString())
        .lte("deadline", tomorrow.toISOString());
      setUrgentCount(count ?? 0);
    }

    loadPremium();
    loadUrgentTasks();
  }, []);

  const navItems: { href: string; label: string; icon: React.ElementType; badge?: number; proBadge?: boolean }[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tugas", label: "Tugas", icon: CheckSquare, badge: urgentCount > 0 ? urgentCount : undefined },
    { href: "/jadwal", label: "Jadwal", icon: CalendarDays },
    { href: "/kalender", label: "Kalender", icon: Calendar, proBadge: isPremium === false },
    { href: "/profil", label: "Profil", icon: User },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex w-full max-w-lg items-stretch justify-around px-2 sm:max-w-2xl sm:px-4 lg:max-w-5xl xl:max-w-6xl">
        {navItems.map(({ href, label, icon: Icon, badge, proBadge }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);

          const handleClick = (e: React.MouseEvent) => {
            if (href === "/kalender" && isPremium === false) {
              e.preventDefault();
              router.push("/profil/subscription");
            }
          };

          return (
            <Link
              key={href}
              href={href}
              onClick={handleClick}
              className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 px-2 py-3 text-xs font-medium transition ${
                isActive
                  ? "text-[#028090]"
                  : "text-slate-500 hover:text-[#1E2761]"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`h-5 w-5 ${isActive ? "text-[#028090]" : "text-slate-400"}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {badge != null && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
                {proBadge && (
                  <span className="absolute -right-5 -top-2 rounded bg-[#1E2761] px-1 text-[8px] font-bold text-white">
                    PRO
                  </span>
                )}
              </div>
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
