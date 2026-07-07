"use client";

import { AlertTriangle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export function AlertBanner() {
  const [alerts, setAlerts] = useState<Array<{ title: string; message: string; severity?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignored = false;

    async function loadAlerts() {
      try {
        const response = await fetch("/api/ai/alert", { method: "POST" });
        const data = await response.json();
        if (!ignored && data?.success) {
          setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
        }
      } finally {
        if (!ignored) {
          setLoading(false);
        }
      }
    }

    loadAlerts();
    return () => {
      ignored = true;
    };
  }, []);

  if (loading || alerts.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-amber-100 p-2 text-amber-700">
          <AlertTriangle size={18} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-amber-800">Peringatan personal</p>
            <Sparkles size={14} className="text-[#028090]" />
          </div>
          <div className="mt-2 space-y-2">
            {alerts.map((alert, index) => (
              <div key={`${alert.title}-${index}`} className="rounded-2xl bg-white/70 p-3">
                <p className="text-sm font-semibold text-[#1E2761]">{alert.title}</p>
                <p className="mt-1 text-sm text-slate-700">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
