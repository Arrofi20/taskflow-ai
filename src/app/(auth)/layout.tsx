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
          <img
            src="/logo.png"
            alt="TaskFlow AI"
            className="h-9 w-9 rounded-lg shadow-sm"
          />
          <span className="text-lg font-semibold tracking-tight">TaskFlow AI</span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
