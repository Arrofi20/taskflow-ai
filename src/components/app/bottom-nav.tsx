"use client";

import {
  CalendarDays,
  CheckSquare,
  LayoutDashboard,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tugas", label: "Tugas", icon: CheckSquare },
  { href: "/jadwal", label: "Jadwal", icon: CalendarDays },
  { href: "/profil", label: "Profil", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 px-2 py-3 text-xs font-medium transition ${
                isActive
                  ? "text-[#028090]"
                  : "text-slate-500 hover:text-[#1E2761]"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${isActive ? "text-[#028090]" : "text-slate-400"}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
