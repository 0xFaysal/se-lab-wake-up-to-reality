"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  Layers,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ManagerHeader } from "@/components/manager/manager-header";
import { ViewAccessDialog } from "@/components/manager/view-access-dialog";
import { managerApi } from "@/lib/api/manager-api";
import { bookingsApi } from "@/lib/api/bookings-api";
import { notificationsApi } from "@/lib/api/notifications-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { queryKeys } from "@/lib/query-keys";
import { formatDateTime } from "@/lib/formatters";

// Metric Card Component matching UI mockups
function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  colorScheme = "emerald",
}: {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
  colorScheme?: "emerald" | "amber" | "blue";
}) {
  const iconBg = {
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-100",
    amber: "bg-amber-50 text-amber-800 border-amber-100",
    blue: "bg-blue-50 text-blue-800 border-blue-100",
  }[colorScheme];

  const dotColor = {
    emerald: "bg-emerald-600",
    amber: "bg-amber-500",
    blue: "bg-blue-600",
  }[colorScheme];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs transition hover:shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={`flex size-9 items-center justify-center rounded-lg border ${iconBg}`}>
          <Icon className="size-4.5" />
        </div>
      </div>
      <div className="mt-3">
        <span className="text-3xl font-extrabold tracking-tight text-slate-900">
          {value}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
        <span className={`size-1.5 rounded-full ${dotColor}`} />
        <span>{subtext}</span>
      </div>
    </div>
  );
}

export default function ManagerDashboardPage() {
  const client = useQueryClient();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("ALL");

  const delegationsQuery = useQuery({
    queryKey: queryKeys.managerDelegations.manager,
    queryFn: managerApi.listForManager,
  });

  const bookingsQuery = useQuery({
    queryKey: queryKeys.bookings.provider({}),
    queryFn: () => bookingsApi.providerList(),
    retry: false,
  });

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications.all({}),
    queryFn: notificationsApi.list,
    retry: false,
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      accept ? managerApi.accept(id) : managerApi.reject(id),
    onSuccess: (_, { accept }) => {
      toast.success(accept ? "Delegation accepted successfully!" : "Delegation rejected");
      void client.invalidateQueries({
        queryKey: queryKeys.managerDelegations.manager,
      });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const delegations = useMemo(
    () => delegationsQuery.data ?? [],
    [delegationsQuery.data],
  );
  const pending = useMemo(
    () => delegations.filter((d) => d.status === "PENDING_ACCEPTANCE"),
    [delegations],
  );
  const active = useMemo(
    () => delegations.filter((d) => d.status === "ACTIVE"),
    [delegations],
  );

  // Filtered properties based on header switcher
  const filteredActive = useMemo(() => {
    if (selectedPropertyId === "ALL") return active;
    return active.filter((d) => d.property.id === selectedPropertyId);
  }, [active, selectedPropertyId]);

  const primaryOwnerName =
    active[0]?.provider?.fullName || "Property Principal";

  const allBookings = useMemo(
    () => bookingsQuery.data ?? [],
    [bookingsQuery.data],
  );

  // Filter bookings by selected property
  const filteredBookings = useMemo(() => {
    if (selectedPropertyId === "ALL") return allBookings;
    return allBookings.filter((b) => b.propertyId === selectedPropertyId);
  }, [allBookings, selectedPropertyId]);

  // Live active sessions: CHECKED_IN or CHECKOUT_REQUESTED
  const liveSessionsList = useMemo(() => {
    return filteredBookings.filter(
      (b) => b.status === "CHECKED_IN" || b.status === "CHECKOUT_REQUESTED",
    );
  }, [filteredBookings]);

  // Today's Bookings: confirmed, checked-in, or completed
  const todayBookingsList = useMemo(() => {
    return filteredBookings.filter(
      (b) =>
        b.status === "CONFIRMED" ||
        b.status === "CHECKED_IN" ||
        b.status === "CHECKOUT_REQUESTED" ||
        b.status === "COMPLETED",
    );
  }, [filteredBookings]);

  // Real recent activities from notifications
  const recentActivities = useMemo(() => {
    const notifs = notificationsQuery.data ?? [];
    if (notifs.length === 0) return [];
    return notifs.slice(0, 4).map((n) => ({
      id: n.id,
      title: n.title,
      details: n.message,
      time: formatDateTime(n.createdAt),
      color: "bg-emerald-500",
    }));
  }, [notificationsQuery.data]);

  return (
    <div className="flex flex-col min-h-full">
      {/* Top Persistent Header */}
      <ManagerHeader
        title="Overview"
        subtitle="Monitor and manage your assigned parking operations."
        badge="Manager View"
        selectedPropertyId={selectedPropertyId}
        onSelectPropertyId={setSelectedPropertyId}
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Pending Acceptance Alert Banner (if any) */}
        {pending.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                  <Clock className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-950">
                    You have {pending.length} pending delegation invitation
                    {pending.length !== 1 ? "s" : ""}
                  </h3>
                  <p className="text-xs text-amber-800">
                    A Property Owner has invited you to manage their parking operations.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pending.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={respondMutation.isPending}
                      onClick={() => respondMutation.mutate({ id: p.id, accept: false })}
                      className="border-red-200 text-red-700 hover:bg-red-50 text-xs"
                    >
                      Decline ({p.property.name})
                    </Button>
                    <Button
                      size="sm"
                      disabled={respondMutation.isPending}
                      onClick={() => respondMutation.mutate({ id: p.id, accept: true })}
                      className="bg-[#064E3B] text-white hover:bg-emerald-900 text-xs"
                    >
                      Accept ({p.property.name})
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4 Top KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="ASSIGNED PROPERTIES"
            value={active.length}
            subtext="Active assignments"
            icon={Building2}
            colorScheme="emerald"
          />
          <MetricCard
            title="SCHEDULED BOOKINGS"
            value={todayBookingsList.length}
            subtext="Live operational reservations"
            icon={Calendar}
            colorScheme="emerald"
          />
          <MetricCard
            title="ACTIVE SESSIONS"
            value={liveSessionsList.length}
            subtext="Currently parked on-site"
            icon={Car}
            colorScheme="amber"
          />
          <MetricCard
            title="TOTAL BOOKINGS"
            value={allBookings.length}
            subtext="Across assigned facilities"
            icon={Layers}
            colorScheme="emerald"
          />
        </div>

        {/* Assigned Properties Section matching UI mockup */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-slate-900">
                  Assigned Properties
                </h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  {filteredActive.length} Facilities
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Parking properties delegated to your operational scope by {primaryOwnerName}.
              </p>
            </div>
            <Link
              href="/manager/properties"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950"
            >
              <Lock className="size-3.5" />
              Delegated Access Controls
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {filteredActive.length > 0 ? (
              filteredActive.map((item) => {
                const isFullAccess = item.permissions.length >= 8;
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-950 text-base">
                              {item.property.name}
                            </h3>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                              <span className="size-1.5 rounded-full bg-emerald-600" />
                              Active
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            📍 {item.property.publicArea}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-[#064E3B] border border-emerald-200">
                            {item.permissions.length} Permissions
                          </span>
                        </div>
                      </div>

                      {/* Middle boxes: Scope & Status */}
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                          <span className="text-[11px] font-medium text-slate-500 block">
                            Operational Authority
                          </span>
                          <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                            Delegated Manager
                          </span>
                        </div>
                        <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                          <span className="text-[11px] font-medium text-emerald-800 block">
                            Assigned Principal
                          </span>
                          <span className="text-sm font-bold text-emerald-700 mt-0.5 block truncate">
                            {item.provider?.fullName || "Property Owner"}
                          </span>
                        </div>
                      </div>

                      {/* Permission Summary pills */}
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-medium text-slate-600">
                            Permission Summary
                          </span>
                          <span className="font-semibold text-emerald-800 text-[11px]">
                            {item.permissions.length} actions enabled
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {isFullAccess ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-900 border border-emerald-200">
                              <CheckCircle2 className="size-3 text-emerald-600" />
                              Full Operational Access (Guards, Pricing, Slots, Bookings)
                            </span>
                          ) : (
                            item.permissions.slice(0, 4).map((perm) => (
                              <span
                                key={perm}
                                className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200"
                              >
                                ✓ {perm.replace("_", " ")}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-5 flex items-center gap-2 pt-2">
                      <Link
                        href={`/manager/properties/${item.property.id}`}
                        className="flex-1"
                      >
                        <Button
                          size="sm"
                          className="w-full bg-[#064E3B] text-white hover:bg-emerald-900 font-semibold text-xs h-9 gap-1.5 cursor-pointer"
                        >
                          Open Workspace
                          <ArrowRight className="size-3.5" />
                        </Button>
                      </Link>

                      <ViewAccessDialog delegation={item} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center rounded-xl border border-dashed border-slate-200">
                <Building2 className="mx-auto size-10 text-slate-300" />
                <h3 className="mt-2 text-sm font-bold text-slate-700">
                  No Assigned Properties Found
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  When a property owner invites you as a delegated manager, your facilities will appear here.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Today's Bookings Section matching UI mockup */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-slate-900">Reservations &amp; Bookings</h2>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-[#064E3B] border border-emerald-200">
                  {todayBookingsList.length} Active Records
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Live reservations across your assigned properties.
              </p>
            </div>
            <Link
              href="/manager/bookings"
              className="text-xs font-semibold text-[#064E3B] hover:text-emerald-950 flex items-center gap-1"
            >
              All Bookings <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {todayBookingsList.length > 0 ? (
              todayBookingsList.slice(0, 5).map((b) => {
                const driverName = b.driver?.fullName || "Registered Driver";
                const driverInitial = driverName
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                const propertyTitle = b.property?.name || "Assigned Property";
                const slotCode = b.assignedUnitCode || b.parkingSpot?.spotCode || "Assigned Spot";

                const statusColor: Record<string, string> = {
                  CONFIRMED: "bg-emerald-100 text-emerald-800",
                  CHECKED_IN: "bg-blue-100 text-blue-800",
                  CHECKOUT_REQUESTED: "bg-amber-100 text-amber-800",
                  COMPLETED: "bg-slate-100 text-slate-700",
                  CANCELLED: "bg-red-100 text-red-700",
                  NO_SHOW: "bg-rose-100 text-rose-800",
                };
                const badgeClass = statusColor[b.status] || "bg-slate-100 text-slate-700";

                return (
                  <div
                    key={b.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 hover:bg-slate-50/80 px-2 rounded-lg transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100/80 font-bold text-xs text-[#064E3B]">
                        {driverInitial}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {b.bookingCode}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-sm font-semibold text-slate-700">
                            {driverName}
                          </span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-600">
                            Slot: {slotCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>🏢 {propertyTitle}</span>
                          <span className="text-slate-300">·</span>
                          <span>{formatDateTime(b.startAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>
                        {b.status.replace("_", " ")}
                      </span>
                      <Link href="/manager/bookings">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-slate-800 size-8 p-0 cursor-pointer"
                        >
                          <ArrowRight className="size-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                No active reservations recorded for this facility yet.
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 text-center">
            <Link
              href="/manager/bookings"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#064E3B] hover:text-emerald-950 cursor-pointer"
            >
              View Full Booking Log <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </section>

        {/* Two-Column Split: Active Sessions vs Recent Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Active Sessions (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      Active Sessions
                    </h2>
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
                      ● {liveSessionsList.length} Vehicles Inside
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live on-site vehicles with verified check-in credentials.
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  Live Operations
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {liveSessionsList.length > 0 ? (
                  liveSessionsList.map((s) => {
                    const driverName = s.driver?.fullName || "On-site Driver";
                    const vehiclePlate = s.vehicle?.registrationNumber || "Reg Vehicle";
                    const slot = s.assignedUnitCode || s.parkingSpot?.spotCode || "Bay";

                    return (
                      <div
                        key={s.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#064E3B] border border-emerald-100">
                            <Car className="size-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">
                                {driverName}
                              </span>
                              <span className="rounded bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                                {vehiclePlate}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Property: <strong className="text-slate-700">{s.property?.name}</strong>
                            </p>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5">
                              <span className="rounded bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 text-[11px]">
                                Slot: {slot}
                              </span>
                              <span className="text-slate-400">·</span>
                              <span>
                                In: {s.checkedInAt ? formatDateTime(s.checkedInAt) : "Checked in"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:items-end gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            {s.status === "CHECKOUT_REQUESTED" ? "Checkout Requested" : "On-Site Active"}
                          </span>
                          <Link href="/manager/active-sessions">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs font-semibold text-slate-700 cursor-pointer"
                            >
                              View Session
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center rounded-xl border border-dashed border-slate-200">
                    <Car className="mx-auto size-8 text-slate-300" />
                    <p className="mt-2 text-xs text-slate-500">
                      No vehicles currently parked on-site. Real-time entries update immediately when drivers check in.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 text-center">
              <Link
                href="/manager/active-sessions"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#064E3B] hover:text-emerald-950 cursor-pointer"
              >
                View Live Telemetry <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: Recent Activity (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Recent Activity
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Operational notifications &amp; audit events.
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  System Feed
                </span>
              </div>

              <div className="mt-4 relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {recentActivities.length > 0 ? (
                  recentActivities.map((act) => (
                    <div key={act.id} className="relative">
                      <span
                        className={`absolute -left-6 top-1 size-2.5 rounded-full ring-4 ring-white ${act.color}`}
                      />
                      <h4 className="text-xs font-bold text-slate-900">
                        {act.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                        {act.details}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {act.time}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    No recent events logged.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 text-right">
              <Link
                href="/manager/notifications"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#064E3B] hover:text-emerald-950 cursor-pointer"
              >
                Full Notifications <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Delegated Access Notice Banner matching bottom of mockup */}
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="size-4.5 text-[#064E3B] shrink-0" />
            <span>
              You can manage only assigned properties and the permissions granted by the Property Owner.
            </span>
          </div>
          <span className="font-semibold text-emerald-900 shrink-0">
            Assigned by: {primaryOwnerName}
          </span>
        </div>
      </div>
    </div>
  );
}
