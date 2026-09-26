"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CalendarCheck,
  CircleDollarSign,
  Layers,
  Loader2,
  Lock,
  Tag,
  TrendingUp,
} from "lucide-react";
import { parkingResourcesApi } from "@/lib/api/parking-resources-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { queryKeys } from "@/lib/query-keys";

function formatPaisaToTaka(paisa: number | string): string {
  return "৳" + (Number(paisa) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

interface ManagerReportsSectionProps {
  propertyId: string;
  canEarnings: boolean;
}

export function ManagerReportsSection({
  propertyId,
  canEarnings,
}: ManagerReportsSectionProps) {
  const reportsQuery = useQuery({
    queryKey: [...queryKeys.properties.all(), propertyId, "reports"],
    queryFn: () => parkingResourcesApi.reports(propertyId),
  });

  if (reportsQuery.isPending) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
        <Loader2 className="size-4 animate-spin text-emerald-700" />
        Aggregating operational reports…
      </div>
    );
  }

  if (reportsQuery.isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-800">
        <AlertCircle className="size-4 inline mr-1 text-red-600" />
        Failed to load reports: {getApiErrorMessage(reportsQuery.error)}
      </div>
    );
  }

  const data = reportsQuery.data;
  const metrics = data?.metrics ?? {};
  const financial = data?.financial;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Operational Performance</h3>
          <p className="text-xs text-slate-500">
            Real-time aggregated activity for this delegated property workspace.
          </p>
        </div>
        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          Live Data
        </span>
      </div>

      {/* Operational Metrics Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Resources</span>
            <Layers className="size-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {metrics.totalResources ?? 0}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Total parking spaces / pools</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Listings</span>
            <Tag className="size-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-700">
            {metrics.activeListings ?? 0}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            of {metrics.totalListings ?? 0} total listings
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Bookings</span>
            <CalendarCheck className="size-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {metrics.totalBookings ?? 0}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {metrics.activeBookings ?? 0} currently active
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Completed Bookings</span>
            <TrendingUp className="size-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {metrics.completedBookings ?? 0}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {metrics.cancelledBookings ?? 0} cancelled
          </p>
        </div>
      </div>

      {/* Financial Section (Only if canEarnings is true) */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="size-4 text-emerald-700" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Financial Overview
            </h4>
          </div>
          {!canEarnings && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <Lock className="size-3" /> EARNINGS_VIEW required
            </span>
          )}
        </div>

        {canEarnings && financial ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-1">
            <div className="rounded-lg bg-emerald-50/60 border border-emerald-100 p-3.5">
              <span className="text-xs font-medium text-emerald-800">Total Settled Earnings</span>
              <p className="mt-1 text-xl font-extrabold text-emerald-900">
                {formatPaisaToTaka(financial.totalEarningsPaisa ?? 0)}
              </p>
              <p className="text-[10px] text-emerald-700 mt-0.5">Disbursed to Provider</p>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-100 p-3.5">
              <span className="text-xs font-medium text-slate-600">Average Booking Value</span>
              <p className="mt-1 text-xl font-extrabold text-slate-900">
                {formatPaisaToTaka(financial.averageBookingValuePaisa ?? 0)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Across completed reservations</p>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-100 p-3.5">
              <span className="text-xs font-medium text-slate-600">Pending Settlement</span>
              <p className="mt-1 text-xl font-extrabold text-slate-900">
                {formatPaisaToTaka(financial.pendingSettlementPaisa ?? 0)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">In ongoing / active sessions</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-500">
            <Lock className="size-4 shrink-0 text-slate-400" />
            <p>
              Financial and revenue analytics for this Provider remain confidential.
              To view monetary figures, the Provider must grant the <strong>EARNINGS_VIEW</strong> permission.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
