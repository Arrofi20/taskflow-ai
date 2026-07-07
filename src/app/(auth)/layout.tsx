import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-gradient-to-br from-[#1E2761] via-[#1a2254] to-[#028090]">
      <header className="px-6 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white transition-opacity hover:opacity-90"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-sm font-bold">
            TF
          </span>
          <span className="text-lg font-semibold tracking-tight">TaskFlow AI</span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
