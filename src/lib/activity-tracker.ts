const STORAGE_KEY = "tf_activity_log";
const BATCH_SIZE = 20;

export type ActivityLog = { hour: number; ts: number };

function getLocalLogs(): ActivityLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ActivityLog[]) : [];
  } catch {
    return [];
  }
}

function setLocalLogs(logs: ActivityLog[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(-500)));
}

export function logActivity() {
  const now = new Date();
  const hour = now.getHours();
  const logs = getLocalLogs();
  logs.push({ hour, ts: now.getTime() });
  setLocalLogs(logs);

  // Sync batch ke server jika sudah cukup banyak
  if (logs.length >= BATCH_SIZE) {
    syncToServer(logs).catch(() => {});
  }
}

export function getProductiveHours(): number[] {
  const logs = getLocalLogs();
  const hourCounts = new Map<number, number>();
  for (const entry of logs) {
    hourCounts.set(entry.hour, (hourCounts.get(entry.hour) ?? 0) + 1);
  }
  const sorted = Array.from(hourCounts.entries()).sort((a, b) => b[1] - a[1]);
  // Ambil top 3 jam paling sering
  return sorted.slice(0, 3).map(([hour]) => hour);
}

export function getProductiveHoursLabel(): string {
  const hours = getProductiveHours();
  if (hours.length === 0) return "Belum ada data";
  return hours
    .map((h) => `${String(h).padStart(2, "0")}:00`)
    .join(", ");
}

export async function syncToServer(logs?: ActivityLog[]) {
  if (typeof window === "undefined") return;
  const logsToSync = logs ?? getLocalLogs();
  if (logsToSync.length === 0) return;
  try {
    const res = await fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logs: logsToSync.map((l) => ({ hour: l.hour })) }),
    });
    if (res.ok) {
      // Kosongkan localStorage setelah sync sukses
      const remaining = getLocalLogs().slice(-BATCH_SIZE + 1);
      setLocalLogs(remaining);
    }
  } catch {
    // Abaikan error network
  }
}
