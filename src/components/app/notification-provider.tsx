"use client";

import { useDeadlineAlerts } from "@/hooks/use-deadline-alerts";

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useDeadlineAlerts();

  return <>{children}</>;
}
