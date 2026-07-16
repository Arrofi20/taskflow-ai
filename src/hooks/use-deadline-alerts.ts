"use client";

import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";
import { checkDeadlinesAndNotify, requestNotificationPermission } from "@/lib/notifications";

export function useDeadlineAlerts() {
  useEffect(() => {
    const supabase = createClient();

    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const permission = await requestNotificationPermission();
      if (permission !== "granted") return;

      // Panggil API alert AI untuk update risk percentage di DB
      try {
        await fetch("/api/ai/alert", { method: "POST" });
      } catch {
        // Abaikan jika API gagal
      }

      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const { data: tasks } = await supabase
        .from("tasks")
        .select("nama_tugas,deadline,status")
        .eq("user_id", session.user.id)
        .neq("status", "completed")
        .gte("deadline", now.toISOString())
        .lte("deadline", tomorrow.toISOString());

      if (tasks && tasks.length > 0) {
        checkDeadlinesAndNotify(tasks as { nama_tugas: string; deadline: string; status: string }[]);
      }
    }

    check();

    // Cek setiap 30 menit
    const interval = setInterval(check, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
}
