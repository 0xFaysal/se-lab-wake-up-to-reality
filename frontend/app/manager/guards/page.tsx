"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Calendar,
  Clock,
  DoorOpen,
  Plus,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { ManagerHeader } from "@/components/manager/manager-header";
import { Button } from "@/components/ui/button";
import { managerApi } from "@/lib/api/manager-api";
import { guardApi } from "@/lib/api/guard-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function ManagerGuardsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteIdentifier, setInviteIdentifier] = useState("");
  const [invitePropertyId, setInvitePropertyId] = useState("");

  const delegationsQuery = useQuery({
    queryKey: queryKeys.managerDelegations.manager,
    queryFn: managerApi.listForManager,
  });

  const activeDelegations = delegationsQuery.data?.filter((d) => d.status === "ACTIVE") ?? [];
  const primaryOwner = activeDelegations[0]?.provider?.fullName || "Property Owner";

  const assignmentsQuery = useQuery({
    queryKey: queryKeys.ownerGuardAssignments.all(propertyFilter === "ALL" ? {} : { propertyId: propertyFilter }),
    queryFn: () => guardApi.listForProvider(propertyFilter === "ALL" ? {} : { propertyId: propertyFilter }),
  });

  const rawAssignments = useMemo(
    () => assignmentsQuery.data?.assignments ?? [],
    [assignmentsQuery.data?.assignments],
  );

  // Invite guard mutation
  const inviteMutation = useMutation({
    mutationFn: async ({ propertyId, identifier }: { propertyId: string; identifier: string }) => {
      return guardApi.invite(propertyId, identifier);
    },
    onSuccess: () => {
      toast.success("Security guard invitation sent successfully");
      setIsInviteModalOpen(false);
      setInviteIdentifier("");
      queryClient.invalidateQueries({ queryKey: queryKeys.ownerGuardAssignments.root });
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err));
    },
  });

  const filteredGuards = useMemo(() => {
    return rawAssignments.filter((g) => {
      const guardName = g.guard?.fullName || "Security Guard";
      const propertyName = g.property?.name || "";
      const status = g.status;

      const matchSearch =
        guardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        propertyName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchProperty =
        propertyFilter === "ALL" || g.property?.id === propertyFilter;

      const matchStatus = statusFilter === "ALL" || status === statusFilter;

      return matchSearch && matchProperty && matchStatus;
    });
  }, [rawAssignments, searchTerm, propertyFilter, statusFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const total = rawAssignments.length;
    const onDuty = rawAssignments.filter((g) => g.status === "ACTIVE").length;
    const offDuty = rawAssignments.filter((g) => g.status === "ENDED" || g.status === "SUSPENDED").length;
    const scheduled = rawAssignments.filter((g) => g.status === "PENDING_ACCEPTANCE").length;

    // Distinct properties with at least one active assignment
    const coveredProps = new Set(
      rawAssignments.filter((g) => g.status === "ACTIVE").map((g) => g.property?.id),
    ).size;

    return { total, onDuty, offDuty, scheduled, coveredProps };
  }, [rawAssignments]);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteIdentifier.trim()) {
      toast.error("Please enter guard email or mobile number");
      return;
    }
    const propId = invitePropertyId || activeDelegations[0]?.property.id;
    if (!propId) {
      toast.error("Please select a property");
      return;
    }
    inviteMutation.mutate({ propertyId: propId, identifier: inviteIdentifier.trim() });
  };

  return (
    <div className="flex flex-col min-h-full">
      <ManagerHeader
        title="Guards"
        subtitle="Monitor assigned guards, duty status, access points, and current shifts."
        badge="Manager View"
        rightExtra={
          <Button
            size="sm"
            onClick={() => {
              if (activeDelegations.length > 0) {
                setInvitePropertyId(activeDelegations[0]!.property.id);
              }
              setIsInviteModalOpen(true);
            }}
            className="bg-[#064E3B] text-white hover:bg-emerald-900 text-xs font-semibold gap-1.5 h-8"
          >
            <UserPlus className="size-3.5" />
            Invite Guard
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Delegated Access Notice Banner */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="size-4.5 text-[#064E3B] shrink-0" />
            <span className="font-medium">
              You can monitor and coordinate guards only within the properties and permissions delegated by the Property Owner.
            </span>
          </div>
          <span className="font-semibold text-emerald-900 shrink-0">
            Assigned by: {primaryOwner}
          </span>
        </div>

        {/* 5 KPI Metric Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Guards
              </span>
              <Users className="size-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">{metrics.total}</div>
            <p className="mt-1 text-[11px] text-slate-400">Delegated Roster</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                On Duty
              </span>
              <span className="size-2 rounded-full bg-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-emerald-700">{metrics.onDuty}</div>
            <p className="mt-1 text-[11px] text-emerald-700 font-medium">Active Posts</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Off Duty
              </span>
              <Clock className="size-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-700">{metrics.offDuty}</div>
            <p className="mt-1 text-[11px] text-slate-400">Shift Rest</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                Pending Acceptance
              </span>
              <Calendar className="size-4 text-blue-500" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-blue-900">{metrics.scheduled}</div>
            <p className="mt-1 text-[11px] text-blue-700 font-medium">Invitations / Shifts</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Covered Hubs
              </span>
              <DoorOpen className="size-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">
              {metrics.coveredProps} / {activeDelegations.length}
            </div>
            <p className="mt-1 text-[11px] text-emerald-700 font-medium">Facilities Guarded</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search guard name or property..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#064E3B] focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Properties ({activeDelegations.length})</option>
              {activeDelegations.map((d) => (
                <option key={d.property.id} value={d.property.id}>
                  {d.property?.name || d.property.id}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Duty Statuses</option>
              <option value="ACTIVE">Active (On Duty)</option>
              <option value="PENDING_ACCEPTANCE">Pending Acceptance</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="ENDED">Ended</option>
            </select>
          </div>
        </div>

        {/* Two-Column Grid: Guard Roster (8 cols) vs Sidebar (4 cols) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Guard Roster (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Guard Roster
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Assigned operational guards across your delegated properties.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  Showing {filteredGuards.length} Guards
                </span>
              </div>

              {assignmentsQuery.isLoading && (
                <div className="py-12 text-center text-xs text-slate-500">
                  Loading guard assignments...
                </div>
              )}

              {!assignmentsQuery.isLoading && filteredGuards.length === 0 && (
                <div className="py-12 text-center space-y-3">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
                    <Users className="size-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">No Guard Records Found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {searchTerm
                      ? `No security guards found matching "${searchTerm}".`
                      : "No security guards are currently assigned to your delegated properties. You can invite a guard or coordinate with the Property Owner."}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (activeDelegations.length > 0) {
                        setInvitePropertyId(activeDelegations[0]!.property.id);
                      }
                      setIsInviteModalOpen(true);
                    }}
                    className="bg-[#064E3B] text-white hover:bg-emerald-900 text-xs font-semibold h-8 mt-2"
                  >
                    <Plus className="size-3.5 mr-1" />
                    Invite First Guard
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                {filteredGuards.map((g) => {
                  const guardName = g.guard?.fullName || "Security Guard";
                  const initials = getInitials(guardName);
                  const isOnDuty = g.status === "ACTIVE";

                  return (
                    <div
                      key={g.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3 hover:bg-slate-50 transition"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-xs text-[#064E3B]">
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-sm">
                                {guardName}
                              </h3>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isOnDuty
                                    ? "bg-emerald-100 text-emerald-800"
                                    : g.status === "PENDING_ACCEPTANCE"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                ● {isOnDuty ? "On Duty" : g.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                              <span>Property: <strong className="text-slate-700">{g.property?.name}</strong></span>
                              <span>·</span>
                              <span>Shift: <strong className="text-slate-700">{g.shiftStart || "08:00"} – {g.shiftEnd || "18:00"}</strong></span>
                              {g.guard?.phoneMasked && (
                                <>
                                  <span>·</span>
                                  <span className="text-slate-400 font-mono text-[11px]">{g.guard.phoneMasked}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toast.info(`Viewing guard record: ${guardName}`)}
                            className="h-8 text-xs font-semibold text-slate-700 hover:bg-white"
                          >
                            View Record
                          </Button>
                          {isOnDuty && (
                            <Link href="/manager/active-sessions">
                              <Button
                                size="sm"
                                className="h-8 text-xs font-semibold bg-[#064E3B] text-white hover:bg-emerald-900"
                              >
                                View Activity
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-emerald-800 pt-2 border-t border-slate-200/60 font-medium">
                        <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        <span>Active terminal handshake verified for barrier controls</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shift Coverage Summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Facility Shift Coverage
                </h3>
                <span className="text-xs text-slate-400">{activeDelegations.length} Assigned Facilities</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {activeDelegations.map((del) => {
                  const propGuards = rawAssignments.filter((g) => g.property?.id === del.property.id);
                  const activeGuard = propGuards.find((g) => g.status === "ACTIVE");

                  return (
                    <div key={del.id} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 truncate pr-2">
                          {del.property?.name}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                            activeGuard ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {activeGuard ? "Covered" : "Standby"}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        Post Status: <strong>{activeGuard ? `${activeGuard.guard?.fullName || "Guard"} (On Duty)` : "No active guard check-in"}</strong>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Live Duty Status */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Live Duty Status
                </h3>
                <span className="text-xs font-bold text-emerald-700">
                  {metrics.coveredProps} / {activeDelegations.length} Covered
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-2.5">
                  <span className="text-xl font-extrabold text-emerald-800 block">{metrics.onDuty}</span>
                  <span className="text-[10px] font-bold text-emerald-700">On Duty</span>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                  <span className="text-xl font-extrabold text-slate-700 block">{metrics.offDuty}</span>
                  <span className="text-[10px] font-medium text-slate-500">Off Duty</span>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-2.5">
                  <span className="text-xl font-extrabold text-blue-800 block">{metrics.scheduled}</span>
                  <span className="text-[10px] font-medium text-blue-700">Pending</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
                Operations Coordination
              </h3>
              <div className="space-y-2">
                <Link href="/manager/active-sessions">
                  <Button variant="outline" size="sm" className="w-full justify-between text-xs font-semibold h-9">
                    <span>Monitor Gate Telemetry</span>
                    <ArrowRight className="size-3.5 text-slate-400" />
                  </Button>
                </Link>
                <Link href="/manager/bookings">
                  <Button variant="outline" size="sm" className="w-full justify-between text-xs font-semibold h-9">
                    <span>Today&apos;s Booking Manifest</span>
                    <ArrowRight className="size-3.5 text-slate-400" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Manager Guard Access Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                <h3 className="text-xs font-bold text-slate-900">
                  Manager Guard Access
                </h3>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  Delegated Scope
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                    GRANTED:
                  </span>
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-900 border border-emerald-200">
                      View Guard Roster
                    </span>
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-900 border border-emerald-200">
                      Duty Status
                    </span>
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-900 border border-emerald-200">
                      Shift Coordination
                    </span>
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-900 border border-emerald-200">
                      Guard Activity Feed
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block mb-1">
                    RESTRICTED:
                  </span>
                  <span className="rounded bg-red-50 px-2 py-0.5 text-[11px] text-red-700 border border-red-200">
                    Guard Identity Deletion / Provider Ownership Policy
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Guard Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 isolate z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Invite Security Guard
              </h3>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Delegated Property
                </label>
                <select
                  value={invitePropertyId}
                  onChange={(e) => setInvitePropertyId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#064E3B] focus:outline-hidden"
                >
                  {activeDelegations.map((d) => (
                    <option key={d.property.id} value={d.property.id}>
                      {d.property?.name || d.property.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Guard Email or Mobile (+880...)
                </label>
                <input
                  type="text"
                  placeholder="e.g. guard@parkease.com or 01712345678"
                  value={inviteIdentifier}
                  onChange={(e) => setInviteIdentifier(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-[#064E3B] focus:outline-hidden"
                  required
                />
              </div>

              <div className="rounded-lg bg-emerald-50/70 border border-emerald-200 p-2.5 text-[11px] text-emerald-950">
                The guard must be registered on ParkEase BD. Upon receiving the invitation, they will gain terminal access to verify QR credentials and control barrier gates for this property.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={inviteMutation.isPending}
                  className="bg-[#064E3B] text-white hover:bg-emerald-900 text-xs font-semibold"
                >
                  {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
