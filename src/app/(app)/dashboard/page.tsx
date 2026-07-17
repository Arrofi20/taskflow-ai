import { redirect } from "next/navigation";

import { AlertBanner } from "@/components/dashboard/alert-banner";
import { PriorityTasks } from "@/components/dashboard/priority-tasks";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TodaySchedule } from "@/components/dashboard/today-schedule";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/supabase/queries/dashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect("/login");
  }

  const fallbackName =
    (authData.user.user_metadata?.full_name as string | undefined) ??
    authData.user.email;

  const dashboard = await getDashboardData(
    supabase,
    authData.user.id,
    fallbackName,
  );

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: activityLogs } = await supabase
    .from("user_activity_logs")
    .select("active_at")
    .eq("user_id", authData.user.id)
    .gte("active_at", oneWeekAgo);

  const hourCounts = new Map<number, number>();
  (activityLogs ?? []).forEach((log) => {
    const hour = new Date(log.active_at).getHours();
    if (hour >= 6 && hour <= 23) {
      hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
    }
  });
  const productiveHours = Array.from(hourCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => hour);

  return (
    <>
      <header className="gradient-bright-primary relative overflow-hidden px-5 pb-10 pt-6 text-white sm:px-8 sm:pb-12 sm:pt-8 lg:rounded-b-3xl">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/6 animate-float" />
        <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-white/6" style={{ animationDelay: "1s" }} />
        <div className="absolute right-1/4 top-1/3 h-16 w-16 rounded-full bg-white/5 animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute -left-4 top-1/2 h-24 w-24 rounded-full bg-white/4" style={{ animationDelay: "0.5s" }} />

        <div className="relative">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="TaskFlow AI"
              className="h-9 w-9 rounded-lg shadow-sm sm:h-10 sm:w-10"
            />
            <span className="text-lg font-semibold sm:text-xl">TaskFlow AI</span>
          </div>
          <h1 className="mt-6 text-2xl font-bold leading-tight sm:mt-8 sm:text-3xl lg:text-4xl">
            Halo, {dashboard.fullName}!
          </h1>
          <p className="mt-1 text-sm text-white/80 sm:mt-2 sm:text-base">
            Ringkasan tugas dan jadwal belajar Anda hari ini
          </p>
          {productiveHours.length > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#6bcb77]" />
              Jam Produktifmu: {productiveHours.map((h) => `${String(h).padStart(2, "0")}.00`).join(", ")}
            </div>
          )}
        </div>
      </header>

      <main className="-mt-5 space-y-5 px-4 sm:space-y-6 sm:px-8 lg:space-y-8">
        <SummaryCards
          totalTasks={dashboard.summary.totalTasks}
          tasksToday={dashboard.summary.tasksToday}
          approachingDeadline={dashboard.summary.approachingDeadline}
        />
        <AlertBanner />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
          <PriorityTasks tasks={dashboard.priorityTasks} />
          <TodaySchedule
            schedules={dashboard.todaySchedule}
            analisisGayaBelajar={dashboard.analisisGayaBelajar}
            rekomendasiUmum={dashboard.rekomendasiUmum}
          />
        </div>
      </main>
    </>
  );
}
