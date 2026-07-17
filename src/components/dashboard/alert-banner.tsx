"use client";

import { AlertTriangle, Flame, Info, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export function AlertBanner() {
  const [alerts, setAlerts] = useState<Array<{ title: string; message: string; severity?: string }> | null>(null);

  useEffect(() => {
    let ignored = false;

    async function loadAlerts() {
      try {
        const response = await fetch("/api/ai/alert", { method: "POST" });
        const data = await response.json();
        if (!ignored && data?.success) {
          setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
        } else if (!ignored) {
          setAlerts([]);
        }
      } catch {
        if (!ignored) setAlerts([]);
      }
    }

    loadAlerts();
    return () => { ignored = true; };
  }, []);

  if (!alerts || alerts.length === 0) return null;

  function getSeverityIcon(severity?: string) {
    if (severity === "high") return <Flame size={16} className="text-red-500" />;
    if (severity === "medium") return <AlertTriangle size={16} className="text-amber-500" />;
    return <Info size={16} className="text-blue-500" />;
  }

  function getSeverityColor(severity?: string) {
    if (severity === "high") return "from-[#ff6b6b] to-[#ff8e8e]";
    if (severity === "medium") return "from-amber-400 to-amber-500";
    return "from-blue-400 to-blue-500";
  }

  return (
    <section className="animate-pop-in rounded-2xl bg-gradient-to-r from-[#fff0ee] via-[#fff5f5] to-[#fff0ee] p-4 shadow-md shadow-[#ff6b6b]/10">
      <div className="flex items-start gap-3">
        <div className={`rounded-xl bg-gradient-to-br ${getSeverityColor(alerts[0]?.severity)} p-2 text-white shadow-sm`}>
          {getSeverityIcon(alerts[0]?.severity)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[#cc4444]">Prediksi Risiko AI</p>
            <Sparkles size={14} className="text-[#028090]" />
          </div>
          <div className="mt-2 space-y-2">
            {alerts.map((alert, index) => (
              <div key={`${alert.title}-${index}`} className="rounded-xl bg-white/85 p-3 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  {getSeverityIcon(alert.severity)}
                  <p className="text-sm font-semibold text-[#1E2761]">{alert.title}</p>
                </div>
                <p className="mt-1 text-sm text-slate-600">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
