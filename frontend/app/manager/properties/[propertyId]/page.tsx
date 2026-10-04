"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Layers,
  Lock,
  Settings,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { ManagerHeader } from "@/components/manager/manager-header";
import { ALL_OPERATIONAL_PERMISSIONS, ViewAccessDialog } from "@/components/manager/view-access-dialog";
import { Button } from "@/components/ui/button";
import { ManagerResourcesSection } from "@/components/manager/sections/manager-resources-section";
import { ManagerListingsSection } from "@/components/manager/sections/manager-listings-section";
import { ManagerAvailabilitySection } from "@/components/manager/sections/manager-availability-section";
import { ManagerBookingsSection } from "@/components/manager/sections/manager-bookings-section";
import { ManagerGuardsSection } from "@/components/manager/sections/manager-guards-section";
import { ManagerReportsSection } from "@/components/manager/sections/manager-reports-section";
import { managerApi, type ManagerPermission } from "@/lib/api/manager-api";
import { parkingResourcesApi } from "@/lib/api/parking-resources-api";
import { bookingsApi } from "@/lib/api/bookings-api";
import { listingsApi } from "@/lib/api/listings-api";
import { guardApi } from "@/lib/api/guard-api";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { BookingDto, ParkingListingDto } from "@/lib/api/marketplace-types";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { queryKeys } from "@/lib/query-keys";
import { propertyOperations } from "@/lib/property-operations";

export default function ManagerPropertyDetailPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const { data: currentUser } = useCurrentUser();
  const [activeOperationalTab, setActiveOperationalTab] = useState<
    "overview" | "resources" | "listings" | "availability" | "bookings" | "guards" | "reports"
  >("overview");

  const delegationsQuery = useQuery({
    queryKey: queryKeys.managerDelegations.manager,
    queryFn: managerApi.listForManager,
  });

  const delegation = delegationsQuery.data?.find(
    (item) => item.property.id === propertyId && item.status === "ACTIVE",
  );

  const effectivePermissionsSet = useMemo(() => {
    return new Set<ManagerPermission>([
      ...(delegation?.permissions ?? []),
      ...(delegation?.effectivePermissions ?? []),
    ]);
  }, [delegation?.permissions, delegation?.effectivePermissions]);

  const can = (permission: ManagerPermission): boolean =>
    effectivePermissionsSet.has(permission);

  const resourcesQuery = useQuery({
    queryKey: queryKeys.parkingResources.byProperty(propertyId),
    queryFn: () => parkingResourcesApi.list(propertyId),
    enabled: Boolean(delegation && (can("RESOURCE_VIEW") || can("RESOURCE_MANAGE"))),
  });

  const listingsQuery = useQuery({
    queryKey: queryKeys.listings.all({ propertyId }),
    queryFn: listingsApi.list,
    enabled: Boolean(delegation && (can("LISTING_VIEW") || can("LISTING_MANAGE"))),
  });

  const bookingsQuery = useQuery({
    queryKey: queryKeys.bookings.provider({ propertyId }),
    queryFn: () => bookingsApi.providerList({ propertyId }),
    retry: false,
    enabled: Boolean(delegation && (can("BOOKING_VIEW") || can("BOOKING_MANAGE"))),
  });

  const guardsQuery = useQuery({
    queryKey: queryKeys.ownerGuardAssignments.all({ propertyId }),
    queryFn: () => guardApi.listForProvider({ propertyId }),
    enabled: Boolean(
      delegation &&
        (can("GUARD_VIEW") || can("GUARD_ASSIGN") || can("GUARD_ADD_TO_PROPERTY")),
    ),
  });

  const rawBookings: BookingDto[] = useMemo(
    () => (Array.isArray(bookingsQuery.data) ? bookingsQuery.data : []),
    [bookingsQuery.data],
  );
  const propertyBookings = useMemo(
    () => rawBookings.filter((b: BookingDto) => b.propertyId === propertyId),
    [rawBookings, propertyId],
  );
  const occupiedSpots = useMemo(() => {
    return new Set(
      propertyBookings
        .filter((b) => b.status === "CHECKED_IN" || b.status === "CHECKOUT_REQUESTED")
        .map((b) => b.parkingSpotId)
        .filter(Boolean),
    );
  }, [propertyBookings]);

  const nextDeparture = useMemo(() => {
    const active = propertyBookings
      .filter((b) => b.status === "CHECKED_IN" || b.status === "CHECKOUT_REQUESTED")
      .sort((a, b) => new Date(a.scheduledEndAt).getTime() - new Date(b.scheduledEndAt).getTime())[0];
    if (!active) return "None scheduled";
    const timeStr = new Date(active.scheduledEndAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const spot = active.parkingSpot?.spotCode || active.parkingSpot?.displayName || "Bay";
    return `${timeStr} (${spot})`;
  }, [propertyBookings]);

  const nextArrival = useMemo(() => {
    const upcoming = propertyBookings
      .filter((b) => b.status === "CONFIRMED")
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];
    if (!upcoming) return "None scheduled";
    const timeStr = new Date(upcoming.startAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const spot = upcoming.parkingSpot?.spotCode || upcoming.parkingSpot?.displayName || "Bay";
    return `${timeStr} (${spot})`;
  }, [propertyBookings]);

  if (delegationsQuery.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="size-5 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
          Loading delegated property workspace...
        </div>
      </div>
    );
  }

  if (delegationsQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto size-8 text-red-600" />
          <h2 className="mt-2 text-base font-bold text-red-900">
            Failed to load property delegation
          </h2>
          <p className="mt-1 text-xs text-red-700">
            {getApiErrorMessage(delegationsQuery.error)}
          </p>
          <Button
            onClick={() => void delegationsQuery.refetch()}
            variant="outline"
            className="mt-4 text-xs"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!delegation) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-2xs">
          <ShieldAlert className="mx-auto size-10 text-amber-600" />
          <h2 className="mt-3 text-lg font-bold text-slate-900">
            Delegation Not Found or Inactive
          </h2>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-600">
            You do not have an active delegation for this facility. Please accept the
            delegation invitation from your Dashboard or contact the Property Owner.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/manager/properties">
              <Button variant="outline" size="sm" className="text-xs">
                <ArrowLeft className="size-3.5 mr-1" />
                All Properties
              </Button>
            </Link>
            <Link href="/manager/dashboard">
              <Button size="sm" className="bg-[#064E3B] text-white hover:bg-emerald-900 text-xs">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const propertyName = delegation.property.name;
  const ownerName = delegation.provider?.fullName || "Property Principal";
  const resourceCount = resourcesQuery.data?.length ?? 0;
  const operational = propertyOperations(resourcesQuery.data ?? [], propertyBookings);
  const occupiedCount = operational.occupied;
  const availableCount = operational.available;
  const totalSpaces = operational.totalSpaces;
  const todayBookings = operational.todayBookings;
  const todayBookingsCount = todayBookings.length;
  const rawListings: ParkingListingDto[] = Array.isArray(listingsQuery.data) ? listingsQuery.data : [];
  const activeListing = rawListings.find((l: ParkingListingDto) => l.status === "ACTIVE");
  const hourlyRateDisplay = activeListing?.pricePerHourPaisa
    ? `৳${Math.round(Number(activeListing.pricePerHourPaisa) / 100)}`
    : "Not Set";
  const canPrice = can("PRICE_MANAGE");
  const resources = resourcesQuery.data ?? [];
  const propertyGuards = guardsQuery.data?.assignments ?? [];
  const vacancyPct = operational.vacancyPercent;

  return (
    <div className="flex flex-col min-h-full">
      {/* Top Persistent Header */}
      <ManagerHeader
        title={propertyName}
        subtitle={`Managing for ${ownerName} · ${delegation.property.publicArea}`}
        breadcrumbs={[
          { label: "Assigned Properties", href: "/manager/properties" },
          { label: propertyName },
        ]}
        rightExtra={
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
            Operational Feed Live
          </span>
        }
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Delegated Scope Banner matching property-details.png */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="size-4.5 text-[#064E3B] shrink-0" />
            <span className="font-medium">
              <strong>Delegated Scope:</strong> You can manage this property only within permissions granted by Property Owner {ownerName}.
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="rounded-full bg-white px-2.5 py-0.5 font-bold text-emerald-800 border border-emerald-200 shadow-2xs text-[11px]">
              {delegation.permissions.length} Granted · {14 - delegation.permissions.length} Restricted
            </span>

            <ViewAccessDialog
              delegation={delegation}
              trigger={
                <button
                  type="button"
                  className="font-bold text-[#064E3B] hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                >
                  Review Permissions <ArrowRight className="size-3.5" />
                </button>
              }
            />
          </div>
        </div>

        {/* 5 Stats Cards matching property-details.png */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {/* Total Spaces */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Spaces</span>
              <span className="font-bold text-xs text-slate-400">P</span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">
              {totalSpaces}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Capacity across {resourceCount} resources</p>
          </div>

          {/* Available */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800">Available</span>
              <span className="size-2 rounded-full bg-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-emerald-700">
              {availableCount}
            </div>
            <p className="mt-1 text-[11px] text-emerald-700 font-medium">{vacancyPct}% of active capacity unoccupied</p>
          </div>

          {/* Occupied */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800">Occupied</span>
              <span className="size-2 rounded-full bg-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-amber-700">
              {occupiedCount}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Active on-site</p>
          </div>

          {/* Today's Bookings */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Reservations</span>
              <Calendar className="size-3.5 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">
              {operational.activeReservations}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Active Bookings</p>
          </div>

          {/* Hourly Rate */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Standard Tariff</span>
              {canPrice ? (
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                  EDITABLE
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 border border-slate-200">
                  <Lock className="size-2.5" />
                  LOCKED
                </span>
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-slate-900">{hourlyRateDisplay}</span>
              {activeListing?.pricePerHourPaisa && (
                <span className="text-xs text-slate-500">/hr</span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {canPrice ? "Manager managed" : "Owner-controlled"}
            </p>
          </div>
        </div>

        {/* Operational Workspace Action Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 pb-2">
          <Button
            size="sm"
            variant={activeOperationalTab === "overview" ? "default" : "outline"}
            onClick={() => setActiveOperationalTab("overview")}
            className={`h-8 text-xs font-semibold ${
              activeOperationalTab === "overview"
                ? "bg-[#064E3B] text-white hover:bg-emerald-900"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Facility Overview
          </Button>

          <Button
            size="sm"
            variant={activeOperationalTab === "resources" ? "default" : "outline"}
            onClick={() => setActiveOperationalTab("resources")}
            className={`h-8 text-xs font-semibold ${
              activeOperationalTab === "resources"
                ? "bg-[#064E3B] text-white hover:bg-emerald-900"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Spaces &amp; Inventory ({resourceCount})
          </Button>

          <Button
            size="sm"
            variant={activeOperationalTab === "listings" ? "default" : "outline"}
            onClick={() => setActiveOperationalTab("listings")}
            className={`h-8 text-xs font-semibold ${
              activeOperationalTab === "listings"
                ? "bg-[#064E3B] text-white hover:bg-emerald-900"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Listings &amp; Tariffs
          </Button>

          <Button
            size="sm"
            variant={activeOperationalTab === "availability" ? "default" : "outline"}
            onClick={() => setActiveOperationalTab("availability")}
            className={`h-8 text-xs font-semibold ${
              activeOperationalTab === "availability"
                ? "bg-[#064E3B] text-white hover:bg-emerald-900"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Operating Hours &amp; Exceptions
          </Button>

          <Button
            size="sm"
            variant={activeOperationalTab === "bookings" ? "default" : "outline"}
            onClick={() => setActiveOperationalTab("bookings")}
            className={`h-8 text-xs font-semibold ${
              activeOperationalTab === "bookings"
                ? "bg-[#064E3B] text-white hover:bg-emerald-900"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Bookings Manifest
          </Button>

          <Button
            size="sm"
            variant={activeOperationalTab === "guards" ? "default" : "outline"}
            onClick={() => setActiveOperationalTab("guards")}
            className={`h-8 text-xs font-semibold ${
              activeOperationalTab === "guards"
                ? "bg-[#064E3B] text-white hover:bg-emerald-900"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Gate Guards
          </Button>

          <Button
            size="sm"
            variant={activeOperationalTab === "reports" ? "default" : "outline"}
            disabled={!can("REPORTS_VIEW")}
            onClick={() => setActiveOperationalTab("reports")}
            className={`h-8 text-xs font-semibold ${
              activeOperationalTab === "reports"
                ? "bg-[#064E3B] text-white hover:bg-emerald-900"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Facility Reports
          </Button>
        </div>

        {/* Tab 1: Overview matching property-details.png */}
        {activeOperationalTab === "overview" && (
          <div className="space-y-6">
            {/* Middle 2 Panels: Property Information vs Current Availability */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Property Information (7 cols) */}
              <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        Property Information
                      </h3>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        View Only
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      Modification restricted by Owner
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        PROPERTY
                      </span>
                      <span className="text-xs font-bold text-slate-800 mt-1 block">
                        {propertyName}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        ADDRESS
                      </span>
                      <span className="text-xs font-bold text-slate-800 mt-1 block">
                        {delegation.property.publicArea}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        TYPE
                      </span>
                      <span className="text-xs font-bold text-slate-800 mt-1 block">
                        {resources.some((r) => r.resourceType === "SHARED_POOL") ? "Shared / mixed parking" : "Fixed parking spaces"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        OPERATING HOURS
                      </span>
                      <span className="text-xs font-bold text-slate-800 mt-1 block">
                        See resource schedules
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                    <div>
                      <strong>Location:</strong> {delegation.property.approximateAddress || delegation.property.publicArea}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        {resources.some((r) => r.isCovered) ? "Covered" : "Cover not listed"}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        {resources.some((r) => r.hasCctv) ? "CCTV" : "CCTV not listed"}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        {resources.some((r) => r.hasGuard) ? "Guard" : "Guard not listed"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Availability (5 cols) */}
              <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-[#064E3B]" />
                      <h3 className="text-base font-bold text-slate-900">
                        Current Availability
                      </h3>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-[#064E3B] border border-emerald-200">
                      {activeListing ? "Published listing" : "No active listing"}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-extrabold text-slate-900">
                        {availableCount} of {operational.activeCapacity} unoccupied
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {vacancyPct}% Vacant · {occupiedCount} Occupied
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-500 space-y-0.5">
                      <div>
                        Next In: <strong className="text-slate-700">{nextArrival}</strong>
                      </div>
                      <div>
                        Next Out: <strong className="text-slate-700">{nextDeparture}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100">
                  <Button
                    onClick={() => setActiveOperationalTab("availability")}
                    className="w-full bg-[#064E3B] text-white hover:bg-emerald-900 font-semibold text-xs h-9 gap-1.5"
                  >
                    <SlidersHorizontal className="size-3.5" />
                    Manage Availability
                  </Button>
                </div>
              </div>
            </div>

            {/* Parking Spaces Preview Row */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-[#064E3B]" />
                  <h3 className="text-base font-bold text-slate-900">
                    Parking Resources (Showing {Math.min(4, resources.length)} of {resourceCount})
                  </h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveOperationalTab("resources")}
                  className="h-8 text-xs font-semibold text-slate-700 gap-1.5"
                >
                  <Settings className="size-3.5" />
                  Manage Spaces
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {resources.length === 0 ? (
                  <div className="col-span-full py-6 text-center text-xs text-slate-400">
                    No parking bays registered for this property yet.
                  </div>
                ) : (
                  resources.slice(0, 4).map((r) => {
                    const isOccupied = occupiedSpots.has(r.id);
                    return (
                      <div
                        key={r.id}
                        className={`rounded-xl border p-3.5 flex flex-col justify-between ${
                          isOccupied
                            ? "border-amber-200 bg-amber-50/40"
                            : "border-emerald-200 bg-emerald-50/40"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-extrabold text-slate-900 text-sm">
                              {r.spotCode || r.displayName || "Spot"}
                            </span>
                            <p className="text-[11px] text-slate-500">
                              {r.resourceType === "FIXED_SPACE" ? "Fixed Space" : "Shared Pool"} ·{" "}
                              {r.supportedVehicleTypes?.join(", ") || "Vehicle"}
                            </p>
                          </div>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              isOccupied
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {isOccupied ? "Occupied" : "Available"}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-700 mt-3">
                          {hourlyRateDisplay}/hr
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{availableCount} active spaces unoccupied; check schedule before booking</span>
                <button
                  type="button"
                  onClick={() => setActiveOperationalTab("resources")}
                  className="font-bold text-[#064E3B] hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                >
                  View All {resourceCount} Resources <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Today's Bookings Preview Row */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-[#064E3B]" />
                  <h3 className="text-base font-bold text-slate-900">Today&apos;s Bookings</h3>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                    {todayBookingsCount} Records today
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveOperationalTab("bookings")}
                  className="text-xs font-bold text-[#064E3B] hover:text-emerald-950 cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="mt-3 divide-y divide-slate-100">
                {todayBookings.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No reservations scheduled today.
                  </div>
                ) : (
                  todayBookings.slice(0, 5).map((b) => {
                    const driverName = b.driver?.fullName || "Guest Driver";
                    const startTime = new Date(b.startAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const endTime = new Date(b.effectiveEndAt || b.scheduledEndAt).toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    );
                    const bayName =
                      b.parkingSpot?.spotCode || b.parkingSpot?.displayName || "Assigned Bay";
                    const isActive =
                      b.status === "CHECKED_IN" || b.status === "CHECKOUT_REQUESTED";
                    const isUpcoming = b.status === "CONFIRMED";
                    const badgeColor = isActive
                      ? "bg-emerald-100 text-emerald-800"
                      : isUpcoming
                      ? "bg-blue-100 text-blue-800"
                      : "bg-slate-100 text-slate-700";
                    const statusText = b.status.replace("_", " ");
                    return (
                      <div
                        key={b.id}
                        className="flex items-center justify-between py-2.5 text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900">{driverName}</span>
                          <span className="text-slate-400 mx-1.5">·</span>
                          <span className="text-slate-500">
                            {startTime}–{endTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-600 font-semibold">
                            {bayName}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${badgeColor}`}
                          >
                            {statusText}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Bottom 2 Panels: Assigned Team vs Your Access */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Assigned Team (7 cols) */}
              <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-[#064E3B]" />
                      <h3 className="text-base font-bold text-slate-900">
                        Assigned Team
                      </h3>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        Delegated Scope
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {2 + propertyGuards.length} Personnel
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Logged in Manager */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#064E3B] text-white font-bold text-xs uppercase">
                        {(currentUser?.fullName || "MG").slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 text-xs block truncate">
                          {currentUser?.fullName || "Assigned Manager"}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700">
                          Delegated Manager
                        </span>
                      </div>
                    </div>

                    {/* Property Owner */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-xs uppercase">
                        {ownerName.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 text-xs block truncate">
                          {ownerName}
                        </span>
                        <span className="text-[11px] font-semibold text-blue-700">
                          Property Principal
                        </span>
                      </div>
                    </div>

                    {/* Guards */}
                    {propertyGuards.slice(0, 1).map((g) => {
                      const guardName = g.guard?.fullName || "Security Guard";
                      const isOnDuty = g.status === "ACTIVE";
                      return (
                        <div
                          key={g.id}
                          className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 flex items-center gap-3"
                        >
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-xs uppercase">
                            {guardName.slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 text-xs block truncate">
                              {guardName}
                            </span>
                            <span
                              className={`text-[11px] font-semibold ${
                                isOnDuty ? "text-emerald-700" : "text-slate-500"
                              }`}
                            >
                              {isOnDuty ? "Active assignment" : g.status.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {propertyGuards.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/30 p-3 flex items-center justify-center text-center">
                        <span className="text-[11px] text-slate-400">
                          No guards assigned
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <p className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                  Note: Security guard hiring and wage authorization is exclusively governed by {ownerName}.
                </p>
              </div>

              {/* Your Access (5 cols) */}
              <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-emerald-600" />
                      <h3 className="text-base font-bold text-slate-900">
                        Your Access
                      </h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      Property-Specific
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-800 block mb-1">
                        ✓ {delegation.permissions.length} Granted:
                      </span>
                      <ul className="space-y-1 text-slate-600 text-[11px]">
                        {ALL_OPERATIONAL_PERMISSIONS.filter((permission) => can(permission.key)).map((permission) => <li key={permission.key}>{permission.label}</li>)}
                      </ul>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-red-700 block mb-1">
                        ✕ {ALL_OPERATIONAL_PERMISSIONS.filter((permission) => !can(permission.key)).length} Restricted:
                      </span>
                      <ul className="space-y-1 text-slate-500 text-[11px]">
                        {ALL_OPERATIONAL_PERMISSIONS.filter((permission) => !can(permission.key)).map((permission) => <li key={permission.key}>{permission.label}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    Owner maintains tariff control
                  </span>
                  <ViewAccessDialog
                    delegation={delegation}
                    trigger={
                      <button
                        type="button"
                        className="font-bold text-[#064E3B] hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                      >
                        View Access Details <ArrowRight className="size-3.5" />
                      </button>
                    }
                  />
                </div>
              </div>
            </div>

            {/* Bottom Timeline Bar */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
              <div className="flex items-center gap-3 overflow-x-auto text-slate-600">
                <span className="font-bold text-slate-900 shrink-0">Recent Activity:</span>
                <span className="shrink-0 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-600" />
                  Facility Active: {availableCount} bays vacant · {occupiedCount} in stay
                </span>
                {propertyBookings[0] && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="shrink-0 flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-blue-600" />
                      Booking #{propertyBookings[0].bookingCode} ({propertyBookings[0].status.replace("_", " ")})
                    </span>
                  </>
                )}
                {propertyGuards[0] && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="shrink-0 flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-slate-400" />
                      Guard {propertyGuards[0].guard?.fullName || "Security"} ({propertyGuards[0].status.replace("_", " ")})
                    </span>
                  </>
                )}
              </div>
              <Link
                href="/manager/notifications"
                className="font-bold text-[#064E3B] hover:text-emerald-950 shrink-0 flex items-center gap-1"
              >
                Full Notifications <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Tab 2: Parking Resources Operational Editor */}
        {activeOperationalTab === "resources" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
            <ManagerResourcesSection
              propertyId={propertyId}
              resources={resourcesQuery.data ?? []}
              canManage={can("RESOURCE_MANAGE")}
              canListingManage={can("LISTING_MANAGE")}
            />
          </div>
        )}

        {/* Tab 3: Listings & Tariffs Editor */}
        {activeOperationalTab === "listings" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
            <ManagerListingsSection
              propertyId={propertyId}
              resourceIds={delegation.resourceIds}
              canManage={can("LISTING_MANAGE")}
              canPrice={can("PRICE_MANAGE")}
            />
          </div>
        )}

        {/* Tab 4: Availability Hours & Exceptions Editor */}
        {activeOperationalTab === "availability" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
            <ManagerAvailabilitySection
              resources={resourcesQuery.data ?? []}
              canManage={can("AVAILABILITY_MANAGE")}
            />
          </div>
        )}

        {/* Tab 5: Bookings Section */}
        {activeOperationalTab === "bookings" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
            <ManagerBookingsSection
              propertyId={propertyId}
              resourceIds={delegation.resourceIds}
            />
          </div>
        )}

        {/* Tab 6: Guards Section */}
        {activeOperationalTab === "guards" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
            <ManagerGuardsSection
              propertyId={propertyId}
              canAssign={can("GUARD_ASSIGN")}
              canAdd={can("GUARD_ADD_TO_PROPERTY")}
            />
          </div>
        )}

        {/* Tab 7: Reports Section */}
        {activeOperationalTab === "reports" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
            <ManagerReportsSection
              propertyId={propertyId}
              canEarnings={can("EARNINGS_VIEW")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
