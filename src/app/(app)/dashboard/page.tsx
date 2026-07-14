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

  // Ambil streak user
  const { data: streakData } = await supabase
    .from("user_streaks")
    .select("current_streak")
    .eq("user_id", authData.user.id)
    .single();

  const streak = streakData?.current_streak ?? 0;

  return (
    <>
      <header className="bg-gradient-to-br from-[#1E2761] to-[#028090] px-5 pb-8 pt-6 text-white sm:px-8 sm:pb-10 sm:pt-8 lg:rounded-b-3xl">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-sm font-bold sm:h-10 sm:w-10">
              TF
            </span>
            <span className="text-lg font-semibold sm:text-xl">TaskFlow AI</span>
          </div>
          <h1 className="mt-6 text-2xl font-bold leading-tight sm:mt-8 sm:text-3xl lg:text-4xl">
            Halo, {dashboard.fullName}!
          </h1>
          <p className="mt-1 text-sm text-white/80 sm:mt-2 sm:text-base">
            Ringkasan tugas dan jadwal belajar Anda hari ini
          </p>
        </header>

        <main className="-mt-4 space-y-5 px-4 sm:space-y-6 sm:px-8 lg:space-y-8">
          <AlertBanner />

          <SummaryCards
            totalTasks={dashboard.summary.totalTasks}
            tasksToday={dashboard.summary.tasksToday}
            approachingDeadline={dashboard.summary.approachingDeadline}
            streak={streak}
          />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
            <PriorityTasks tasks={dashboard.priorityTasks} />
            <TodaySchedule schedules={dashboard.todaySchedule} />
          </div>
      </main>
    </>
  );
}
