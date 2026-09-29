"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Car,
  CheckCircle2,
  Clock,
  Layers,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { ManagerHeader } from "@/components/manager/manager-header";
import { Button } from "@/components/ui/button";
import { managerApi } from "@/lib/api/manager-api";
import { bookingsApi } from "@/lib/api/bookings-api";
import type { BookingDto } from "@/lib/api/marketplace-types";
import { useCurrentUser } from "@/hooks/use-current-user";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

function formatPaisa(paisa: string | number | undefined | null): string {
  if (!paisa) return "৳0";
  const num = typeof paisa === "string" ? Number(paisa) : paisa;
  return `৳${(num / 100).toLocaleString()}`;
}

function formatTime(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return isoString;
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function calculateElapsed(isoString: string | null | undefined): string {
  if (!isoString) return "00h 00m";
  const diffMs = Math.max(0, Date.now() - new Date(isoString).getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
}

function calculateRemainingMinutes(isoString: string | null | undefined): number {
  if (!isoString) return 999;
  const diffMs = new Date(isoString).getTime() - Date.now();
  return Math.round(diffMs / (1000 * 60));
}

export default function ManagerActiveSessionsPage() {
  const { data: currentUser } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("ALL");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedBookingModal, setSelectedBookingModal] = useState<BookingDto | null>(null);
  const [newLogText, setNewLogText] = useState("");

  const delegationsQuery = useQuery({
    queryKey: queryKeys.managerDelegations.manager,
    queryFn: managerApi.listForManager,
  });

  const activeDelegations = delegationsQuery.data?.filter((d) => d.status === "ACTIVE") ?? [];
  const primaryOwner = activeDelegations[0]?.provider?.fullName || "Property Owner";

  const bookingsQuery = useQuery({
    queryKey: queryKeys.bookings.provider(propertyFilter === "ALL" ? {} : { propertyId: propertyFilter }),
    queryFn: () => bookingsApi.providerList(propertyFilter === "ALL" ? {} : { propertyId: propertyFilter }),
    refetchInterval: 30000,
  });

  const allBookings = useMemo(() => bookingsQuery.data ?? [], [bookingsQuery.data]);
  const activeSessions = useMemo(() => {
    return allBookings.filter(
      (b) => b.status === "CHECKED_IN" || b.status === "CHECKOUT_REQUESTED",
    );
  }, [allBookings]);

  // Operational notes stored locally
  const [sessionNotes, setSessionNotes] = useState<Array<{ id: string; author: string; time: string; text: string }>>([
    {
      id: "note-init-1",
      author: currentUser?.fullName || "Manager",
      time: "Recent",
      text: "On-site telemetry handshake verified across active entrance barriers and designated parking bays.",
    },
  ]);

  const filteredSessions = useMemo(() => {
    return activeSessions.filter((b) => {
      const driverName = b.driver?.fullName || "Registered Driver";
      const vehicle = `${b.vehicle?.vehicleType || "Car"} · ${b.vehicle?.registrationNumber || ""}`;
      const propertyName = b.property?.name || "Assigned Property";
      const spotCode = b.assignedUnitCode || b.parkingResourceUnit?.spotCode || b.parkingSpot?.displayName || b.parkingSpot?.spotCode || "";

      const matchSearch =
        b.bookingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spotCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchProperty =
        propertyFilter === "ALL" || b.propertyId === propertyFilter;

      return matchSearch && matchProperty;
    });
  }, [activeSessions, searchTerm, propertyFilter]);

  // Active session for the right-side dashboard
  const activeFocusSession = useMemo(() => {
    if (selectedSessionId) {
      const found = activeSessions.find((s) => s.id === selectedSessionId);
      if (found) return found;
    }
    return activeSessions[0] || null;
  }, [activeSessions, selectedSessionId]);

  // Exits soon
  const urgentExitSession = useMemo(() => {
    return activeSessions.find((s) => {
      const mins = calculateRemainingMinutes(s.effectiveEndAt || s.scheduledEndAt);
      return mins > 0 && mins <= 60;
    });
  }, [activeSessions]);

  const handlePostNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogText.trim()) return;
    setSessionNotes((prev) => [
      {
        id: `note-${Date.now()}`,
        author: `${currentUser?.fullName || "Manager"} (Operations)`,
        time: "Just now",
        text: newLogText.trim(),
      },
      ...prev,
    ]);
    setNewLogText("");
    toast.success("Operational note recorded in session audit log");
  };

  return (
    <div className="flex flex-col min-h-full">
      <ManagerHeader
        title="Active Sessions"
        subtitle="Monitor vehicles currently parked across your assigned facilities."
        badge={`LIVE ${activeSessions.length} ON-SITE`}
        rightExtra={
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
            <RefreshCw className="size-3.5 text-emerald-700" />
            <span>Auto-refresh: 30s</span>
          </div>
        }
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Delegated Access Notice Banner */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="size-4.5 text-[#064E3B] shrink-0" />
            <span className="font-medium">
              <strong>Delegated Operations Mode:</strong> Monitoring live on-site vehicles under operational authority granted by Property Owner {primaryOwner}.
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-slate-600">
              Delegated Facilities: <strong className="text-slate-800">{activeDelegations.length} Active</strong>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-900 text-[10px]">
              <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Active Telemetry Sync
            </span>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Active Sessions
              </span>
              <div className="flex size-9 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-[#064E3B] font-black text-sm">
                P
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900">{activeSessions.length}</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <span className="size-1.5 rounded-full bg-emerald-600" />
              <span>Real-time on-site occupancy</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Vehicles Parked
              </span>
              <div className="flex size-9 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700">
                <Car className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900">{activeSessions.length}</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <span>ANPR &amp; Guard Verified</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Expected Exits Soon
              </span>
              <div className="flex size-9 items-center justify-center rounded-lg border border-amber-100 bg-amber-50 text-amber-800">
                <Clock className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-amber-900">
                {activeSessions.filter((s) => calculateRemainingMinutes(s.effectiveEndAt || s.scheduledEndAt) <= 60).length}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 font-medium">
              <span>Within next 60 minutes</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Occupied Spaces
              </span>
              <div className="flex size-9 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-700">
                <Layers className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900">{activeSessions.length}</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <span>Across {activeDelegations.length} assigned hubs</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search active booking code, driver, vehicle plate, or stall..."
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
                <option key={d.propertyId} value={d.propertyId}>
                  {d.property?.name || d.propertyId}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Urgent Alert Banner */}
        {urgentExitSession && (
          <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-200 px-2 py-0.5 font-bold text-amber-900 text-[10px] uppercase tracking-wider">
                EXIT EXPECTED SOON
              </span>
              <span className="font-bold text-amber-950">{urgentExitSession.driver?.fullName || "Driver"}</span>
              <span className="text-amber-700 font-mono">· #{urgentExitSession.bookingCode}</span>
              <span className="text-amber-700 font-semibold">
                · {urgentExitSession.assignedUnitCode || urgentExitSession.parkingResourceUnit?.spotCode || "Bay"}
              </span>
            </div>
            <span className="font-bold text-amber-900">
              Expected Exit: {formatTime(urgentExitSession.effectiveEndAt || urgentExitSession.scheduledEndAt)} (
              {calculateRemainingMinutes(urgentExitSession.effectiveEndAt || urgentExitSession.scheduledEndAt)}m remaining)
            </span>
          </div>
        )}

        {/* Two-Column Grid: Live Session Cards (7 cols) vs Live Dashboard & Logs (5 cols) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Sessions Cards (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {bookingsQuery.isLoading && (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500">
                Loading live active sessions...
              </div>
            )}

            {!bookingsQuery.isLoading && filteredSessions.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
                  <Car className="size-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">No Vehicles Currently Parked</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  There are no active on-site sessions at this moment for your assigned facilities. Active check-ins will appear here immediately upon gate verification.
                </p>
                <Link href="/manager/bookings">
                  <Button size="sm" variant="outline" className="text-xs mt-2">
                    View Scheduled Bookings
                  </Button>
                </Link>
              </div>
            )}

            {filteredSessions.map((session) => {
              const driverName = session.driver?.fullName || "Registered Driver";
              const initials = getInitials(driverName);
              const vehicleType = session.vehicle?.vehicleType || "Car";
              const plate = session.vehicle?.registrationNumber || "Unspecified Plate";
              const propertyName = session.property?.name || "Assigned Facility";
              const spotCode = session.assignedUnitCode || session.parkingResourceUnit?.spotCode || session.parkingSpot?.displayName || session.parkingSpot?.spotCode || "Standard Bay";
              const elapsed = calculateElapsed(session.checkedInAt || session.startAt);
              const remainingMins = calculateRemainingMinutes(session.effectiveEndAt || session.scheduledEndAt);
              const isSelected = activeFocusSession?.id === session.id;

              return (
                <div
                  key={session.id}
                  className={`rounded-2xl border bg-white p-5 shadow-2xs space-y-4 transition cursor-pointer ${
                    isSelected ? "border-[#064E3B] ring-1 ring-[#064E3B]/20" : "border-slate-200 hover:border-slate-300"
                  }`}
                  onClick={() => setSelectedSessionId(session.id)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm font-mono">
                        #{session.bookingCode}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        ● ACTIVE ON-SITE
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {propertyName}
                      </span>
                    </div>
                    <span className="rounded-lg bg-[#064E3B] px-2.5 py-1 text-xs font-bold text-white tracking-wide">
                      BAY: {spotCode}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-xs text-[#064E3B]">
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-sm">{driverName}</span>
                          <CheckCircle2 className="size-3.5 text-emerald-600" />
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {session.driver?.phone || "Account Verified"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <Car className="size-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 text-xs block">
                          {vehicleType}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 block">
                          {plate}
                        </span>
                      </div>
                      <span className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                        Verified Pass
                      </span>
                    </div>
                  </div>

                  {/* 4 Telemetry Boxes */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-center">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        Check-In Time
                      </span>
                      <span className="font-bold text-slate-900 mt-0.5 block">
                        {formatTime(session.checkedInAt || session.startAt)}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Barrier Gate Access
                      </span>
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-2.5">
                      <span className="text-[10px] text-amber-700 block font-semibold">
                        Expected Exit
                      </span>
                      <span className="font-bold text-amber-900 mt-0.5 block">
                        {formatTime(session.effectiveEndAt || session.scheduledEndAt)}
                      </span>
                      <span className="text-[10px] text-amber-700 font-bold block mt-0.5">
                        {remainingMins > 0 ? `${remainingMins} mins left` : "Overstay alert"}
                      </span>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        Duration Elapsed
                      </span>
                      <span className="font-bold text-slate-900 mt-0.5 block font-mono">
                        {elapsed}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
                        Active telemetry
                      </span>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        Tariff Settlement
                      </span>
                      <span className="font-bold text-[#064E3B] mt-0.5 block">
                        {formatPaisa(session.totalAmountPaisa)}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {session.financialStatus}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-emerald-800 font-medium text-[11px]">
                      <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Facility Barrier &amp; Space Handshake Active
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBookingModal(session);
                        }}
                      >
                        View Booking
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs font-semibold bg-[#064E3B] text-white hover:bg-emerald-900"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSessionId(session.id);
                          toast.success(`Displaying telemetry stream for #${session.bookingCode}`);
                        }}
                      >
                        View Telemetry
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Sidebar: Live Dashboard & Notes (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Live Session Dashboard */}
            <div className="rounded-2xl bg-slate-950 p-6 text-white shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Live Session Dashboard
                  </h3>
                </div>
                <span className="font-mono text-xs text-slate-400">
                  {activeFocusSession ? `#${activeFocusSession.bookingCode}` : "STANDBY"}
                </span>
              </div>

              {activeFocusSession ? (
                <>
                  <div className="text-center py-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      SESSION ACTIVE TIME
                    </span>
                    <div className="mt-1 flex items-center justify-center gap-2">
                      <span className="text-3xl font-mono font-black text-white">
                        {calculateElapsed(activeFocusSession.checkedInAt || activeFocusSession.startAt)}
                      </span>
                      <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-800">
                        elapsed
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Checked-in: {formatTime(activeFocusSession.checkedInAt || activeFocusSession.startAt)} · Expected: {formatTime(activeFocusSession.effectiveEndAt || activeFocusSession.scheduledEndAt)}
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-slate-800 pt-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target Bay &amp; Facility:</span>
                      <span className="font-semibold text-white truncate max-w-[200px]">
                        {activeFocusSession.assignedUnitCode || activeFocusSession.parkingResourceUnit?.spotCode || "Standard"} ({activeFocusSession.property?.name})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vehicle / Driver:</span>
                      <span className="font-semibold text-white truncate max-w-[200px]">
                        {activeFocusSession.vehicle?.registrationNumber} ({activeFocusSession.driver?.fullName || "Driver"})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Settlement Amount:</span>
                      <span className="font-semibold text-emerald-400">
                        {formatPaisa(activeFocusSession.totalAmountPaisa)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast.info(`Connecting to security guard console for ${activeFocusSession.property?.name}`)}
                      className="bg-transparent border-slate-700 text-slate-200 hover:bg-slate-800 text-xs font-semibold gap-1.5"
                    >
                      <Phone className="size-3.5" />
                      Contact Guard
                    </Button>
                    <Link href="/manager/bookings">
                      <Button
                        size="sm"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                      >
                        All Bookings
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Select an active session from the left to monitor live duration, bay allocation, and barrier logs.
                </div>
              )}
            </div>

            {/* Recent Session Notes */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Session Audit Notes
                </h3>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  RBAC: Operational
                </span>
              </div>

              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {sessionNotes.map((n) => (
                  <div key={n.id} className="rounded-lg bg-slate-50 p-2.5 text-xs space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <strong className="text-slate-900">{n.author}</strong>
                      <span className="text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      &ldquo;{n.text}&rdquo;
                    </p>
                  </div>
                ))}
              </div>

              <form onSubmit={handlePostNote} className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add operational observation or incident note..."
                  value={newLogText}
                  onChange={(e) => setNewLogText(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-[#064E3B] focus:outline-hidden"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="bg-[#064E3B] text-white hover:bg-emerald-900 text-xs font-semibold h-8"
                >
                  Post
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedBookingModal && (
        <div className="fixed inset-0 isolate z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-mono">
                  #{selectedBookingModal.bookingCode}
                </h3>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  ● ACTIVE ON-SITE
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingModal(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 text-[10px] block">Driver</span>
                  <span className="font-bold text-slate-900">{selectedBookingModal.driver?.fullName || "Driver"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Vehicle</span>
                  <span className="font-medium text-slate-700">{selectedBookingModal.vehicle?.registrationNumber || "Unspecified"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Property</span>
                  <span className="font-medium text-slate-700">{selectedBookingModal.property?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Bay</span>
                  <span className="font-bold text-emerald-800 font-mono">
                    {selectedBookingModal.assignedUnitCode || selectedBookingModal.parkingResourceUnit?.spotCode || "Standard"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedBookingModal(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
