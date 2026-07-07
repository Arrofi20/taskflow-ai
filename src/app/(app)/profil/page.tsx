import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const fullName =
    (data.user.user_metadata?.full_name as string | undefined) ??
    "Pengguna";

  return (
    <main className="px-4 py-6">
      <h1 className="text-2xl font-bold text-[#1E2761]">Profil</h1>
      <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Nama</p>
        <p className="mt-1 font-medium text-slate-900">{fullName}</p>
        <p className="mt-4 text-sm text-slate-500">Email</p>
        <p className="mt-1 font-medium text-slate-900">{data.user.email}</p>
      </div>
    </main>
  );
}
