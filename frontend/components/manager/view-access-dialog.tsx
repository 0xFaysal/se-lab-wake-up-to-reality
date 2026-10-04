"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ManagerDelegationDto, ManagerPermission } from "@/lib/api/manager-api";
import { formatDateTime } from "@/lib/formatters";

export const ALL_OPERATIONAL_PERMISSIONS: Array<{
  key: ManagerPermission;
  label: string;
  category: string;
  description: string;
}> = [
  {
    key: "RESOURCE_VIEW",
    label: "View Parking Resources",
    category: "Spaces & Inventory",
    description: "Browse dedicated parking bays, layout configurations, and capacity counts.",
  },
  {
    key: "RESOURCE_MANAGE",
    label: "Manage Parking Resources",
    category: "Spaces & Inventory",
    description: "Create, edit, and bulk-generate fixed bays and parking inventory within property legal bounds.",
  },
  {
    key: "LISTING_VIEW",
    label: "View Marketplace Listings",
    category: "Listings & Visibility",
    description: "Inspect published parking listings, tariffs, and driver-facing search attributes.",
  },
  {
    key: "LISTING_MANAGE",
    label: "Publish & Toggle Listings",
    category: "Listings & Visibility",
    description: "Publish new listings, pause availability during events, and resume operational slots.",
  },
  {
    key: "PRICE_MANAGE",
    label: "Manage Pricing & Overtime",
    category: "Tariffs & Rules",
    description: "Adjust hourly parking rates, overtime multipliers, fixed overtime rates, and grace periods.",
  },
  {
    key: "AVAILABILITY_MANAGE",
    label: "Manage Operating Hours",
    category: "Availability",
    description: "Set weekly operating schedules, opening/closing hours, and emergency holiday closures.",
  },
  {
    key: "BOOKING_VIEW",
    label: "View Booking Manifest",
    category: "Bookings & Sessions",
    description: "Inspect incoming reservations, driver license numbers, and scheduled parking shifts.",
  },
  {
    key: "BOOKING_MANAGE",
    label: "Manage Bookings & Overstays",
    category: "Bookings & Sessions",
    description: "Handle booking dispute flags, note operational anomalies, and assist barrier check-ins.",
  },
  {
    key: "GUARD_VIEW",
    label: "View Security Guards",
    category: "Security & Gates",
    description: "View gate security roster, guard shift schedules, and check-in station status.",
  },
  {
    key: "GUARD_ASSIGN",
    label: "Assign Guard Shifts",
    category: "Security & Gates",
    description: "Coordinate guard assignments across facility barrier gates and duty shifts.",
  },
  {
    key: "GUARD_ADD_TO_PROPERTY",
    label: "Invite Guards to Facility",
    category: "Security & Gates",
    description: "Invite verified security personnel to this facility's operational guard pool.",
  },
  {
    key: "IMAGE_MANAGE",
    label: "Manage Facility Media",
    category: "Media & Assets",
    description: "Upload and organize gate access photos, entry diagrams, and parking bay guidance photos.",
  },
  {
    key: "REPORTS_VIEW",
    label: "View Facility Reports",
    category: "Analytics & Reports",
    description: "Access operational turnover, utilization rates, and day-to-day session logs.",
  },
  {
    key: "EARNINGS_VIEW",
    label: "View Financial Metrics",
    category: "Financial (Delegated)",
    description: "View gross turnover and aggregate financial booking volumes for this facility.",
  },
];

export interface ViewAccessDialogProps {
  delegation: ManagerDelegationDto;
  trigger?: React.ReactNode;
}

export function ViewAccessDialog({ delegation, trigger }: ViewAccessDialogProps) {
  const [open, setOpen] = useState(false);

  const grantedKeys = new Set<string>([
    ...delegation.permissions,
    ...(delegation.effectivePermissions ?? []),
  ]);

  const grantedList = ALL_OPERATIONAL_PERMISSIONS.filter((p) => grantedKeys.has(p.key));
  const restrictedList = ALL_OPERATIONAL_PERMISSIONS.filter((p) => !grantedKeys.has(p.key));

  const scopeLabel =
    delegation.resourceIds.length === 0
      ? "Whole Property (all spaces and bays)"
      : `${delegation.resourceIds.length} designated parking resource${
          delegation.resourceIds.length !== 1 ? "s" : ""
        }`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ? (
            React.isValidElement(trigger) ? (
              React.cloneElement(trigger as React.ReactElement<{ onClick?: () => void }>, {
                onClick: () => setOpen(true),
              })
            ) : (
              <span onClick={() => setOpen(true)}>{trigger}</span>
            )
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              View Access
            </Button>
          )
        }
      />

      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#064E3B] p-6 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
              <ShieldCheck className="size-4" />
              Delegated Access Specification
            </div>
            <span className="rounded-full bg-emerald-800/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-200 border border-emerald-700">
              Status: {delegation.status}
            </span>
          </div>

          <DialogHeader className="mt-2 text-left space-y-0.5">
            <DialogTitle className="text-xl font-bold text-white">
              {delegation.property.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-emerald-100/90">
              {delegation.property.publicArea} · Delegated by{" "}
              <span className="font-semibold text-white">
                {delegation.provider?.fullName ?? "Property Owner"}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 flex flex-wrap gap-4 text-xs text-emerald-200/90 pt-3 border-t border-emerald-700/60">
            <span>
              <strong>Scope:</strong> {scopeLabel}
            </span>
            {delegation.acceptedAt && (
              <span>
                <strong>Granted:</strong> {formatDateTime(delegation.acceptedAt)}
              </span>
            )}
            {delegation.validUntil && (
              <span>
                <strong>Expires:</strong> {formatDateTime(delegation.validUntil)}
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Summary Box */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
              <span className="block text-2xl font-extrabold text-[#064E3B]">
                {grantedList.length}
              </span>
              <span className="text-xs font-semibold text-emerald-800">
                Actions Enabled by Owner
              </span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <span className="block text-2xl font-extrabold text-slate-700">
                {restrictedList.length}
              </span>
              <span className="text-xs font-semibold text-slate-600">
                Restricted by Owner
              </span>
            </div>
          </div>

          {/* Enabled Actions */}
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2.5">
              <CheckCircle2 className="size-4 text-emerald-600" />
              Enabled Actions ({grantedList.length} Granted)
            </h3>
            <div className="space-y-2">
              {grantedList.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  No active operational actions granted for this facility.
                </p>
              ) : (
                grantedList.map((p) => (
                  <div
                    key={p.key}
                    className="flex items-start gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50/40 p-2.5"
                  >
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px]">
                      ✓
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {p.label}
                        </span>
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                          {p.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {p.description}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Restricted Actions */}
          {restrictedList.length > 0 && (
            <div>
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                <Lock className="size-3.5 text-slate-400" />
                Restricted by Property Owner ({restrictedList.length})
              </h3>
              <div className="space-y-2">
                {restrictedList.map((p) => (
                  <div
                    key={p.key}
                    className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 opacity-80"
                  >
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-slate-300 text-slate-600 text-[10px]">
                      ✕
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-700">
                          {p.label}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          Restricted
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {p.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Non-delegatable Boundary Policy Notice */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-bold mb-1">
              <ShieldAlert className="size-4 text-amber-700" />
              Non-Delegatable Security Governance
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              In accordance with ParkEase BD core security architecture, financial payouts,
              registered bank accounts, wallet balance withdrawals, and legal property deed
              ownership remain exclusively governed by the verified Property Owner. Managers
              act as operational proxies with individual audit trail logging.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3.5 flex justify-end shrink-0">
          <Button
            size="sm"
            onClick={() => setOpen(false)}
            className="bg-[#064E3B] text-white hover:bg-emerald-900"
          >
            Close Access Details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
