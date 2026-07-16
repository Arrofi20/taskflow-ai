"use client";

import { useEffect } from "react";

import { logActivity } from "@/lib/activity-tracker";

export function ActivityTracker() {
  useEffect(() => {
    // Catat aktivitas saat aplikasi dibuka
    logActivity();

    // Catat setiap 10 menit selama tab aktif
    const interval = setInterval(() => {
      if (!document.hidden) {
        logActivity();
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
