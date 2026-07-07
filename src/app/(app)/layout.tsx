import { redirect } from "next/navigation";

import { BottomNav } from "@/components/app/bottom-nav";
import { createClient } from "@/lib/supabase/server";

const appShellClassName =
  "mx-auto flex w-full max-w-lg flex-1 flex-col pb-24 sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl";

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
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <div className={appShellClassName}>{children}</div>
      <BottomNav />
    </div>
  );
}
