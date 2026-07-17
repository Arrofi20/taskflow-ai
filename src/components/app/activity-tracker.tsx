"use client";

import { useEffect } from "react";

import { logActivity, syncToServer } from "@/lib/activity-tracker";

export function ActivityTracker() {
  useEffect(() => {
    // Catat aktivitas saat aplikasi dibuka
    logActivity();

    // Catat setiap 5 menit selama tab aktif
    const interval = setInterval(() => {
      if (!document.hidden) {
        logActivity();
      }
    }, 5 * 60 * 1000);

    // Sync ke server setiap 2 menit (di luar batch)
    const syncInterval = setInterval(() => {
      if (!document.hidden) {
        syncToServer();
      }
    }, 2 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
    };
  }, []);

  return null;
}
