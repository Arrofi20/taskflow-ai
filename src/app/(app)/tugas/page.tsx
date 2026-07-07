import { redirect } from "next/navigation";

import { TaskList } from "@/components/tasks/task-list";
import type { TaskStatus, TaskType } from "@/lib/supabase/database.types";
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
      "id,user_id,nama_tugas,jenis_tugas,deadline,estimasi_waktu,prioritas,tingkat_kesulitan,status",
    )
    .eq("user_id", authData.user.id);

  if (error) {
    console.error("Failed to load tasks", error);
  }

  const normalizedTasks = (tasks ?? [])
    .filter((task) => {
      const taskUserId = (task as { user_id?: unknown }).user_id;

      if (typeof taskUserId === "string") {
        return taskUserId === authData.user.id;
      }

      return true;
    })
    .filter((task) => {
      const taskStatus = (task as { status?: unknown }).status;

      if (typeof taskStatus === "string") {
        return taskStatus !== "completed";
      }

      return true;
    })
    .map((task) => {
      const record = task as Record<string, unknown>;

      const taskTitle =
        typeof record.nama_tugas === "string"
          ? record.nama_tugas
          : "Tugas";
      const taskDeadline =
        typeof record.deadline === "string" ? record.deadline : null;
      const taskStatusValue =
        typeof record.status === "string" &&
        ["pending", "in_progress", "completed"].includes(record.status)
          ? (record.status as TaskStatus)
          : "pending";
      const taskPriority =
        typeof record.prioritas === "number" ? record.prioritas : null;
      const taskDifficulty =
        typeof record.tingkat_kesulitan === "string"
          ? record.tingkat_kesulitan
          : null;
      const taskEstimatedHours =
        typeof record.estimasi_waktu === "number"
          ? record.estimasi_waktu
          : null;
      const taskType =
        typeof record.jenis_tugas === "string" &&
        ["tugas", "ujian", "proyek", "presentasi"].includes(
          record.jenis_tugas,
        )
          ? (record.jenis_tugas as TaskType)
          : "tugas";

      return {
        id: String(record.id ?? ""),
        title: taskTitle,
        task_type: taskType,
        due_date: taskDeadline,
        estimated_hours: taskEstimatedHours,
        prioritas: taskPriority,
        tingkat_kesulitan: taskDifficulty,
        status: taskStatusValue,
      };
    });

  return (
    <TaskList
      initialTasks={normalizedTasks}
      fetchError={error ? "Gagal memuat daftar tugas." : null}
    />
  );
}
