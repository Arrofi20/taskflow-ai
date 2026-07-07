import { BottomNav } from "@/components/app/bottom-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col pb-24">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
