import type { LucideIcon } from "lucide-react";
import { formatBDTFromPaisa } from "@/lib/formatters";

export function AdminFinanceMetric({ icon: Icon, label, value, detail, tone = "emerald", format = "money" }: {
  icon: LucideIcon;
  label: string;
  value: number;
  detail: string;
  tone?: "emerald" | "amber" | "blue" | "slate";
  format?: "money" | "count";
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-800",
    amber: "bg-amber-50 text-amber-800",
    blue: "bg-blue-50 text-blue-800",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <article className="border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-xs font-semibold text-slate-500">{label}</p><strong className="mt-2 block text-2xl">{format === "count" ? value.toLocaleString("en-BD") : formatBDTFromPaisa(value)}</strong></div>
        <span className={`flex size-9 shrink-0 items-center justify-center ${tones[tone]}`}><Icon className="size-4" /></span>
      </div>
      <p className="mt-3 text-xs text-slate-500">{detail}</p>
    </article>
  );
}
