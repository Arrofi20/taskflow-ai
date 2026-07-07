import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Masuk | TaskFlow AI",
  description: "Masuk ke akun TaskFlow AI Anda",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="rounded-2xl bg-white p-8 text-center text-slate-600">Memuat...</div>}>
      <LoginForm />
    </Suspense>
  );
}
