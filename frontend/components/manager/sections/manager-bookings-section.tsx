"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  Car,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import { bookingsApi } from "@/lib/api/bookings-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";
import { operationalAmount } from "@/lib/operational-display";
import type { BookingDto, MarketplaceBookingStatus } from "@/lib/api/marketplace-types";

const STATUS_CONFIG: Record<
  MarketplaceBookingStatus,
  { label: string; color: string }
> = {
  PAYMENT_PENDING: { label: "Payment Pending", color: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "Confirmed", color: "bg-blue-100 text-blue-800" },
  CHECKED_IN: { label: "Checked In", color: "bg-emerald-100 text-emerald-800" },
  CHECKOUT_REQUESTED: { label: "Checkout Requested", color: "bg-orange-100 text-orange-800" },
  PAYMENT_DUE: { label: "Payment Due", color: "bg-red-100 text-red-700" },
  COMPLETED: { label: "Completed", color: "bg-slate-100 text-slate-600" },
  CANCELLED: { label: "Cancelled", color: "bg-red-50 text-red-400" },
  EXPIRED: { label: "Expired", color: "bg-slate-100 text-slate-400" },
  NO_SHOW: { label: "No Show", color: "bg-slate-100 text-slate-400" },
  DISPUTED: { label: "Disputed", color: "bg-red-100 text-red-700" },
};

export function ManagerBookingsSection({
  propertyId,
  resourceIds,
}: {
  propertyId: string;
  resourceIds: string[];
}) {
  const query = useQuery({
    queryKey: queryKeys.bookings.provider({ propertyId }),
    queryFn: () => bookingsApi.providerList({ propertyId }),
  });

  if (query.isPending) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="size-4 animate-spin" />
        Loading bookings…
      </div>
    );
  }

  if (query.isError) {
    return (
      <p className="text-sm text-red-700">{getApiErrorMessage(query.error)}</p>
    );
  }

  // Filter to this property and the delegated resource scope
  const rawBookings: BookingDto[] = Array.isArray(query.data) ? query.data : [];
  const allBookings = rawBookings.filter(
    (b: BookingDto) =>
      b.propertyId === propertyId &&
      (resourceIds.length === 0 || resourceIds.includes(b.parkingSpotId)),
  );

  const active = allBookings.filter((b) =>
    ["CONFIRMED", "CHECKED_IN", "CHECKOUT_REQUESTED", "PAYMENT_DUE"].includes(
      b.status,
    ),
  );
  const recent = allBookings.filter((b) =>
    ["COMPLETED", "CANCELLED", "EXPIRED", "NO_SHOW"].includes(b.status),
  );

  if (allBookings.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No bookings found in your delegated scope for this Property.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: allBookings.length, color: "text-slate-900" },
          { label: "Active", value: active.length, color: "text-emerald-700" },
          {
            label: "Completed",
            value: allBookings.filter((b) => b.status === "COMPLETED").length,
            color: "text-blue-700",
          },
          {
            label: "Cancelled",
            value: allBookings.filter((b) => b.status === "CANCELLED").length,
            color: "text-red-600",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-lg border border-slate-200 bg-white p-3 text-center"
          >
            <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Active bookings */}
      {active.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
            Active ({active.length})
          </p>
          <div className="space-y-2">
            {active.map((booking) => {
              const statusInfo =
                STATUS_CONFIG[booking.status] ?? {
                  label: booking.status,
                  color: "bg-slate-100 text-slate-600",
                };
              return (
                <div
                  key={booking.id}
                  className="rounded-lg border border-slate-200 bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs font-bold text-slate-700">
                        #{booking.bookingCode}
                      </p>
                      {booking.vehicle && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                          <Car className="size-3" />
                          {booking.vehicle.registrationNumber} ·{" "}
                          {booking.vehicle.vehicleType}
                        </p>
                      )}
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="size-3" />
                      {formatDateTime(booking.startAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      Until {formatDateTime(booking.scheduledEndAt)}
                    </span>
                    <span className="font-semibold text-slate-700">
                      {operationalAmount(booking.totalAmountPaisa)}
                    </span>
                    {booking.parkingSpot && (
                      <span>
                        Bay:{" "}
                        {booking.parkingSpot.displayName ??
                          booking.parkingSpot.spotCode ??
                          "—"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent bookings */}
      {recent.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            Recent ({recent.length})
          </p>
          <div className="space-y-2 opacity-80">
            {recent.slice(0, 10).map((booking) => {
              const statusInfo =
                STATUS_CONFIG[booking.status] ?? {
                  label: booking.status,
                  color: "bg-slate-100 text-slate-600",
                };
              return (
                <div
                  key={booking.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="size-4 shrink-0 text-slate-300" />
                    <div>
                      <p className="font-mono text-xs font-bold text-slate-600">
                        #{booking.bookingCode}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatDateTime(booking.startAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-600">
                      {operationalAmount(booking.totalAmountPaisa)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
