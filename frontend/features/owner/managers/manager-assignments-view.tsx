"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Info,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { OwnerHeader } from "@/components/owner/owner-header";
import {
  MOCK_OWNER_MANAGERS,
  MOCK_OWNER_PROPERTIES,
  OwnerManager,
  DEFAULT_MANAGER_PERMISSIONS,
  ManagerPermissions,
  countEnabledPermissions,
} from "@/lib/data/mock-owner-data";

interface ManagerAssignmentsViewProps {
  managerId: string;
}

interface PermissionItem {
  key: keyof ManagerPermissions;
  title: string;
  description: string;
}

const DEFAULT_ASSIGNMENT_PERMISSIONS: PermissionItem[] = [
  {
    key: "canViewProperty",
    title: "View Property Specs",
    description: "Access listing specifications, address details, and bay layouts.",
  },
  {
    key: "canEditProperty",
    title: "Edit Property Information",
    description: "Update general operating instructions and gate entry notes.",
  },
  {
    key: "canManageParkingSpaces",
    title: "Manage Parking Bays",
    description: "Mark spots offline or reconfigure bays for maintenance.",
  },
  {
    key: "canManageAvailability",
    title: "Schedule & Gate Hours",
    description: "Open/close facility gates and configure special closure hours.",
  },
  {
    key: "canManagePricing",
    title: "Hourly & Peak Rates",
    description: "Adjust standard base hourly tariff and peak multipliers.",
  },
  {
    key: "canViewBookings",
    title: "View All Bookings",
    description: "Monitor reservation arrival feeds and completed sessions.",
  },
  {
    key: "canManageBookings",
    title: "Manage & Confirm Bookings",
    description: "Process manual driver reservations and dispute adjustments.",
  },
  {
    key: "canManageActiveSessions",
    title: "Live Bay Check-In / Overrides",
    description: "Authorize OTP gate check-in and handle bay reassignments.",
  },
  {
    key: "canManageGuards",
    title: "Security Guards Management",
    description: "Issue guard gate credentials and manage patrol shifts.",
  },
  {
    key: "canRespondReviews",
    title: "Customer Reviews & Replies",
    description: "Review driver ratings and publish official host responses.",
  },
];

export function ManagerAssignmentsView({ managerId }: ManagerAssignmentsViewProps) {
  const router = useRouter();

  // Find manager or fallback
  const initialManager =
    MOCK_OWNER_MANAGERS.find((m) => m.id === managerId) ||
    MOCK_OWNER_MANAGERS[0];

  const [manager] = useState<OwnerManager>(initialManager);

  // Assigned property IDs state
  const [currentAssignedIds, setCurrentAssignedIds] = useState<string[]>(
    initialManager.assignedPropertyIds
  );
  const [newSelectedIds, setNewSelectedIds] = useState<string[]>([]);
  const [suspendedPropertyIds, setSuspendedPropertyIds] = useState<string[]>([]);

  // Default permissions for new properties
  const [newPermissions, setNewPermissions] = useState<ManagerPermissions>(
    DEFAULT_MANAGER_PERMISSIONS
  );

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Toggle selection for adding an unassigned property
  const handleToggleNewProperty = (propId: string) => {
    setNewSelectedIds((prev) =>
      prev.includes(propId) ? prev.filter((id) => id !== propId) : [...prev, propId]
    );
  };

  // Suspend/reactivate manager specifically on a property
  const handleToggleSuspendProperty = (propId: string) => {
    setSuspendedPropertyIds((prev) =>
      prev.includes(propId) ? prev.filter((id) => id !== propId) : [...prev, propId]
    );
    const isNowSuspended = !suspendedPropertyIds.includes(propId);
    showToast(
      isNowSuspended
        ? "Manager operational access suspended for this property."
        : "Manager operational access reactivated for this property."
    );
  };

  // Remove an assigned property from this manager
  const handleRemoveCurrentProperty = (propId: string) => {
    setCurrentAssignedIds((prev) => prev.filter((id) => id !== propId));
    setConfirmRemoveId(null);
    showToast("Property removed from this manager's assignment.");
  };

  // Toggle a default permission checkbox
  const handleTogglePermission = (key: keyof ManagerPermissions) => {
    setNewPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Apply preset permissions for new assignments
  const applyPreset = (preset: "STANDARD" | "ALL" | "VIEW_ONLY") => {
    if (preset === "STANDARD") {
      setNewPermissions(DEFAULT_MANAGER_PERMISSIONS);
    } else if (preset === "ALL") {
      setNewPermissions({
        canViewProperty: true,
        canEditProperty: true,
        canManageParkingSpaces: true,
        canManageAvailability: true,
        canManagePricing: true,
        canViewBookings: true,
        canManageBookings: true,
        canManageActiveSessions: true,
        canManageGuards: true,
        canRespondReviews: true,
      });
    } else if (preset === "VIEW_ONLY") {
      setNewPermissions({
        canViewProperty: true,
        canEditProperty: false,
        canManageParkingSpaces: false,
        canManageAvailability: false,
        canManagePricing: false,
        canViewBookings: true,
        canManageBookings: false,
        canManageActiveSessions: false,
        canManageGuards: false,
        canRespondReviews: false,
      });
    }
  };

  // Save changes
  const handleSaveAssignments = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      showToast("Property assignments updated successfully!");
      setTimeout(() => {
        router.push(`/owner/managers/${manager.id}`);
      }, 1000);
    }, 900);
  };

  // Derived properties
  const currentAssignedProperties = MOCK_OWNER_PROPERTIES.filter((p) =>
    currentAssignedIds.includes(p.id)
  );

  const unassignedProperties = MOCK_OWNER_PROPERTIES.filter(
    (p) => !currentAssignedIds.includes(p.id)
  );

  const newlySelectedProperties = MOCK_OWNER_PROPERTIES.filter((p) =>
    newSelectedIds.includes(p.id)
  );

  const totalPropertiesAfterSaving =
    currentAssignedIds.length + newSelectedIds.length;

  const totalBaysAfterSaving = [
    ...currentAssignedProperties,
    ...newlySelectedProperties,
  ].reduce((acc, p) => acc + p.totalSpaces, 0);

  const enabledNewPermsCount = countEnabledPermissions(newPermissions);

  return (
    <div className="space-y-0 pb-16">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ================================================================ */}
      {/* HEADER WITH BREADCRUMBS & TOP RIGHT ACTIONS                       */}
      {/* ================================================================ */}
      <OwnerHeader
        title="Manage Property Assignments"
        subtitle={`Configure property delegations and assign or unassign facilities for ${manager.name}.`}
        badge={
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Link
              href="/owner/managers"
              className="hover:text-[#064E3B] transition-colors"
            >
              Managers
            </Link>
            <ChevronRight className="size-3.5 text-slate-400" />
            <Link
              href={`/owner/managers/${manager.id}`}
              className="hover:text-[#064E3B] transition-colors"
            >
              {manager.name}
            </Link>
            <ChevronRight className="size-3.5 text-slate-400" />
            <span className="font-bold text-slate-900">Assignments</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <Link
              href={`/owner/managers/${manager.id}`}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-[#E5E7EB] rounded-lg transition shadow-2xs"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleSaveAssignments}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#064E3B] hover:bg-emerald-900 rounded-lg transition shadow-2xs disabled:opacity-70 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="size-3.5" />
                  <span>Save Assignments</span>
                </>
              )}
            </button>
          </div>
        }
      />

      {/* ================================================================ */}
      {/* READ-ONLY MANAGER PROFILE SNIPPET                                */}
      {/* ================================================================ */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 sm:px-6 lg:px-10 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-[#064E3B] text-white flex items-center justify-center font-bold font-heading text-sm shadow-2xs shrink-0">
              {manager.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-bold text-base text-slate-900">
                  {manager.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-[#064E3B]">
                  {manager.status === "ACTIVE" ? "Active" : "Pending"}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                  {manager.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                <span>{manager.email}</span>
                <span>•</span>
                <span>{manager.phone}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href={`/owner/managers/${manager.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
            >
              <ArrowLeft className="size-3.5" />
              Manager Overview
            </Link>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* MAIN 2-COLUMN WORKSPACE                                          */}
      {/* ================================================================ */}
      <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ============================================================ */}
          {/* LEFT COLUMN: 2/3 (8 COLS)                                    */}
          {/* ============================================================ */}
          <div className="lg:col-span-8 space-y-8">
            {/* ---------------------------------------------------------- */}
            {/* SECTION 1: CURRENT ASSIGNMENTS                             */}
            {/* ---------------------------------------------------------- */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-7 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
                    <Building2 className="size-5 text-[#064E3B]" />
                    Current Assignments
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                      {currentAssignedProperties.length}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Properties currently under {manager.name}&apos;s active operational delegation.
                  </p>
                </div>
              </div>

              {currentAssignedProperties.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-200">
                  <Building2 className="size-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    No properties currently assigned to this manager.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Select one or more properties from the list below to assign.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {currentAssignedProperties.map((property) => {
                    const isSuspendedOnProp = suspendedPropertyIds.includes(
                      property.id
                    );

                    return (
                      <div
                        key={property.id}
                        className={`rounded-xl border p-4.5 transition-all bg-white ${
                          isSuspendedOnProp
                            ? "border-amber-300 bg-amber-50/20"
                            : "border-[#E5E7EB] hover:border-slate-300"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex items-start gap-3.5">
                            <div
                              className={`size-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                isSuspendedOnProp
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-50 text-[#064E3B]"
                              }`}
                            >
                              <Building2 className="size-5" />
                            </div>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-heading font-bold text-sm text-slate-900">
                                  {property.title}
                                </h4>
                                {isSuspendedOnProp ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-amber-100 text-amber-900 border border-amber-200">
                                    Suspended on this Property
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-[#064E3B] border border-emerald-200">
                                    Assigned & Active
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {property.address} •{" "}
                                <strong className="text-slate-700">
                                  {property.area}
                                </strong>
                              </p>
                              <p className="text-[11px] text-slate-500 mt-1">
                                {property.totalSpaces} Bays total •{" "}
                                <span className="text-emerald-700 font-semibold">
                                  {property.availableSpaces} available
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Property Actions: Manage Permissions, Suspend, Remove */}
                          <div className="flex items-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <Link
                              href={`/owner/managers/${manager.id}/permissions?propertyId=${property.id}`}
                              className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-[11px] font-bold text-slate-700 transition"
                            >
                              Manage Permissions
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                handleToggleSuspendProperty(property.id)
                              }
                              className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                                isSuspendedOnProp
                                  ? "border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                                  : "border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100"
                              }`}
                            >
                              {isSuspendedOnProp ? "Reactivate" : "Suspend"}
                            </button>

                            <button
                              type="button"
                              onClick={() => setConfirmRemoveId(property.id)}
                              className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                              title="Remove from manager"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Confirmation Box for Removal */}
                        {confirmRemoveId === property.id && (
                          <div className="mt-3 p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in duration-150">
                            <p className="text-xs text-rose-800 font-medium">
                              Unassign <strong>{property.title}</strong> from{" "}
                              {manager.name}? Operational authority will revert to the owner.
                            </p>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setConfirmRemoveId(null)}
                                className="px-2.5 py-1 rounded text-xs font-semibold text-slate-600 hover:bg-white transition"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveCurrentProperty(property.id)
                                }
                                className="px-3 py-1 rounded text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer"
                              >
                                Confirm Remove
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ---------------------------------------------------------- */}
            {/* SECTION 2: ASSIGN MORE PROPERTIES                          */}
            {/* ---------------------------------------------------------- */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-7 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
                    <Plus className="size-5 text-[#064E3B]" />
                    Assign More Properties
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                      {unassignedProperties.length} Available
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select additional parking facilities to delegate to {manager.name}.
                  </p>
                </div>

                {newSelectedIds.length > 0 && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-[#064E3B]">
                    +{newSelectedIds.length} Selected
                  </span>
                )}
              </div>

              {unassignedProperties.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="size-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-800">
                    All Portfolio Properties Assigned
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Every property currently listed in your owner portfolio has been
                    assigned.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unassignedProperties.map((property) => {
                    const isSelected = newSelectedIds.includes(property.id);

                    return (
                      <div
                        key={property.id}
                        onClick={() => handleToggleNewProperty(property.id)}
                        className={`group p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                          isSelected
                            ? "border-[#064E3B] bg-emerald-50/40 ring-1 ring-[#064E3B]/20"
                            : "border-[#E5E7EB] bg-white hover:border-slate-300 hover:bg-slate-50/50"
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Checkbox square */}
                          <div
                            className={`size-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                              isSelected
                                ? "bg-[#064E3B] border-[#064E3B] text-white"
                                : "border-slate-300 bg-white group-hover:border-slate-400"
                            }`}
                          >
                            {isSelected && <Check className="size-3.5 stroke-[3]" />}
                          </div>

                          <div className="size-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
                            <Building2 className="size-5 text-[#064E3B]" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900 truncate">
                                {property.title}
                              </h4>
                              {isSelected && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-[#064E3B] font-heading">
                                  Selected to Add
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {property.address} • {property.area}
                            </p>
                            {property.managerName && (
                              <p className="text-[11px] text-amber-700 font-medium mt-1 flex items-center gap-1">
                                <Users className="size-3" />
                                Currently: {property.managerName} (will reassign to {manager.name})
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-block text-xs font-bold text-slate-800">
                            {property.totalSpaces} Bays
                          </span>
                          <span className="block text-[11px] text-slate-500">
                            {property.availableSpaces} Available
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ---------------------------------------------------------- */}
            {/* SECTION 3: DEFAULT PERMISSIONS FOR NEW PROPERTIES          */}
            {/* ---------------------------------------------------------- */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-7 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E5E7EB] gap-3">
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="size-5 text-[#064E3B]" />
                    Default Permissions for New Properties
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select baseline permissions to apply to newly assigned properties.
                  </p>
                </div>

                {/* Preset Pills */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => applyPreset("STANDARD")}
                    className="px-2.5 py-1 rounded-md text-slate-700 hover:bg-white hover:shadow-2xs transition"
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("ALL")}
                    className="px-2.5 py-1 rounded-md text-slate-700 hover:bg-white hover:shadow-2xs transition"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("VIEW_ONLY")}
                    className="px-2.5 py-1 rounded-md text-slate-700 hover:bg-white hover:shadow-2xs transition"
                  >
                    View Only
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DEFAULT_ASSIGNMENT_PERMISSIONS.map((perm) => {
                  const isChecked = newPermissions[perm.key];
                  return (
                    <label
                      key={perm.key}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? "border-emerald-200 bg-emerald-50/25"
                          : "border-[#E5E7EB] bg-white hover:bg-slate-50/70"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTogglePermission(perm.key)}
                        className="mt-1 size-4 rounded border-slate-300 text-[#064E3B] focus:ring-[#064E3B] cursor-pointer"
                      />
                      <div className="text-xs min-w-0">
                        <span className="font-bold text-slate-900 block truncate">
                          {perm.title}
                        </span>
                        <p className="text-slate-500 text-[11px] leading-relaxed mt-0.5">
                          {perm.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-start gap-3 text-xs text-emerald-900">
                <Info className="size-4 text-[#064E3B] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Granular custom control:</strong> After saving, you can customize
                  or restrict permissions for any specific property individually under the{" "}
                  <strong>Manage Permissions</strong> tab.
                </p>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT SIDEBAR: 1/3 (4 COLS) - STICKY ASSIGNMENT SUMMARY      */}
          {/* ============================================================ */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* Summary Card */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-2xs space-y-5">
              <div className="pb-4 border-b border-[#E5E7EB]">
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Assignment Summary
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Overview of changes to apply upon saving.
                </p>
              </div>

              {/* Counts Breakdown */}
              <div className="space-y-4">
                {/* 1. Current Assigned */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500 font-medium">Currently Assigned:</span>
                    <span className="font-bold text-slate-900">
                      {currentAssignedProperties.length} Properties
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {currentAssignedProperties.map((p) => (
                      <span
                        key={p.id}
                        className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700"
                      >
                        {p.area}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 2. Newly Selected */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500 font-medium">New Selected to Add:</span>
                    <span
                      className={`font-bold ${
                        newSelectedIds.length > 0
                          ? "text-emerald-700"
                          : "text-slate-400"
                      }`}
                    >
                      +{newSelectedIds.length} Properties
                    </span>
                  </div>
                  {newlySelectedProperties.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {newlySelectedProperties.map((p) => (
                        <span
                          key={p.id}
                          className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-[#064E3B] border border-emerald-200"
                        >
                          +{p.area}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      None selected to add
                    </p>
                  )}
                </div>

                {/* 3. Total After Saving */}
                <div className="pt-3 border-t border-[#E5E7EB]">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-700 font-bold">
                      Total After Saving:
                    </span>
                    <span className="font-heading font-extrabold text-base text-[#064E3B]">
                      {totalPropertiesAfterSaving} Properties
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Covering {totalBaysAfterSaving} parking bays in total portfolio.
                  </p>
                </div>

                {/* 4. Default Permissions Count */}
                <div className="pt-3 border-t border-[#E5E7EB]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      Baseline Permissions:
                    </span>
                    <span className="font-bold text-emerald-700">
                      {enabledNewPermsCount} of 10 enabled
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-[#E5E7EB] space-y-2.5">
                <button
                  type="button"
                  onClick={handleSaveAssignments}
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#064E3B] hover:bg-emerald-900 text-white flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-70 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      <span>Save Assignments</span>
                    </>
                  )}
                </button>

                <Link
                  href={`/owner/managers/${manager.id}`}
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition"
                >
                  Cancel & Revert
                </Link>
              </div>
            </div>

            {/* Architectural Rule Info Box */}
            <div className="bg-[#f9f9ff] rounded-xl border border-[#E5E7EB] p-4 text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Sparkles className="size-4 text-[#064E3B]" />
                <span>Manager Assignment Rules</span>
              </div>
              <ul className="text-[11px] text-slate-500 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>
                  <strong>1 Property = 1 Manager:</strong> Assigning a property that currently has another manager will immediately reassign it to {manager.name}.
                </li>
                <li>
                  <strong>Multi-Property Support:</strong> A single manager can supervise multiple facilities across different Dhaka zones.
                </li>
                <li>
                  <strong>Zero Financial Delegation:</strong> Payout accounts, tariffs withdrawal, and banking settings remain strictly owner-exclusive.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
