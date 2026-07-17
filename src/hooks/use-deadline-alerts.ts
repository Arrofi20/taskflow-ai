"use client";

import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useDeadlineAlerts() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !VAPID_PUBLIC_KEY) return;

    let ignored = false;

    async function subscribe() {
      try {
        if (Notification.permission !== "granted") return;

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || ignored) return;

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        const sub = subscription.toJSON();
        if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return;

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: sub.endpoint,
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
          }),
        });
      } catch {
        // Silent fail — push subscription is best-effort
      }
    }

    subscribe();

    return () => {
      ignored = true;
    };
  }, []);
}
