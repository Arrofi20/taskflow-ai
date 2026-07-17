import { redirect } from "next/navigation";

import { ActivityTracker } from "@/components/app/activity-tracker";
import { BottomNav } from "@/components/app/bottom-nav";
import { NotificationProvider } from "@/components/app/notification-provider";
import { createClient } from "@/lib/supabase/server";

const appShellClassName =
  "mx-auto flex w-full max-w-lg flex-1 flex-col pb-28 sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return (
    <NotificationProvider>
      <div className="flex min-h-full flex-1 flex-col">
        <ActivityTracker />
        <div className={appShellClassName}>{children}</div>
        <BottomNav />
      </div>
    </NotificationProvider>
  );
}
