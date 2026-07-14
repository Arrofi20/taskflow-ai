"use client";

import { useDeadlineAlerts } from "@/hooks/use-deadline-alerts";
import { useStreak } from "@/hooks/use-streak";

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useDeadlineAlerts();
  useStreak(); // initialize streak tracking on app open

  return <>{children}</>;
}
