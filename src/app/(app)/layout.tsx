import { BottomNav } from "@/components/app/bottom-nav";

const appShellClassName =
  "mx-auto flex w-full max-w-lg flex-1 flex-col pb-24 sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <div className={appShellClassName}>{children}</div>
      <BottomNav />
    </div>
  );
}
