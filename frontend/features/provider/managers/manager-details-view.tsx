"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit3,
  Lock,
  Mail,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
  X,
  XCircle,
} from "lucide-react";
import { OwnerHeader } from "@/components/provider/provider-header";
import {
  MOCK_OWNER_MANAGERS,
  MOCK_OWNER_PROPERTIES,
  OwnerManager,
  countEnabledPermissions,
} from "@/lib/data/mock-owner-data";

interface ManagerDetailsViewProps {
  managerId: string;
}

interface ManagerAuditLog {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  category: "BOOKING" | "OPERATION" | "GUARD" | "SYSTEM";
  propertyTitle: string;
  propertyArea: string;
}

const MOCK_MANAGER_AUDIT_LOGS: Record<string, ManagerAuditLog[]> = {
  "mgr-1": [
    {
      id: "log-101",
      title: "Manual Booking Override Approved",
      description: "Approved driver entry extension for spot 4 (#BK-7892).",
      timestamp: "18 mins ago",
      category: "BOOKING",
      propertyTitle: "Residential Building, Gulshan",
      propertyArea: "Gulshan-2",
    },
    {
      id: "log-102",
      title: "Bay Maintenance Status Updated",
      description: "Marked Bay 6 back to ACTIVE after surface line painting.",
      timestamp: "2 hours ago",
      category: "OPERATION",
      propertyTitle: "Office Parking, Banani",
      propertyArea: "Banani",
    },
    {
      id: "log-103",
      title: "Guard Shift Check-In Verified",
      description: "Confirmed digital check-in for Guard Tariqul Islam at Gate 2.",
      timestamp: "5 hours ago",
      category: "GUARD",
      propertyTitle: "Residential Building, Gulshan",
      propertyArea: "Gulshan-2",
    },
    {
      id: "log-104",
      title: "Customer Review Response Published",
      description: "Replied to 5-star driver feedback regarding covered parking.",
      timestamp: "Yesterday, 4:15 PM",
      category: "SYSTEM",
      propertyTitle: "Office Parking, Banani",
      propertyArea: "Banani",
    },
    {
      id: "log-105",
      title: "Gate Schedule Extended",
      description: "Adjusted Friday operating hours for weekend event traffic.",
      timestamp: "Sep 11, 2026",
      category: "OPERATION",
      propertyTitle: "Residential Building, Gulshan",
      propertyArea: "Gulshan-2",
    },
  ],
  "mgr-2": [
    {
      id: "log-201",
      title: "Hourly Tariff Multiplier Configured",
      description: "Updated peak surge pricing rule for Dhanmondi Hub.",
      timestamp: "35 mins ago",
      category: "OPERATION",
      propertyTitle: "Apartment Parking, Dhanmondi",
      propertyArea: "Dhanmondi",
    },
    {
      id: "log-202",
      title: "Bulk Reservation Verified",
      description: "Validated 3 corporate parking reservations for upcoming conference.",
      timestamp: "3 hours ago",
      category: "BOOKING",
      propertyTitle: "Residential Building, Gulshan",
      propertyArea: "Gulshan-2",
    },
    {
      id: "log-203",
      title: "Guard Duty Reassigned",
      description: "Assigned evening patrol shift to Guard Kamal Uddin.",
      timestamp: "Yesterday, 6:00 PM",
      category: "GUARD",
      propertyTitle: "Apartment Parking, Dhanmondi",
      propertyArea: "Dhanmondi",
    },
  ],
  "mgr-3": [
    {
      id: "log-301",
      title: "Manager Invitation Created",
      description: "Invitation dispatched to samiul@example.com with 48h activation token.",
      timestamp: "Today, 10:00 AM",
      category: "SYSTEM",
      propertyTitle: "Office Parking, Banani",
      propertyArea: "Banani",
    },
  ],
};

export function ManagerDetailsView({ managerId }: ManagerDetailsViewProps) {
  const router = useRouter();

  // Find manager or fallback to first
  const initialManager =
    MOCK_OWNER_MANAGERS.find((m) => m.id === managerId) ||
    MOCK_OWNER_MANAGERS[0];

  const [manager, setManager] = useState<OwnerManager>(initialManager);
  const [activityFilter, setActivityFilter] = useState<string>("ALL");

  // Modals state
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [editInfoModalOpen, setEditInfoModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Edit info fields
  const [editPhone, setEditPhone] = useState(manager.phone);
  const [editNotes, setEditNotes] = useState(manager.notes || "");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleToggleSuspend = () => {
    const newStatus = manager.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    setManager((prev) => ({ ...prev, status: newStatus }));
    setSuspendModalOpen(false);
    showToast(
      newStatus === "SUSPENDED"
        ? `Manager ${manager.name} has been suspended.`
        : `Manager ${manager.name} has been reactivated.`
    );
  };

  const handleRemoveManager = () => {
    setRemoveModalOpen(false);
    showToast(`Manager ${manager.name} has been removed.`);
    setTimeout(() => {
      router.push("/provider/managers");
    }, 1000);
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setManager((prev) => ({
      ...prev,
      phone: editPhone,
      notes: editNotes,
    }));
    setEditInfoModalOpen(false);
    showToast("Manager profile updated successfully.");
  };

  // Assigned properties list
  const assignedProperties = MOCK_OWNER_PROPERTIES.filter((p) =>
    manager.assignedPropertyIds.includes(p.id)
  );

  // Enabled / Restricted permissions counts
  const enabledPermCount = countEnabledPermissions(manager.permissions);
  const totalPermCount = Object.keys(manager.permissions).length;
  const permPercentage = Math.round((enabledPermCount / totalPermCount) * 100);

  // Audit logs for this manager
  const auditLogs = MOCK_MANAGER_AUDIT_LOGS[manager.id] || [];
  const filteredAuditLogs = auditLogs.filter((log) => {
    if (activityFilter === "ALL") return true;
    return log.category === activityFilter;
  });

  const isPending = manager.status === "PENDING_INVITATION";
  const isSuspended = manager.status === "SUSPENDED";

  return (
    <div className="space-y-0 pb-16">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ================================================================ */}
      {/* HEADER WITH BREADCRUMBS & TOP ACTIONS                             */}
      {/* ================================================================ */}
      <OwnerHeader
        title={manager.name}
        subtitle="Operational delegate overseeing assigned properties and live reservations."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Link
              href="/provider/managers"
              className="hover:text-[#064E3B] transition-colors"
            >
              Managers
            </Link>
            <ChevronRight className="size-3.5 text-slate-400" />
            <span className="font-bold text-slate-900">{manager.name}</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <Link
              href={`/provider/managers/${manager.id}/assignments`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-[#E5E7EB] rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <Building2 className="size-3.5 text-[#064E3B]" />
              <span>Edit Assignment</span>
            </Link>

            <Link
              href={`/provider/managers/${manager.id}/permissions`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#064E3B] hover:bg-emerald-900 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <ShieldCheck className="size-3.5" />
              <span>Manage Permissions</span>
            </Link>
          </div>
        }
      />

      {/* ================================================================ */}
      {/* SUB-HEADER PROFILE CARD                                          */}
      {/* ================================================================ */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 sm:px-6 lg:px-10 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="size-14 sm:size-16 rounded-2xl bg-[#064E3B] text-white flex items-center justify-center font-bold font-heading text-lg sm:text-xl shadow-2xs shrink-0 ring-4 ring-emerald-50">
              {manager.initials}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
                  {manager.name}
                </h1>

                {/* Status Badge */}
                {isSuspended ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    <span className="size-2 rounded-full bg-rose-500" />
                    Suspended
                  </span>
                ) : isPending ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    <Clock className="size-3 text-amber-600" />
                    Invitation Pending
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-[#064E3B] border border-emerald-200">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                )}

                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  {manager.role}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5 text-slate-400 shrink-0" />
                  {manager.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="size-3.5 text-slate-400 shrink-0" />
                  {manager.phone}
                </span>
                {manager.notes && (
                  <span className="hidden lg:inline text-slate-400">
                    • &ldquo;{manager.notes}&rdquo;
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setEditInfoModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
            >
              <Edit3 className="size-3.5 text-slate-500" />
              Edit Info
            </button>
            <Link
              href="/provider/managers"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
            >
              <ArrowLeft className="size-3.5" />
              All Managers
            </Link>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* MAIN CONTENT 2-COLUMN GRID                                       */}
      {/* ================================================================ */}
      <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ============================================================ */}
          {/* LEFT COLUMN: 2/3 (8 COLS) - METRICS, PROPERTIES & AUDIT LOGS */}
          {/* ============================================================ */}
          <div className="lg:col-span-8 space-y-8">
            {/* ---------------------------------------------------------- */}
            {/* SECTION 1: MANAGER OVERVIEW METRICS (3-COL GRID)           */}
            {/* ---------------------------------------------------------- */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Metric 1: Account Status */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Account Status
                </span>
                <div className="flex items-center gap-2">
                  <div
                    className={`size-2.5 rounded-full ${
                      isSuspended
                        ? "bg-rose-500"
                        : isPending
                        ? "bg-amber-500"
                        : "bg-emerald-500 animate-pulse"
                    }`}
                  />
                  <span className="font-heading font-extrabold text-lg text-slate-900">
                    {isSuspended
                      ? "Suspended"
                      : isPending
                      ? "Pending"
                      : "Operational"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {isPending
                    ? "Awaiting SMS verification"
                    : "Delegated credentials active"}
                </p>
              </div>

              {/* Metric 2: Member Since */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Member Since
                </span>
                <span className="font-heading font-extrabold text-lg text-slate-900 block">
                  {manager.joinedDate}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Onboarded by Parking Provider
                </p>
              </div>

              {/* Metric 3: Last Active */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Last Active
                </span>
                <span className="font-heading font-extrabold text-lg text-slate-900 block">
                  {manager.lastActive || "Pending First Login"}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  {manager.lastActive
                    ? "Authenticated session"
                    : "Invitation expires in 48h"}
                </p>
              </div>
            </div>

            {/* ---------------------------------------------------------- */}
            {/* SECTION 2: ASSIGNED PROPERTIES & PERMISSIONS               */}
            {/* ---------------------------------------------------------- */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-7 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E5E7EB] gap-3">
                <div>
                  <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
                    <Building2 className="size-5 text-[#064E3B]" />
                    Assigned Properties
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-[#064E3B]">
                      {assignedProperties.length}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Properties currently under this manager&apos;s active operational supervision.
                  </p>
                </div>

                <Link
                  href={`/provider/managers/${manager.id}/assignments`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-[#064E3B] hover:bg-emerald-100 transition-colors self-start sm:self-auto"
                >
                  <Plus className="size-3.5" />
                  <span>Add Property</span>
                </Link>
              </div>

              {assignedProperties.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-200">
                  <Building2 className="size-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    No properties currently assigned.
                  </p>
                  <Link
                    href={`/provider/managers/${manager.id}/assignments`}
                    className="mt-2 inline-block text-xs text-[#064E3B] font-bold hover:underline"
                  >
                    Assign a property now
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedProperties.map((property) => (
                    <div
                      key={property.id}
                      className="rounded-xl border border-[#E5E7EB] p-5 hover:border-slate-300 transition-all bg-[#ffffff] space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5">
                          <div className="size-11 rounded-xl bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0 mt-0.5">
                            <Building2 className="size-6" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-heading font-bold text-base text-slate-900">
                                {property.title}
                              </h3>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-[#064E3B] border border-emerald-200">
                                Manager Assignment: Active
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              {property.address} •{" "}
                              <strong className="text-slate-700">{property.area}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="text-left sm:text-right shrink-0">
                          <span className="text-xs font-extrabold text-slate-900 block">
                            {property.totalSpaces} Total Bays
                          </span>
                          <span className="text-[11px] text-emerald-700 font-semibold block">
                            {property.availableSpaces} Available Now
                          </span>
                          {property.ratePerHour && (
                            <span className="text-[11px] text-slate-400 block">
                              Base: {property.ratePerHour} BDT / hr
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Permission Summary Grid for this Property */}
                      <div className="pt-3 border-t border-[#E5E7EB]">
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Permission Summary for this Property
                          </span>
                          <Link
                            href={`/provider/managers/${manager.id}/permissions?propertyId=${property.id}`}
                            className="text-xs font-bold text-[#064E3B] hover:text-emerald-800 transition flex items-center gap-1"
                          >
                            <span>Customize Permissions</span>
                            <ChevronRight className="size-3" />
                          </Link>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                          {/* 1. View & Edit Property */}
                          <div
                            className={`flex items-center gap-1.5 p-2 rounded-lg ${
                              manager.permissions.canEditProperty
                                ? "bg-emerald-50 text-emerald-900"
                                : "bg-slate-50 text-slate-500"
                            }`}
                          >
                            {manager.permissions.canEditProperty ? (
                              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle className="size-3.5 text-rose-500 shrink-0" />
                            )}
                            <span className="truncate font-medium">
                              Listing Details
                            </span>
                          </div>

                          {/* 2. Manage Pricing */}
                          <div
                            className={`flex items-center gap-1.5 p-2 rounded-lg ${
                              manager.permissions.canManagePricing
                                ? "bg-emerald-50 text-emerald-900"
                                : "bg-rose-50/50 text-rose-800 border border-rose-100"
                            }`}
                          >
                            {manager.permissions.canManagePricing ? (
                              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle className="size-3.5 text-rose-500 shrink-0" />
                            )}
                            <span className="truncate font-medium">
                              {manager.permissions.canManagePricing
                                ? "Hourly Pricing"
                                : "Pricing: Restricted"}
                            </span>
                          </div>

                          {/* 3. Manage Bookings */}
                          <div
                            className={`flex items-center gap-1.5 p-2 rounded-lg ${
                              manager.permissions.canManageBookings
                                ? "bg-emerald-50 text-emerald-900"
                                : "bg-slate-50 text-slate-500"
                            }`}
                          >
                            {manager.permissions.canManageBookings ? (
                              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle className="size-3.5 text-rose-500 shrink-0" />
                            )}
                            <span className="truncate font-medium">
                              Manage Bookings
                            </span>
                          </div>

                          {/* 4. Live Sessions / Overrides */}
                          <div
                            className={`flex items-center gap-1.5 p-2 rounded-lg ${
                              manager.permissions.canManageActiveSessions
                                ? "bg-emerald-50 text-emerald-900"
                                : "bg-slate-50 text-slate-500"
                            }`}
                          >
                            {manager.permissions.canManageActiveSessions ? (
                              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle className="size-3.5 text-rose-500 shrink-0" />
                            )}
                            <span className="truncate font-medium">
                              Gate Check-In
                            </span>
                          </div>

                          {/* 5. Manage Guards */}
                          <div
                            className={`flex items-center gap-1.5 p-2 rounded-lg ${
                              manager.permissions.canManageGuards
                                ? "bg-emerald-50 text-emerald-900"
                                : "bg-slate-50 text-slate-500"
                            }`}
                          >
                            {manager.permissions.canManageGuards ? (
                              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle className="size-3.5 text-rose-500 shrink-0" />
                            )}
                            <span className="truncate font-medium">
                              Security Guards
                            </span>
                          </div>

                          {/* 6. Customer Reviews */}
                          <div
                            className={`flex items-center gap-1.5 p-2 rounded-lg ${
                              manager.permissions.canRespondReviews
                                ? "bg-emerald-50 text-emerald-900"
                                : "bg-slate-50 text-slate-500"
                            }`}
                          >
                            {manager.permissions.canRespondReviews ? (
                              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle className="size-3.5 text-rose-500 shrink-0" />
                            )}
                            <span className="truncate font-medium">
                              Driver Reviews
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ---------------------------------------------------------- */}
            {/* SECTION 3: RECENT MANAGER ACTIVITY (VERTICAL AUDIT LOGS)   */}
            {/* ---------------------------------------------------------- */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-7 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E5E7EB] gap-3">
                <div>
                  <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
                    <Activity className="size-5 text-[#064E3B]" />
                    Recent Manager Activity
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Immutable audit log of operational actions performed by this account.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto text-[11px] font-bold">
                  {["ALL", "BOOKING", "OPERATION", "GUARD"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActivityFilter(cat)}
                      className={`px-2.5 py-1 rounded-md transition ${
                        activityFilter === cat
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {cat === "ALL" ? "All" : cat.charAt(0) + cat.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {filteredAuditLogs.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-50 text-xs text-slate-500">
                  No activity logs match the selected filter.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {filteredAuditLogs.map((log) => (
                    <div key={log.id} className="relative group">
                      {/* Timeline dot */}
                      <span className="absolute -left-6 top-1 size-3 rounded-full bg-white border-2 border-[#064E3B] group-hover:scale-125 transition-transform" />

                      <div className="bg-[#f9f9ff] border border-[#E5E7EB] rounded-xl p-4 transition hover:border-slate-300">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <h4 className="text-xs font-bold text-slate-900">
                            {log.title}
                          </h4>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Clock className="size-3" />
                            {log.timestamp}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed mb-2">
                          {log.description}
                        </p>

                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">
                            <Building2 className="size-3 text-slate-500" />
                            {log.propertyTitle} ({log.propertyArea})
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT SIDEBAR: 1/3 (4 COLS) - ACCESS SUMMARY & ACTIONS       */}
          {/* ============================================================ */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* ---------------------------------------------------------- */}
            {/* CARD 1: ACCESS SUMMARY & STRICT ISOLATION                  */}
            {/* ---------------------------------------------------------- */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-2xs space-y-5">
              <div className="pb-4 border-b border-[#E5E7EB]">
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Access Summary
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assigned scope across your property portfolio.
                </p>
              </div>

              {/* Metrics */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Assigned Properties:</span>
                  <span className="font-bold text-slate-900">
                    {assignedProperties.length} Properties
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500 font-medium">Permissions Enabled:</span>
                    <span className="font-bold text-emerald-700">
                      {enabledPermCount} of {totalPermCount} active
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#064E3B] transition-all rounded-full"
                      style={{ width: `${permPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* STRICT SECURITY ISOLATION BOX (RED NOT ALLOWED ITEMS) */}
              <div className="pt-4 border-t border-[#E5E7EB] space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Lock className="size-3.5 text-rose-600" />
                  <span>Provider-Only Controls (Enforced)</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50/60 border border-rose-200/80 text-xs">
                    <span className="font-medium text-slate-800">Financial Access</span>
                    <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-[10px] uppercase tracking-wide">
                      Not Allowed
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50/60 border border-rose-200/80 text-xs">
                    <span className="font-medium text-slate-800">Provider Controls</span>
                    <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-[10px] uppercase tracking-wide">
                      Not Allowed
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50/60 border border-rose-200/80 text-xs">
                    <span className="font-medium text-slate-800">Payout & Bank Access</span>
                    <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-[10px] uppercase tracking-wide">
                      Not Allowed
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                  Payouts, bank accounts, bKash disbursement, and property provider
                  transfers are strictly restricted to the primary parking provider.
                </p>
              </div>
            </div>

            {/* ---------------------------------------------------------- */}
            {/* CARD 2: ACCOUNT & ACCESS ACTIONS                           */}
            {/* ---------------------------------------------------------- */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-2xs space-y-4">
              <h3 className="font-heading font-bold text-sm text-slate-900 pb-2 border-b border-[#E5E7EB]">
                Account & Access Actions
              </h3>

              <div className="space-y-2">
                <button
                  onClick={() => setEditInfoModalOpen(true)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Edit3 className="size-4 text-slate-500" />
                    Edit Profile & Notes
                  </span>
                  <ChevronRight className="size-3.5 text-slate-400" />
                </button>

                <Link
                  href={`/provider/managers/${manager.id}/assignments`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="size-4 text-[#064E3B]" />
                    Manage Property Assignments
                  </span>
                  <ChevronRight className="size-3.5 text-slate-400" />
                </Link>

                <Link
                  href={`/provider/managers/${manager.id}/permissions`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-[#064E3B]" />
                    Manage Permissions
                  </span>
                  <ChevronRight className="size-3.5 text-slate-400" />
                </Link>
              </div>

              {/* Destructive Actions Area */}
              <div className="pt-4 border-t border-[#E5E7EB] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Danger Zone
                </span>

                <button
                  onClick={() => setSuspendModalOpen(true)}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition border cursor-pointer ${
                    isSuspended
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                      : "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isSuspended ? (
                      <UserCheck className="size-4 text-emerald-600" />
                    ) : (
                      <UserX className="size-4 text-amber-700" />
                    )}
                    {isSuspended ? "Reactivate Manager" : "Suspend Manager"}
                  </span>
                  <span className="text-[10px] font-bold uppercase">
                    {isSuspended ? "Unfreeze" : "Freeze"}
                  </span>
                </button>

                <button
                  onClick={() => setRemoveModalOpen(true)}
                  className="w-full px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Trash2 className="size-4 text-rose-600" />
                    Remove Manager
                  </span>
                  <span className="text-[10px] font-bold uppercase text-rose-600">
                    Delete
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* MODAL 1: SUSPEND / REACTIVATE MANAGER                            */}
      {/* ================================================================ */}
      {suspendModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div
                className={`size-10 rounded-xl flex items-center justify-center ${
                  isSuspended
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900">
                  {isSuspended ? "Reactivate Manager?" : "Suspend Manager?"}
                </h3>
                <p className="text-xs text-slate-500">
                  Confirm status update for {manager.name}.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isSuspended
                ? `Reactivating ${manager.name} will restore their operational permissions across all assigned properties immediately.`
                : `Suspending ${manager.name} will immediately freeze their operational access across all assigned properties. Active driver sessions won't be disrupted.`}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSuspendModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleSuspend}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition ${
                  isSuspended
                    ? "bg-[#064E3B] hover:bg-emerald-900"
                    : "bg-amber-700 hover:bg-amber-800"
                }`}
              >
                {isSuspended ? "Confirm Reactivation" : "Confirm Suspension"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL 2: REMOVE MANAGER CONFIRMATION                             */}
      {/* ================================================================ */}
      {removeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <Trash2 className="size-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Remove Manager?
                </h3>
                <p className="text-xs text-slate-500">
                  Revoke all operational delegations.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-900">{manager.name}</strong>?
              They will be unassigned from <strong>{assignedProperties.length} properties</strong> and
              all operational access will be revoked permanently.
            </p>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800">
              Note: Unassigned properties will temporarily revert to provider-managed operations.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRemoveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveManager}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition"
              >
                Remove Manager
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL 3: EDIT PROFILE & NOTES                                    */}
      {/* ================================================================ */}
      {editInfoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2.5">
                <Edit3 className="size-4 text-[#064E3B]" />
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Edit Manager Details
                </h3>
              </div>
              <button
                onClick={() => setEditInfoModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInfo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name (Read-Only)
                </label>
                <input
                  type="text"
                  disabled
                  value={manager.name}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-slate-100 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address (Read-Only)
                </label>
                <input
                  type="email"
                  disabled
                  value={manager.email}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-slate-100 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:border-slate-400 text-xs text-slate-900 shadow-2xs focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Internal Operational Notes
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Notes on responsibilities, gates assigned, or shift contacts..."
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white hover:border-slate-400 text-xs text-slate-900 shadow-2xs focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditInfoModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#064E3B] hover:bg-emerald-900 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
