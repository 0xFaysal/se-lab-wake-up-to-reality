"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  CalendarDays,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Car,
  MapPin,
  Users,
  Zap,
  Plus,
  ArrowRight,
  UserCheck,
  Banknote,
  LayoutGrid,
  Sparkles,
  Ticket,
  Lock,
  FileQuestion,
  ShieldAlert,
  Wallet,
  TrendingUp,
  Sliders,
  AlertCircle,
  RefreshCw,
  Check,
  Radio,
  Eye,
  EyeOff,
} from "lucide-react";
import { OwnerHeader } from "@/components/owner/owner-header";
import {
  MOCK_OWNER_METRICS,
  MOCK_OWNER_PROPERTIES,
  MOCK_UPCOMING_BOOKINGS,
  MOCK_OWNER_ACTIVITIES,
} from "@/lib/data/mock-owner-data";
import safetyGarageImg from "@/assets/safety-garage.jpg";
import { usePermissions } from "@/lib/security/use-permissions";
import { PermissionGuard } from "@/lib/security/permission-guard";
import { NormalizedPermissions, AppPermission } from "@/lib/security/types";
import { auditLogger } from "@/lib/security/audit-logger";
import { Switch } from "@/components/ui/switch";

export interface OwnerDashboardViewProps {
  portalType?: "owner" | "manager";
  baseRoute?: string;
  permissions?: NormalizedPermissions | Partial<NormalizedPermissions>;
  allowFinancialAccess?: boolean;
}

export function OwnerDashboardView({
  portalType = "owner",
  baseRoute: customBaseRoute,
  permissions: propsPermissions,
}: OwnerDashboardViewProps) {
  const isManagerPortal = portalType === "manager";
  const baseRoute = customBaseRoute || (isManagerPortal ? "/manager" : "/owner");

  const context = usePermissions();
  const { manager, updatePermissionOverride } = context;

  // Merge context permissions with any direct props injection
  const effectivePermissions: NormalizedPermissions = propsPermissions
    ? ({ ...context.permissions, ...propsPermissions } as NormalizedPermissions)
    : context.permissions;

  // Local state for facility operational controls
  const [acceptingBookings, setAcceptingBookings] = useState(true);
  const [liveGateActive, setLiveGateActive] = useState(true);
  const [hourlyRate, setHourlyRate] = useState(60);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [tempRate, setTempRate] = useState(60);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [simulatorOpen, setSimulatorOpen] = useState(false);

  const primaryProperty = MOCK_OWNER_PROPERTIES[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handler for toggling Online Bookings availability
  const handleToggleBookings = (newVal: boolean) => {
    setAcceptingBookings(newVal);
    auditLogger.log({
      actionType: "UPDATE",
      actionDescription: `${manager?.name || "Manager"} ${
        newVal ? "ENABLED" : "PAUSED"
      } online booking reservations for '${primaryProperty.title}'`,
      resource: "PROPERTY_AVAILABILITY",
      resourceId: primaryProperty.id,
      managerId: manager?.id || "mgr-1",
      managerName: manager?.name || "Rahim Uddin",
      propertyId: primaryProperty.id,
      propertyName: primaryProperty.title,
      status: "SUCCESS",
      metadata: { previousStatus: acceptingBookings, newStatus: newVal },
    });
    showToast(`Online reservations ${newVal ? "enabled" : "paused"} & audit logged.`);
  };

  // Handler for toggling Live Gate automation
  const handleToggleGate = (newVal: boolean) => {
    setLiveGateActive(newVal);
    auditLogger.log({
      actionType: "UPDATE",
      actionDescription: `${manager?.name || "Manager"} ${
        newVal ? "ACTIVATED" : "DEACTIVATED"
      } automated RFID gate barrier for '${primaryProperty.title}'`,
      resource: "GATE_BARRIER_SESSION",
      resourceId: primaryProperty.id,
      managerId: manager?.id || "mgr-1",
      managerName: manager?.name || "Rahim Uddin",
      propertyId: primaryProperty.id,
      propertyName: primaryProperty.title,
      status: "SUCCESS",
      metadata: { liveGateActive: newVal },
    });
    showToast(`RFID automated barrier ${newVal ? "activated" : "deactivated"} & audit logged.`);
  };

  // Handler for saving Rate adjustment
  const handleSaveRate = () => {
    const prev = hourlyRate;
    setHourlyRate(tempRate);
    setIsEditingRate(false);
    auditLogger.log({
      actionType: "UPDATE",
      actionDescription: `${manager?.name || "Manager"} modified hourly parking tariff from ৳${prev} to ৳${tempRate} for '${primaryProperty.title}'`,
      resource: "PROPERTY_PRICING",
      resourceId: primaryProperty.id,
      managerId: manager?.id || "mgr-1",
      managerName: manager?.name || "Rahim Uddin",
      propertyId: primaryProperty.id,
      propertyName: primaryProperty.title,
      status: "SUCCESS",
      metadata: { previousRate: prev, newRate: tempRate },
    });
    showToast(`Tariff updated to ৳${tempRate}/hr & audit footprint recorded.`);
  };

  const handleAddBay = () => {
    auditLogger.log({
      actionType: "CREATE",
      actionDescription: `${manager?.name || "Manager"} initiated bay addition wizard for '${primaryProperty.title}'`,
      resource: "PARKING_BAY",
      resourceId: primaryProperty.id,
      managerId: manager?.id || "mgr-1",
      managerName: manager?.name || "Rahim Uddin",
      propertyId: primaryProperty.id,
      propertyName: primaryProperty.title,
      status: "SUCCESS",
    });
    showToast("Bay addition action logged to audit trail.");
  };

  const handleEditFacility = () => {
    auditLogger.log({
      actionType: "UPDATE",
      actionDescription: `${manager?.name || "Manager"} accessed facility configuration editor for '${primaryProperty.title}'`,
      resource: "PROPERTY_DETAILS",
      resourceId: primaryProperty.id,
      managerId: manager?.id || "mgr-1",
      managerName: manager?.name || "Rahim Uddin",
      propertyId: primaryProperty.id,
      propertyName: primaryProperty.title,
      status: "SUCCESS",
    });
    showToast("Facility modification intent recorded.");
  };

  return (
    <div className="flex flex-col min-h-full relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#064E3B] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl border border-emerald-700 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="size-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <OwnerHeader
        title={isManagerPortal ? "Manager Operations Overview" : "Overview"}
        subtitle={
          isManagerPortal
            ? `Welcome back, ${manager?.name || "Manager"} • Delegated operations across assigned facilities`
            : "Welcome back, here is your property portfolio summary"
        }
        badge={
          isManagerPortal ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-[#064E3B] border border-emerald-200">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Manager Operational Scope
            </span>
          ) : undefined
        }
      />

      {/* Main Content Area */}
      <div className="p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
        {/* Manager Portal Active Scope Alert Banner & RBAC Live Simulator */}
        {isManagerPortal && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0 border border-emerald-100">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 font-heading">
                    Role-Based Scope Active for {manager?.name || "Manager"}
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Supervising {manager?.assignedPropertyTitles?.join(", ") || "assigned locations"}. Financial payouts and bank accounts are isolated to the Property Owner.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSimulatorOpen(!simulatorOpen)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-[#064E3B] border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                >
                  <Sliders className="size-3.5" />
                  <span>{simulatorOpen ? "Hide RBAC Sandbox" : "Test RBAC Sandbox"}</span>
                </button>

                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                  <Lock className="size-3 text-amber-600" />
                  <span>Financial Isolation Active</span>
                </span>
              </div>
            </div>

            {/* Interactive DevSecOps RBAC Sandbox Panel */}
            {simulatorOpen && (
              <div className="mt-2 pt-3 border-t border-[#E5E7EB] bg-[#f9f9ff] rounded-xl p-3.5 space-y-3 border border-dashed border-emerald-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="size-4 text-[#064E3B]" />
                    <span className="text-xs font-extrabold text-slate-900 font-heading">
                      Live RBAC Simulator (Toggle Scopes to Test UI Behavior)
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">
                    Changes apply immediately to this session
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Toggle 1: Financial Access */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !effectivePermissions.financial_access;
                      updatePermissionOverride("financial_access", next);
                      showToast(`financial_access set to: ${next}`);
                    }}
                    className={`p-2 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
                      effectivePermissions.financial_access
                        ? "bg-emerald-50 border-emerald-300 text-[#064E3B]"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <span className="text-[11px] font-bold block">Financial Access</span>
                      <span className="text-[9px] opacity-75">Earnings / Payouts</span>
                    </div>
                    {effectivePermissions.financial_access ? (
                      <Eye className="size-3.5 text-emerald-600" />
                    ) : (
                      <EyeOff className="size-3.5 text-slate-400" />
                    )}
                  </button>

                  {/* Toggle 2: Pricing Manage */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !effectivePermissions.canManagePricing;
                      updatePermissionOverride("canManagePricing", next);
                      showToast(`canManagePricing set to: ${next}`);
                    }}
                    className={`p-2 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
                      effectivePermissions.canManagePricing
                        ? "bg-emerald-50 border-emerald-300 text-[#064E3B]"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <span className="text-[11px] font-bold block">Manage Pricing</span>
                      <span className="text-[9px] opacity-75">Tariff button</span>
                    </div>
                    {effectivePermissions.canManagePricing ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Lock className="size-3.5 text-amber-600" />
                    )}
                  </button>

                  {/* Toggle 3: Availability Manage */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !effectivePermissions.canManageAvailability;
                      updatePermissionOverride("canManageAvailability", next);
                      showToast(`canManageAvailability set to: ${next}`);
                    }}
                    className={`p-2 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
                      effectivePermissions.canManageAvailability
                        ? "bg-emerald-50 border-emerald-300 text-[#064E3B]"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <span className="text-[11px] font-bold block">Availability</span>
                      <span className="text-[9px] opacity-75">Reservation Switch</span>
                    </div>
                    {effectivePermissions.canManageAvailability ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Lock className="size-3.5 text-amber-600" />
                    )}
                  </button>

                  {/* Toggle 4: Gate Sessions Manage */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !effectivePermissions.canManageActiveSessions;
                      updatePermissionOverride("canManageActiveSessions", next);
                      showToast(`canManageActiveSessions set to: ${next}`);
                    }}
                    className={`p-2 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
                      effectivePermissions.canManageActiveSessions
                        ? "bg-emerald-50 border-emerald-300 text-[#064E3B]"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <span className="text-[11px] font-bold block">Gate Sessions</span>
                      <span className="text-[9px] opacity-75">RFID Barrier Switch</span>
                    </div>
                    {effectivePermissions.canManageActiveSessions ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Lock className="size-3.5 text-amber-600" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* 1. TOP METRICS ROW (4 Cards)                                         */}
        {/* ==================================================================== */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Metric 1: Active Listings */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs hover:shadow-xs transition-all flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading block">
                {isManagerPortal ? "Assigned Properties" : "Active Listings"}
              </span>
              <div className="text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                {isManagerPortal ? (manager?.assignedPropertyIds?.length || 2) : MOCK_OWNER_METRICS.activeListings.value}
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="size-3.5 text-emerald-600 stroke-[2.5]" />
                <span>{isManagerPortal ? "Active Supervision" : MOCK_OWNER_METRICS.activeListings.subtext}</span>
              </div>
            </div>

            <div className="size-11 rounded-xl bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0 border border-emerald-100">
              <Building2 className="size-5" />
            </div>
          </div>

          {/* Metric 2: Upcoming Bookings */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs hover:shadow-xs transition-all flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading block">
                Upcoming Bookings
              </span>
              <div className="text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                {MOCK_OWNER_METRICS.upcomingBookings.value}
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <Clock className="size-3.5 text-emerald-600 stroke-[2.5]" />
                <span>{MOCK_OWNER_METRICS.upcomingBookings.subtext}</span>
              </div>
            </div>

            <div className="size-11 rounded-xl bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0 border border-emerald-100">
              <Ticket className="size-5" />
            </div>
          </div>

          {/* Metric 3: Occupied Spaces */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs hover:shadow-xs transition-all flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading block">
                Occupied Spaces
              </span>
              <div className="text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                {MOCK_OWNER_METRICS.occupiedSpaces.value}
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                <Car className="size-3.5 text-amber-600" />
                <span>{MOCK_OWNER_METRICS.occupiedSpaces.subtext}</span>
              </div>
            </div>

            <div className="size-11 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-100">
              <Car className="size-5" />
            </div>
          </div>

          {/* Metric 4: Available Spaces */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs hover:shadow-xs transition-all flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading block">
                Available Spaces
              </span>
              <div className="text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                {MOCK_OWNER_METRICS.availableSpaces.value}
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="size-3.5 text-emerald-600 stroke-[2.5]" />
                <span>{MOCK_OWNER_METRICS.availableSpaces.subtext}</span>
              </div>
            </div>

            <div className="size-11 rounded-xl bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0 border border-emerald-100 font-bold font-mono text-base">
              P
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* FINANCIAL OVERVIEW SECTION (Strictly Hidden unless financial_access) */}
        {/* ==================================================================== */}
        <PermissionGuard requiredPermission="financial_access" fallbackMode="hide">
          <div className="bg-white rounded-2xl border border-emerald-200/90 p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0 border border-emerald-100">
                  <Banknote className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-bold text-base text-slate-900">
                      Financial Revenue & Disbursement Overview
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-[#064E3B] border border-emerald-200">
                      Financial Access Granted
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time net earnings, disbursement balance, and payout requests
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`${baseRoute}/payouts`}
                  className="px-3.5 py-1.5 rounded-xl bg-[#064E3B] hover:bg-[#064E3B]/90 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Wallet className="size-3.5" />
                  <span>Request Payout</span>
                </Link>
              </div>
            </div>

            {/* Financial Metrics 3-Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#f9f9ff] border border-[#E5E7EB]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Net Monthly Revenue
                </span>
                <div className="text-2xl font-extrabold text-[#064E3B] font-mono mt-1">
                  ৳ 1,48,500
                </div>
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mt-1">
                  <TrendingUp className="size-3 text-emerald-600" />
                  <span>+14.2% growth vs last month</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#f9f9ff] border border-[#E5E7EB]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Available Payout Balance
                </span>
                <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
                  ৳ 24,500
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 mt-1">
                  Ready for disbursement via City Bank #****4892
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#f9f9ff] border border-[#E5E7EB]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Gross Lifetime Volume
                </span>
                <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
                  ৳ 8,92,400
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 mt-1">
                  1,420 total reservations serviced
                </span>
              </div>
            </div>
          </div>
        </PermissionGuard>

        {/* ==================================================================== */}
        {/* 2. MIDDLE SECTION (Split: Facility Card & Quick Actions)             */}
        {/* ==================================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): Parking Spaces & Controls */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs space-y-5">
            {/* Card Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building2 className="size-5 text-[#064E3B]" />
                <h2 className="text-base font-bold text-slate-900 font-heading">
                  {isManagerPortal ? "Assigned Parking Facility" : "My Parking Spaces"}
                </h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                1 Facility Live
              </span>
            </div>

            {/* Inner Property Card */}
            <div className="rounded-xl border border-[#E5E7EB] p-4 sm:p-5 bg-white hover:border-emerald-700/40 transition-all flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                {/* Thumbnail with overlay tag */}
                <div className="relative w-full sm:w-36 h-32 sm:h-28 rounded-lg overflow-hidden shrink-0 border border-[#E5E7EB] bg-slate-100">
                  <Image
                    src={safetyGarageImg}
                    alt={primaryProperty.title}
                    fill
                    className="object-cover"
                  />
                  <span className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                    {primaryProperty.area}
                  </span>
                </div>

                {/* Property Details */}
                <div className="flex-1 min-w-0 space-y-2 w-full">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-heading font-bold text-base text-slate-900 truncate">
                        {primaryProperty.title}
                      </h3>
                      <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <MapPin className="size-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{primaryProperty.address}</span>
                      </p>
                    </div>

                    {/* Pricing */}
                    <div className="text-right shrink-0">
                      <span className="text-lg font-bold font-mono text-[#064E3B]">
                        ৳{hourlyRate}
                      </span>
                      <span className="text-xs text-slate-500">/hr</span>
                    </div>
                  </div>

                  {/* Metadata Pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
                      <Car className="size-3.5 text-slate-500" />
                      <span>{primaryProperty.totalSpaces} Car Spaces</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
                      <Users className="size-3.5 text-slate-500" />
                      <span>Manager: {primaryProperty.managerName}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                      <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      <span>Guard On Duty</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* ============================================================== */}
              {/* OPERATIONAL TOGGLES (Guarded by RBAC using PermissionGuard)    */}
              {/* ============================================================== */}
              <div className="pt-3 border-t border-[#E5E7EB] grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Accepting Online Bookings Switch */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Accept Reservations
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Live online booking status
                    </span>
                  </div>

                  <PermissionGuard
                    requiredPermission="canManageAvailability"
                    fallbackMode="disable"
                    fallbackMessage="Restricted: Requires 'canManageAvailability' scope to toggle reservation status. Contact Property Owner."
                  >
                    <Switch
                      checked={acceptingBookings}
                      onCheckedChange={handleToggleBookings}
                      aria-label="Toggle Online Reservations"
                    />
                  </PermissionGuard>
                </div>

                {/* 2. Live RFID Gate Check-in Switch */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Live RFID Gate Barrier
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Automated boom barrier
                    </span>
                  </div>

                  <PermissionGuard
                    requiredPermission="canManageActiveSessions"
                    fallbackMode="disable"
                    fallbackMessage="Restricted: Requires 'canManageActiveSessions' scope to toggle gate automation. Contact Property Owner."
                  >
                    <Switch
                      checked={liveGateActive}
                      onCheckedChange={handleToggleGate}
                      aria-label="Toggle RFID Gate Automation"
                    />
                  </PermissionGuard>
                </div>
              </div>

              {/* ============================================================== */}
              {/* OPERATIONAL ACTION BUTTONS (Guarded by RBAC)                    */}
              {/* ============================================================== */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                {/* Adjust Rate Button */}
                <PermissionGuard
                  requiredPermission="canManagePricing"
                  fallbackMode="disable"
                  fallbackMessage="Restricted: Requires 'canManagePricing' scope to modify hourly tariffs. Contact Property Owner."
                >
                  {isEditingRate ? (
                    <div className="inline-flex items-center gap-1.5 p-1 rounded-lg border border-emerald-300 bg-emerald-50">
                      <span className="text-xs font-bold text-[#064E3B] pl-1.5">৳</span>
                      <input
                        type="number"
                        value={tempRate}
                        onChange={(e) => setTempRate(Number(e.target.value))}
                        className="w-16 px-1.5 py-0.5 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded"
                        min={10}
                        max={500}
                      />
                      <button
                        type="button"
                        onClick={handleSaveRate}
                        className="px-2 py-0.5 bg-[#064E3B] text-white text-[11px] font-bold rounded hover:bg-emerald-800 transition cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingRate(false)}
                        className="px-1.5 py-0.5 text-slate-500 text-[11px] hover:text-slate-700 transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setTempRate(hourlyRate);
                        setIsEditingRate(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Sliders className="size-3 text-[#064E3B]" />
                      <span>Adjust Tariff (৳{hourlyRate}/hr)</span>
                    </button>
                  )}
                </PermissionGuard>

                {/* Add Parking Space Button */}
                <PermissionGuard
                  requiredPermission="canManageParkingSpaces"
                  fallbackMode="disable"
                  fallbackMessage="Restricted: Requires 'canManageParkingSpaces' scope to add parking bays. Contact Property Owner."
                >
                  <button
                    type="button"
                    onClick={handleAddBay}
                    className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Plus className="size-3 text-[#064E3B]" />
                    <span>Add Bay</span>
                  </button>
                </PermissionGuard>

                {/* Edit Facility Information Button */}
                <PermissionGuard
                  requiredPermission="canEditProperty"
                  fallbackMode="disable"
                  fallbackMessage="Restricted: Requires 'canEditProperty' scope to modify facility details. Contact Property Owner."
                >
                  <button
                    type="button"
                    onClick={handleEditFacility}
                    className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Building2 className="size-3 text-[#064E3B]" />
                    <span>Edit Facility</span>
                  </button>
                </PermissionGuard>
              </div>
            </div>

            {/* Bottom Card Footer */}
            <div className="pt-2 flex items-center justify-between text-xs border-t border-[#E5E7EB]">
              <span className="text-slate-500 font-medium">
                Supervising {primaryProperty.totalSpaces} registered parking bays
              </span>
              <PermissionGuard requiredPermission="canViewProperty" fallbackMode="disable">
                <Link
                  href={`${baseRoute}/properties`}
                  className="font-bold text-[#064E3B] hover:text-[#064E3B]/80 inline-flex items-center gap-1 transition-colors"
                >
                  <span>{isManagerPortal ? "View Assigned Listings" : "Manage Listings"}</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </PermissionGuard>
            </div>
          </div>

          {/* Right Column (5 cols): Quick Actions */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs space-y-5">
            {/* Card Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="size-5 text-[#064E3B]" />
                <h2 className="text-base font-bold text-slate-900 font-heading">
                  Quick Actions
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Frequent Tasks
              </span>
            </div>

            {/* 2x3 Grid of Action Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* 1. Add Space / Request Property */}
              {isManagerPortal ? (
                <Link
                  href="/manager/properties?action=request-approval"
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E7EB] hover:border-emerald-700/50 hover:bg-slate-50/70 transition-all text-left group shadow-2xs"
                >
                  <div className="size-8 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileQuestion className="size-4 stroke-[2.5]" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 font-heading group-hover:text-[#064E3B] leading-tight">
                    Request Property
                  </span>
                </Link>
              ) : (
                <Link
                  href="/owner/properties/new"
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E7EB] hover:border-emerald-700/50 hover:bg-slate-50/70 transition-all text-left group shadow-2xs"
                >
                  <div className="size-8 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Plus className="size-4 stroke-[2.5]" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 font-heading group-hover:text-[#064E3B] leading-tight">
                    Add Space
                  </span>
                </Link>
              )}

              {/* 2. Manage Listings */}
              <PermissionGuard requiredPermission="canViewProperty" fallbackMode="disable">
                <Link
                  href={`${baseRoute}/properties`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E7EB] hover:border-emerald-700/50 hover:bg-slate-50/70 transition-all text-left group shadow-2xs w-full"
                >
                  <div className="size-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Building2 className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 font-heading group-hover:text-[#064E3B] leading-tight">
                    Manage Listings
                  </span>
                </Link>
              </PermissionGuard>

              {/* 3. View Bookings */}
              <PermissionGuard requiredPermission="canViewBookings" fallbackMode="disable">
                <Link
                  href={`${baseRoute}/bookings`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E7EB] hover:border-emerald-700/50 hover:bg-slate-50/70 transition-all text-left group shadow-2xs w-full"
                >
                  <div className="size-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <CalendarDays className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 font-heading group-hover:text-[#064E3B] leading-tight">
                    View Bookings
                  </span>
                </Link>
              </PermissionGuard>

              {/* 4. Manage Guards */}
              <PermissionGuard requiredPermission="canManageGuards" fallbackMode="disable">
                <Link
                  href={`${baseRoute}/guards`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E7EB] hover:border-emerald-700/50 hover:bg-slate-50/70 transition-all text-left group shadow-2xs w-full"
                >
                  <div className="size-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 font-heading group-hover:text-[#064E3B] leading-tight">
                    Manage Guards
                  </span>
                </Link>
              </PermissionGuard>

              {/* 5. Manage Managers (Strictly Hidden for Managers) */}
              {!isManagerPortal && (
                <Link
                  href="/owner/managers"
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E7EB] hover:border-emerald-700/50 hover:bg-slate-50/70 transition-all text-left group shadow-2xs"
                >
                  <div className="size-8 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Users className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 font-heading group-hover:text-[#064E3B] leading-tight">
                    Manage Managers
                  </span>
                </Link>
              )}

              {/* 6. View Earnings (Strictly Hidden for Managers unless financial_access is granted) */}
              <PermissionGuard requiredPermission="financial_access" fallbackMode="hide">
                <Link
                  href={`${baseRoute}/earnings`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E7EB] hover:border-emerald-700/50 hover:bg-slate-50/70 transition-all text-left group shadow-2xs"
                >
                  <div className="size-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Banknote className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 font-heading group-hover:text-[#064E3B] leading-tight">
                    View Earnings
                  </span>
                </Link>
              </PermissionGuard>

              {/* Substitute card for Managers: Live Gate Sessions */}
              {isManagerPortal && (
                <PermissionGuard requiredPermission="canManageActiveSessions" fallbackMode="disable">
                  <Link
                    href={`${baseRoute}/sessions`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E7EB] hover:border-emerald-700/50 hover:bg-slate-50/70 transition-all text-left group shadow-2xs w-full"
                  >
                    <div className="size-8 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Zap className="size-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 font-heading group-hover:text-[#064E3B] leading-tight">
                      Gate Sessions
                    </span>
                  </Link>
                </PermissionGuard>
              )}
            </div>

            {/* Bottom Card Footer */}
            <div className="pt-2 flex items-center justify-between text-xs border-t border-[#E5E7EB]">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                <span className="size-1.5 rounded-full bg-emerald-600" />
                {isManagerPortal ? "RBAC Enforced" : "System operational"}
              </span>
              <span className="text-slate-400">
                {isManagerPortal ? "Permissions Scoped" : "All permissions active"}
              </span>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* 3. BOTTOM SECTION (Split: Upcoming Bookings & Recent Activity)       */}
        {/* ==================================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): Upcoming Bookings */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs space-y-5">
            {/* Card Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CalendarDays className="size-5 text-[#064E3B]" />
                <h2 className="text-base font-bold text-slate-900 font-heading">
                  Upcoming Bookings
                </h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                3 Scheduled
              </span>
            </div>

            {/* Bookings List */}
            <div className="space-y-3">
              {MOCK_UPCOMING_BOOKINGS.map((booking) => {
                const isPending = booking.status === "PENDING_ENTRY";

                return (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-[#E5E7EB] hover:border-slate-300 bg-white transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Initials Avatar */}
                      <div
                        className={`size-10 rounded-xl font-bold font-heading text-xs flex items-center justify-center shrink-0 ${
                          isPending
                            ? "bg-amber-100 text-amber-900"
                            : "bg-emerald-100 text-[#064E3B]"
                        }`}
                      >
                        {booking.driverInitials}
                      </div>

                      {/* Driver & Schedule */}
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 font-heading truncate">
                          {booking.driverName}
                        </h4>
                        <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <Clock className="size-3 text-slate-400 shrink-0" />
                          <span>
                            {booking.dateStr}, {booking.timeStr}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0 ml-3">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          isPending
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        {isPending ? "Pending Entry" : "Confirmed"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Card Footer */}
            <div className="pt-2 flex items-center justify-end text-xs border-t border-[#E5E7EB]">
              <PermissionGuard requiredPermission="canViewBookings" fallbackMode="disable">
                <Link
                  href={`${baseRoute}/bookings`}
                  className="font-bold text-[#064E3B] hover:text-[#064E3B]/80 inline-flex items-center gap-1 transition-colors"
                >
                  <span>View All Bookings</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </PermissionGuard>
            </div>
          </div>

          {/* Right Column (5 cols): Recent Activity Timeline */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs space-y-5">
            {/* Card Header */}
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-[#064E3B]" />
              <h2 className="text-base font-bold text-slate-900 font-heading">
                Recent Activity
              </h2>
            </div>

            {/* Vertical Timeline */}
            <div className="relative pl-5 space-y-5 border-l-2 border-slate-100 ml-2">
              {MOCK_OWNER_ACTIVITIES.map((activity) => {

                const isEmerald =
                  activity.type === "manager" || activity.type === "booking";

                const nodeColor =
                  activity.type === "manager"
                    ? "bg-[#064E3B]"
                    : activity.type === "booking"
                    ? "bg-emerald-600"
                    : activity.type === "guard"
                    ? "bg-indigo-600"
                    : "bg-slate-400";

                return (
                  <div key={activity.id} className="relative">
                    {/* Timeline Node Dot */}
                    <span
                      className={`absolute -left-[27px] top-1 size-3 rounded-full ring-4 ring-white ${nodeColor}`}
                    />

                    {/* Activity Content */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 font-heading">
                            {activity.title}
                          </h4>
                          {activity.type === "manager" && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Manager
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {activity.description}
                        </p>
                      </div>

                      <span className="text-[11px] text-slate-400 font-medium shrink-0">
                        {activity.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Card Footer */}
            <div className="pt-2 flex items-center justify-end text-xs border-t border-[#E5E7EB]">
              <Link
                href={`${baseRoute}/notifications`}
                className="font-bold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 transition-colors"
              >
                <span>Full Log</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// Canonical alias export as specified in requirement
export const OwnerDashboardComponent = OwnerDashboardView;
