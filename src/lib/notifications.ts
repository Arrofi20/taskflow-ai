"use client";

const VAPID_PUBLIC_KEY =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    ? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    : "";

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function showLocalNotification(title: string, options?: NotificationOptions) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, {
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      ...options,
    });
  }
}

export async function subscribePush(): Promise<PushSubscription | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  if (!VAPID_PUBLIC_KEY) {
    console.warn("VAPID public key not set");
    return null;
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
  });
  return subscription;
}

export async function unsubscribePush(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    await existing.unsubscribe();
    return true;
  }
  return false;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function checkDeadlinesAndNotify(tasks: { nama_tugas: string; deadline: string; status: string }[]) {
  if (typeof window === "undefined") return;
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const urgent = tasks.filter((t) => {
    if (t.status === "completed") return false;
    const d = new Date(t.deadline);
    return d > now && d <= tomorrow;
  });

  if (urgent.length > 0) {
    showLocalNotification(
      `AI Deadline Alert: ${urgent.length} tugas mendekati deadline`,
      {
        body: urgent.map((t) => t.nama_tugas).join(", "),
        tag: "deadline-alert",
      },
    );
  }
}

export function sendDailyReminder() {
  showLocalNotification("Daily Reminder - TaskFlow AI", {
    body: "Jangan lupa cek jadwal belajar dan tugas hari ini!",
    tag: "daily-reminder",
  });
}
