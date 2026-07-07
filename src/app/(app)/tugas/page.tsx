import { redirect } from "next/navigation";

import { TaskList } from "@/components/tasks/task-list";
import { createClient } from "@/lib/supabase/server";

export default async function TugasPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect("/login");
  }

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select(
      "id, title, task_type, due_date, estimated_hours, prioritas, tingkat_kesulitan, status",
    )
    .eq("user_id", authData.user.id)
    .neq("status", "completed")
    .order("prioritas", { ascending: true, nullsFirst: false })
    .order("due_date", { ascending: true, nullsFirst: false });

  return (
    <TaskList
      initialTasks={tasks ?? []}
      fetchError={
        error
          ? "Gagal memuat daftar tugas. Pastikan migration database sudah dijalankan."
          : null
      }
    />
  );
}
