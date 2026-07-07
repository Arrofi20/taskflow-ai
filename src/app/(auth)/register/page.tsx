import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Daftar | TaskFlow AI",
  description: "Buat akun TaskFlow AI baru",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
