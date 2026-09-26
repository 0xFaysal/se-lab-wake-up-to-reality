"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  Filter,
  Grid,
  Info,
  Layers,
  LayoutGrid,
  List,
  Lock,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { ManagerHeader } from "@/components/manager/manager-header";
import { ViewAccessDialog } from "@/components/manager/view-access-dialog";
import { Button } from "@/components/ui/button";
import { managerApi, type ManagerDelegationDto } from "@/lib/api/manager-api";
import { bookingsApi } from "@/lib/api/bookings-api";
import { queryKeys } from "@/lib/query-keys";
import { formatDateTime } from "@/lib/formatters";

export default function ManagerPropertiesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [accessFilter, setAccessFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const delegationsQuery = useQuery({
    queryKey: queryKeys.managerDelegations.manager,
    queryFn: managerApi.listForManager,
  });

  const bookingsQuery = useQuery({
    queryKey: queryKeys.bookings.provider({}),
    queryFn: () => bookingsApi.providerList(),
    retry: false,
  });

  const delegations = delegationsQuery.data ?? [];
  const active = useMemo(
    () => delegations.filter((d) => d.status === "ACTIVE"),
    [delegations],
  );

  const filteredProperties = useMemo(() => {
    return active.filter((item) => {
      const matchesSearch =
        item.property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.property.publicArea.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;

      const matchesAccess =
        accessFilter === "ALL" ||
        (accessFilter === "FULL" && item.permissions.length >= 8) ||
        (accessFilter === "RESTRICTED" && item.permissions.length < 8);

      return matchesSearch && matchesStatus && matchesAccess;
    });
  }, [active, searchTerm, statusFilter, accessFilter]);

  const primaryOwner = active[0]?.provider?.fullName || "Property Principal";
  const allBookings = bookingsQuery.data ?? [];
  const activeSessionsCount = allBookings.filter(
    (b) => b.status === "CHECKED_IN" || b.status === "CHECKOUT_REQUESTED",
  ).length;

  return (
    <div className="flex flex-col min-h-full">
      {/* Top Persistent Header */}
      <ManagerHeader
        title="Assigned Properties"
        subtitle="View and manage the parking properties assigned to you."
        badge="Manager View"
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Delegated Scope Notice Banner matching mockup */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="size-4.5 text-[#064E3B] shrink-0" />
            <span className="font-medium">
              Your available actions depend on the permissions granted by the Property Owner for each property.
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-slate-600">
              Assigned by: <strong className="text-slate-800">{primaryOwner}</strong>
            </span>
            <span className="rounded-full bg-white px-2.5 py-0.5 font-bold text-[#064E3B] border border-emerald-200 shadow-2xs">
              {active.length} Facilities
            </span>
          </div>
        </div>

        {/* 4 KPI Cards matching assigned-properties.png */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                ASSIGNED PROPERTIES
              </span>
              <div className="flex size-9 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-700">
                <Building2 className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900">
                {active.length}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="size-1.5 rounded-full bg-emerald-600" />
              <span>Active assignments</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                ACTIVE PROPERTIES
              </span>
              <div className="flex size-9 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-[#064E3B]">
                <CheckCircle2 className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900">
                {active.length}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="size-1.5 rounded-full bg-emerald-600" />
              <span>100% operational</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                TOTAL BOOKINGS
              </span>
              <div className="flex size-9 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-700 font-black text-sm">
                P
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900">
                {allBookings.length}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <span>Managed reservations</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                ON-SITE SESSIONS
              </span>
              <div className="flex size-9 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-[#064E3B]">
                <Calendar className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900">
                {activeSessionsCount}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="size-1.5 rounded-full bg-emerald-600" />
              <span>Checked in vehicles</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar matching mockup */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search assigned properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#064E3B] focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 text-[11px]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50/70 px-2 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 text-[11px]">Access:</span>
              <select
                value={accessFilter}
                onChange={(e) => setAccessFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50/70 px-2 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden"
              >
                <option value="ALL">All Access Levels</option>
                <option value="FULL">Full Operational Access</option>
                <option value="RESTRICTED">Restricted</option>
              </select>
            </div>

            {/* Grid/List Toggle */}
            <div className="flex items-center rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition ${
                  viewMode === "grid"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="size-3.5" />
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition ${
                  viewMode === "list"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <List className="size-3.5" />
                List
              </button>
            </div>
          </div>
        </div>

        {/* Properties Cards Grid */}
        <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
          {filteredProperties.length > 0 ? (
            filteredProperties.map((item) => {
              const isFullAccess = item.permissions.length >= 8;
              const assignedDate = item.acceptedAt
                ? formatDateTime(item.acceptedAt)
                : formatDateTime(item.invitedAt);

              const propertyBookings = allBookings.filter(
                (b) => b.propertyId === item.property.id,
              );
              const activeCountForProperty = propertyBookings.filter(
                (b) => b.status === "CHECKED_IN" || b.status === "CHECKOUT_REQUESTED",
              ).length;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-950">
                            {item.property.name}
                          </h2>
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 border border-emerald-200">
                            ACTIVE
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

                    {/* Subline */}
                    <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-3">
                      <span>
                        Principal: <strong className="text-slate-700">{item.provider?.fullName || "Property Owner"}</strong>
                      </span>
                      <span>
                        Assigned Since: <strong className="text-slate-700">{assignedDate}</strong>
                      </span>
                    </div>

                    {/* 3 Metrics Boxes */}
                    <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          TOTAL BOOKINGS
                        </span>
                        <span className="text-base font-extrabold text-slate-900 mt-1 block">
                          {propertyBookings.length}
                        </span>
                      </div>
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                          ON-SITE NOW
                        </span>
                        <span className="text-base font-extrabold text-emerald-700 mt-1 block">
                          {activeCountForProperty}
                        </span>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          AUTHORITY
                        </span>
                        <span className="text-xs font-bold text-slate-700 mt-1.5 block">
                          DELEGATED
                        </span>
                      </div>
                    </div>

                    {/* Permission Summary & Badges */}
                    <div className="mt-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                          {isFullAccess ? (
                            <ShieldCheck className="size-4 text-emerald-600" />
                          ) : (
                            <Lock className="size-3.5 text-slate-500" />
                          )}
                          <span>Permission Summary</span>
                        </div>
                        {isFullAccess ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-900">
                            ✓ Full Operational Access
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-600">
                            {item.permissions.length} Enabled · {14 - item.permissions.length} Restricted
                          </span>
                        )}
                      </div>

                      {/* ENABLED ACTIONS */}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                          ENABLED ACTIONS ({item.permissions.length} GRANTED):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.permissions.map((perm) => (
                            <span
                              key={perm}
                              className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-900 border border-emerald-200"
                            >
                              ✓ {perm.replace("_", " ")}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-6 flex items-center gap-3 pt-3 border-t border-slate-100">
                    <Link
                      href={`/manager/properties/${item.property.id}`}
                      className="flex-1"
                    >
                      <Button
                        size="sm"
                        className="w-full bg-[#064E3B] text-white hover:bg-emerald-900 font-semibold text-xs h-9 gap-1.5 cursor-pointer"
                      >
                        Open Facility Workspace
                        <ArrowRight className="size-3.5" />
                      </Button>
                    </Link>

                    <ViewAccessDialog delegation={item} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
              <Building2 className="mx-auto size-12 text-slate-300" />
              <h3 className="mt-3 text-base font-bold text-slate-800">
                No Properties Found
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                No properties match your current search and filter settings. Try adjusting your query or filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
