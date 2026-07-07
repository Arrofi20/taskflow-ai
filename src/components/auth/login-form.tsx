"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { isSafeRedirect } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/client";
import {
  getAuthErrorMessage,
  validateEmail,
  validatePassword,
} from "@/lib/auth/validation";

type LoginFormProps = {
  redirectTo?: string | null;
};

export function LoginForm({ redirectTo = null }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setFieldErrors({
        email: emailError ?? undefined,
        password: passwordError ?? undefined,
      });
      return;
    }

    setFieldErrors({});
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setFormError(getAuthErrorMessage(error.message));
        return;
      }

      router.push(isSafeRedirect(redirectTo));
      router.refresh();
    } catch {
      setFormError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-xl shadow-black/10 sm:p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-[#1E2761]">Masuk</h1>
        <p className="mt-2 text-sm text-slate-600">
          Kelola tugas Anda dengan TaskFlow AI
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {formError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {formError}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-[#028090] focus:ring-2 focus:ring-[#028090]/20"
            placeholder="nama@gmail.com"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
          />
          {fieldErrors.email && (
            <p id="email-error" className="mt-1.5 text-sm text-red-600">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-[#028090] focus:ring-2 focus:ring-[#028090]/20"
            placeholder="••••••••"
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={
              fieldErrors.password ? "password-error" : undefined
            }
          />
          {fieldErrors.password && (
            <p id="password-error" className="mt-1.5 text-sm text-red-600">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-[#1E2761] px-4 py-3.5 text-base font-semibold text-white transition hover:bg-[#028090] focus:outline-none focus:ring-2 focus:ring-[#028090]/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Memproses..." : "Masuk"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="font-semibold text-[#028090] hover:text-[#1E2761]"
        >
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}
