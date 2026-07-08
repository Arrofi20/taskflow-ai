"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import {
  getAuthErrorMessage,
  getSiteUrl,
  normalizeEmail,
  validateEmail,
  validateFullName,
  validatePassword,
} from "@/lib/auth/validation";

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const fullNameError = validateFullName(fullName);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (fullNameError || emailError || passwordError) {
      setFieldErrors({
        fullName: fullNameError ?? undefined,
        email: emailError ?? undefined,
        password: passwordError ?? undefined,
      });
      return;
    }

    setFieldErrors({});
    setIsLoading(true);

    try {
      const supabase = createClient();
      const submittedEmail = normalizeEmail(email);
      const trimmedFullName = fullName.trim();

      console.log("Register email input:", submittedEmail);

      const { data, error } = await supabase.auth.signUp({
        email: submittedEmail,
        password,
        options: {
          data: {
            full_name: trimmedFullName,
          },
          emailRedirectTo: `${getSiteUrl()}/login`,
        },
      });

      if (error) {
        console.error("Supabase signUp error:", error);
        setFormError(getAuthErrorMessage(error.message));
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      setSuccessMessage(
        "Registrasi berhasil! Periksa email Anda untuk verifikasi akun, lalu login.",
      );
    } catch {
      setFormError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-xl shadow-black/10 sm:p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-[#1E2761]">Daftar</h1>
        <p className="mt-2 text-sm text-slate-600">
          Buat akun TaskFlow AI gratis
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

        {successMessage && (
          <div
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            {successMessage}
          </div>
        )}

        <div>
          <label
            htmlFor="fullName"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Nama Lengkap
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-[#028090] focus:ring-2 focus:ring-[#028090]/20"
            placeholder="John Doe"
            aria-invalid={Boolean(fieldErrors.fullName)}
            aria-describedby={
              fieldErrors.fullName ? "fullName-error" : undefined
            }
          />
          {fieldErrors.fullName && (
            <p id="fullName-error" className="mt-1.5 text-sm text-red-600">
              {fieldErrors.fullName}
            </p>
          )}
        </div>

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
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-[#028090] focus:ring-2 focus:ring-[#028090]/20"
            placeholder="Minimal 6 karakter"
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
          {isLoading ? "Memproses..." : "Daftar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#028090] hover:text-[#1E2761]"
        >
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
