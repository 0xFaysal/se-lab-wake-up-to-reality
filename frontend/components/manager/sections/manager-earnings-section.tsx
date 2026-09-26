"use client";

import { useQuery } from "@tanstack/react-query";
import { Banknote, Loader2, TrendingUp, Wallet } from "lucide-react";
import { financeApi } from "@/lib/api/finance-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { queryKeys } from "@/lib/query-keys";

function paisaToTaka(paisa: string | undefined): string {
  if (!paisa) return "0.00";
  return (Number(paisa) / 100).toFixed(2);
}

export function ManagerEarningsSection() {
  const query = useQuery({
    queryKey: queryKeys.earnings.root,
    queryFn: financeApi.earnings,
  });

  if (query.isPending) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="size-4 animate-spin" />
        Loading earnings…
      </div>
    );
  }

  if (query.isError) {
    return (
      <p className="text-sm text-red-700">{getApiErrorMessage(query.error)}</p>
    );
  }

  const summary = query.data;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
        Earnings shown are provider-wide across all properties. Property-scoped
        earnings require direct Provider account access.
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Available Balance",
            value: `৳${paisaToTaka(summary?.availableBalancePaisa)}`,
            icon: Wallet,
            color: "text-emerald-700",
            bg: "bg-emerald-50",
          },
          {
            label: "Pending Settlement",
            value: `৳${paisaToTaka(summary?.pendingBalancePaisa)}`,
            icon: TrendingUp,
            color: "text-amber-700",
            bg: "bg-amber-50",
          },
          {
            label: "Unsettled Bookings",
            value: String(summary?.unsettledBookingCount ?? 0),
            icon: Banknote,
            color: "text-slate-600",
            bg: "bg-slate-50",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className={`flex items-center gap-3 rounded-xl border border-slate-200 p-4 ${bg}`}
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-white">
              <Icon className={`size-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className={`text-lg font-extrabold ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
