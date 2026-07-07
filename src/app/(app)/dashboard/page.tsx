import { redirect } from "next/navigation";

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

  return (
    <>
      <header className="bg-gradient-to-br from-[#1E2761] to-[#028090] px-5 pb-8 pt-6 text-white">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-sm font-bold">
            TF
          </span>
          <span className="text-lg font-semibold">TaskFlow AI</span>
        </div>
        <h1 className="mt-6 text-2xl font-bold leading-tight">
          Halo, {dashboard.fullName}!
        </h1>
        <p className="mt-1 text-sm text-white/80">
          Ringkasan tugas dan jadwal belajar Anda hari ini
        </p>
      </header>

      <main className="space-y-5 px-4 -mt-4">
        <SummaryCards
          totalTasks={dashboard.summary.totalTasks}
          tasksToday={dashboard.summary.tasksToday}
          approachingDeadline={dashboard.summary.approachingDeadline}
        />

        <PriorityTasks tasks={dashboard.priorityTasks} />
        <TodaySchedule schedules={dashboard.todaySchedule} />
      </main>
    </>
  );
}
