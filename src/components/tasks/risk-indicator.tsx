import { Flame, AlertTriangle } from "lucide-react";

export function RiskIndicator({ risk }: { risk: number | null }) {
  if (risk == null) return null;

  if (risk > 70) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
        <Flame className="h-3 w-3" />
        {risk}% risiko telat
      </span>
    );
  }

  if (risk > 40) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
        <AlertTriangle className="h-3 w-3" />
        {risk}% risiko telat
      </span>
    );
  }

  return null;
}
