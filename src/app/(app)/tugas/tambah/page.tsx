import type { Metadata } from "next";

import { AddTaskForm } from "@/components/tasks/add-task-form";

export const metadata: Metadata = {
  title: "Tambah Tugas | TaskFlow AI",
  description: "Tambahkan tugas baru ke TaskFlow AI",
};

export default function TambahTugasPage() {
  return <AddTaskForm />;
}
