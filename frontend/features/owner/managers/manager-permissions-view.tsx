"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  Eye,
  FileEdit,
  History,
  Info,
  Layers,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sliders,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { OwnerHeader } from "@/components/owner/owner-header";
import { Switch } from "@/components/ui/switch";
import {
  MOCK_OWNER_MANAGERS,
  MOCK_OWNER_PROPERTIES,
  OwnerManager,
  OwnerProperty,
  DEFAULT_MANAGER_PERMISSIONS,
  ManagerPermissions,
  countEnabledPermissions,
  countRestrictedPermissions,
} from "@/lib/data/mock-owner-data";

interface ManagerPermissionsViewProps {
  managerId: string;
}

// Preset definitions
type PresetType = "VIEW_ONLY" | "OPERATIONS" | "FULL_OPERATIONS" | "CUSTOM";

const PRESETS: Record<Exclude<PresetType, "CUSTOM">, ManagerPermissions> = {
  VIEW_ONLY: {
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
  },
  OPERATIONS: {
    canViewProperty: true,
    canEditProperty: false,
    canManageParkingSpaces: true,
    canManageAvailability: true,
    canManagePricing: false,
    canViewBookings: true,
    canManageBookings: true,
    canManageActiveSessions: true,
    canManageGuards: true,
    canRespondReviews: false,
  },
  FULL_OPERATIONS: {
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
  },
};

interface PermissionConfigItem {
  key: keyof ManagerPermissions;
  title: string;
  description: string;
  category: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PERMISSION_GROUPS: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  items: PermissionConfigItem[];
}[] = [
  {
    title: "1. Listing & Facilities Management",
    description: "Operational rights to view, update, and manage physical bay inventory.",
    icon: Building2,
    items: [
      {
        key: "canViewProperty",
        title: "View Property Information",
        description: "Access listing specifications, address details, geo-coordinates, and layout maps.",
        category: "Listing & Facilities",
        icon: Eye,
      },
      {
        key: "canEditProperty",
        title: "Edit Listing Description & Rules",
        description: "Update general operating instructions, height limits, amenities, and entry guidelines.",
        category: "Listing & Facilities",
        icon: FileEdit,
      },
      {
        key: "canManageParkingSpaces",
        title: "Bay & Spot Inventory Control",
        description: "Mark bays offline for maintenance, reconfigure numbering, and set vehicle slot types.",
        category: "Listing & Facilities",
        icon: Layers,
      },
      {
        key: "canManageAvailability",
        title: "Operating Schedule & Hours",
        description: "Open/close facility gates, schedule seasonal hours, and define planned closure periods.",
        category: "Listing & Facilities",
        icon: Calendar,
      },
    ],
  },
  {
    title: "2. Tariffs & Dynamic Rates",
    description: "Control over parking fees, peak multiplier configurations, and daily caps.",
    icon: DollarSign,
    items: [
      {
        key: "canManagePricing",
        title: "Base & Peak Hourly Tariffs",
        description: "Adjust standard base hourly parking rates and configure surge/peak demand multipliers.",
        category: "Pricing & Tariffs",
        badge: "Logged in Audit Ledger",
        icon: DollarSign,
      },
    ],
  },
  {
    title: "3. Driver Reservations & Gate Access",
    description: "Supervise incoming arrivals, confirm drive-in reservations, and handle dispute overrides.",
    icon: Users,
    items: [
      {
        key: "canViewBookings",
        title: "View Driver Reservations Feed",
        description: "Monitor real-time arrival logs, completed sessions, and upcoming vehicle reservations.",
        category: "Bookings & Gate",
        icon: Eye,
      },
      {
        key: "canManageBookings",
        title: "Manage & Confirm Bookings",
        description: "Process manual reservations, modify booking durations, and resolve driver cancellations.",
        category: "Bookings & Gate",
        icon: Sliders,
      },
      {
        key: "canManageActiveSessions",
        title: "Live Bay Entry & Gate Overrides",
        description: "Authorize driver arrival OTPs, check-in vehicles manually, and override gate barriers.",
        category: "Bookings & Gate",
        badge: "Critical Operation",
        icon: ShieldCheck,
      },
    ],
  },
  {
    title: "4. Staff & Guard Supervision",
    description: "Assign security personnel, schedule patrol shifts, and monitor gate attendance.",
    icon: Shield,
    items: [
      {
        key: "canManageGuards",
        title: "Security Guard Management",
        description: "Issue security guard gate credentials, assign shifts, and supervise check-in attendance.",
        category: "Staff & Guards",
        icon: Shield,
      },
    ],
  },
  {
    title: "5. Customer Experience & Reputation",
    description: "Manage driver public reviews, ratings, and customer feedback replies.",
    icon: MessageSquare,
    items: [
      {
        key: "canRespondReviews",
        title: "Customer Reviews & Replies",
        description: "Read driver parking ratings and publish official verified host replies on behalf of the location.",
        category: "Customer Experience",
        icon: MessageSquare,
      },
    ],
  },
];

export function ManagerPermissionsView({ managerId }: ManagerPermissionsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPropertyId = searchParams.get("propertyId");

  // Load manager from mock store
  const manager: OwnerManager = useMemo(() => {
    return (
      MOCK_OWNER_MANAGERS.find((m) => m.id === managerId) ||
      MOCK_OWNER_MANAGERS[0]
    );
  }, [managerId]);

  // Assigned properties list
  const assignedProperties: OwnerProperty[] = useMemo(() => {
    const list = MOCK_OWNER_PROPERTIES.filter((p) =>
      manager.assignedPropertyIds.includes(p.id)
    );
    return list.length > 0 ? list : [MOCK_OWNER_PROPERTIES[0]];
  }, [manager.assignedPropertyIds]);

  // Selected Property Tab state
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(() => {
    if (initialPropertyId && assignedProperties.some((p) => p.id === initialPropertyId)) {
      return initialPropertyId;
    }
    return assignedProperties[0]?.id || "prop-gulshan-1";
  });

  // Per-property permissions state map
  const [propertyPermissions, setPropertyPermissions] = useState<Record<string, ManagerPermissions>>(() => {
    const initial: Record<string, ManagerPermissions> = {};
    assignedProperties.forEach((prop) => {
      initial[prop.id] = { ...manager.permissions };
    });
    return initial;
  });

  // Current property object
  const activeProperty = useMemo(() => {
    return (
      assignedProperties.find((p) => p.id === selectedPropertyId) ||
      assignedProperties[0]
    );
  }, [assignedProperties, selectedPropertyId]);

  // Current permissions for the active property
  const currentPermissions = propertyPermissions[selectedPropertyId] || manager.permissions;

  // Track if unsaved changes exist
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [replicateModalOpen, setReplicateModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Determine which preset matches current permissions
  const activePreset: PresetType = useMemo(() => {
    const matches = (preset: ManagerPermissions) => {
      return (Object.keys(preset) as (keyof ManagerPermissions)[]).every(
        (key) => preset[key] === currentPermissions[key]
      );
    };

    if (matches(PRESETS.VIEW_ONLY)) return "VIEW_ONLY";
    if (matches(PRESETS.OPERATIONS)) return "OPERATIONS";
    if (matches(PRESETS.FULL_OPERATIONS)) return "FULL_OPERATIONS";
    return "CUSTOM";
  }, [currentPermissions]);

  // Toggle single permission for active property
  const handleTogglePermission = (key: keyof ManagerPermissions) => {
    setPropertyPermissions((prev) => ({
      ...prev,
      [selectedPropertyId]: {
        ...prev[selectedPropertyId],
        [key]: !prev[selectedPropertyId]?.[key],
      },
    }));
  };

  // Apply a preset to active property
  const handleApplyPreset = (presetKey: Exclude<PresetType, "CUSTOM">) => {
    setPropertyPermissions((prev) => ({
      ...prev,
      [selectedPropertyId]: { ...PRESETS[presetKey] },
    }));
    showToast(`Applied '${presetKey.replace("_", " ")}' preset to ${activeProperty.title}`);
  };

  // Reset active property to default baseline
  const handleResetToDefault = () => {
    setPropertyPermissions((prev) => ({
      ...prev,
      [selectedPropertyId]: { ...DEFAULT_MANAGER_PERMISSIONS },
    }));
    showToast(`Reset ${activeProperty.title} permissions to system default.`);
  };

  // Bulk replicate active permissions to ALL assigned properties
  const handleReplicateToAllProperties = () => {
    const activePerms = propertyPermissions[selectedPropertyId] || manager.permissions;
    const updated: Record<string, ManagerPermissions> = {};
    assignedProperties.forEach((p) => {
      updated[p.id] = { ...activePerms };
    });
    setPropertyPermissions(updated);
    setReplicateModalOpen(false);
    showToast(
      `Replicated permissions from ${activeProperty.title} across all ${assignedProperties.length} assigned properties.`
    );
  };

  // Save changes handler
  const handleSaveChanges = async () => {
    setIsSubmitting(true);
    // Simulate backend PATCH request
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSubmitting(false);
    showToast("Permissions updated and saved to audit ledger successfully.");
  };

  const enabledCount = countEnabledPermissions(currentPermissions);
  const totalCount = Object.keys(currentPermissions).length;
  const percentage = Math.round((enabledCount / totalCount) * 100);

  return (
    <div className="space-y-0 pb-20">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Confirmation Modal for Bulk Apply */}
      {replicateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5E7EB] space-y-4 animate-in zoom-in-95">
            <div className="size-11 rounded-xl bg-emerald-100 text-[#064E3B] flex items-center justify-center">
              <Sparkles className="size-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-slate-900">
                Apply to All Properties?
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                This will overwrite the permission configuration of all{" "}
                <strong>{assignedProperties.length} assigned properties</strong> with the
                current delegation settings of <strong>{activeProperty.title}</strong>.
              </p>
            </div>

            <div className="bg-[#f9f9ff] rounded-xl border border-[#E5E7EB] p-3 text-xs text-slate-600">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span>Active Delegations:</span>
                <span className="text-[#064E3B]">{enabledCount} of {totalCount} Enabled</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Zero financial delegation rule will continue to be strictly enforced.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setReplicateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReplicateToAllProperties}
                className="px-4 py-2 text-xs font-bold text-white bg-[#064E3B] hover:bg-emerald-900 rounded-lg transition shadow-xs cursor-pointer"
              >
                Yes, Apply to All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* HEADER WITH BREADCRUMBS                                           */}
      {/* ================================================================ */}
      <OwnerHeader
        title="Manage Manager Permissions"
        subtitle="Configure granular operational delegations and enforce strict RBAC boundaries."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Link
              href="/owner/managers"
              className="hover:text-[#064E3B] transition-colors"
            >
              Managers
            </Link>
            <ChevronRight className="size-3 text-slate-400" />
            <Link
              href={`/owner/managers/${manager.id}`}
              className="hover:text-[#064E3B] transition-colors"
            >
              {manager.name}
            </Link>
            <ChevronRight className="size-3 text-slate-400" />
            <span className="text-slate-800 font-semibold">Permissions</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/owner/managers/${manager.id}`}
              className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Overview</span>
            </Link>

            <Link
              href={`/owner/managers/${manager.id}/assignments`}
              className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Building2 className="size-3.5 text-slate-400" />
              <span>Manage Assignments</span>
            </Link>
          </div>
        }
      />

      {/* ================================================================ */}
      {/* SUB-HEADER MANAGER IDENTITY BANNER                                */}
      {/* ================================================================ */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 sm:px-6 lg:px-10 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-[#064E3B] text-white flex items-center justify-center font-bold font-heading text-lg shadow-2xs shrink-0 ring-4 ring-emerald-50">
              {manager.initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold font-heading text-slate-900">
                  {manager.name}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-[#064E3B] border border-emerald-200">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active Delegate
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  ID: {manager.id}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5 text-slate-400 shrink-0" />
                  {manager.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="size-3.5 text-slate-400 shrink-0" />
                  {manager.phone}
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <Building2 className="size-3.5 text-[#064E3B] shrink-0" />
                  Assigned to {assignedProperties.length} Properties
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setReplicateModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-[#064E3B] border border-emerald-200 hover:bg-emerald-100 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="size-3.5" />
              <span>Apply to All Properties</span>
            </button>

            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 text-slate-700 border border-[#E5E7EB] hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="size-3.5 text-slate-500" />
              <span>Reset to Default</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* MAIN CONTENT WORKSPACE                                           */}
      {/* ================================================================ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* ============================================================ */}
          {/* LEFT 2 COLS: TABS, PRESETS & PERMISSION SWITCHES             */}
          {/* ============================================================ */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* ---------------------------------------------------------- */}
            {/* 1. HORIZONTAL PROPERTY SELECTOR TABS                       */}
            {/* ---------------------------------------------------------- */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-[#064E3B]" />
                  <span className="font-heading font-bold text-sm text-slate-900">
                    Select Property to Configure
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {assignedProperties.length} Properties Supervised
                </span>
              </div>

              {/* Horizontal Scrollable Tabs */}
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-1">
                {assignedProperties.map((property) => {
                  const isSelected = property.id === selectedPropertyId;
                  const propPerms = propertyPermissions[property.id] || manager.permissions;
                  const propEnabledCount = countEnabledPermissions(propPerms);

                  return (
                    <button
                      key={property.id}
                      type="button"
                      onClick={() => setSelectedPropertyId(property.id)}
                      className={`group relative text-left p-3 rounded-xl border transition-all shrink-0 cursor-pointer min-w-[220px] ${
                        isSelected
                          ? "bg-emerald-50/60 border-[#064E3B] shadow-xs"
                          : "bg-white border-[#E5E7EB] hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-slate-900 truncate block">
                          {property.title}
                        </span>
                        {isSelected && (
                          <span className="size-2 rounded-full bg-[#064E3B] shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {property.area} • {property.totalSpaces} Bays
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100">
                        <span className="text-[10px] font-semibold text-slate-600">
                          {propEnabledCount} of {totalCount} Active
                        </span>
                        {isSelected ? (
                          <span className="text-[10px] font-extrabold text-[#064E3B] uppercase tracking-wider">
                            Currently Editing
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-600">
                            Switch Tab →
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ---------------------------------------------------------- */}
            {/* 2. PRESET SELECTION BAR                                    */}
            {/* ---------------------------------------------------------- */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="size-4 text-[#064E3B]" />
                    <span>Quick Permission Presets</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select a curated delegation profile or customize individual switches below.
                  </p>
                </div>
                {activePreset === "CUSTOM" && (
                  <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Custom Configuration
                  </span>
                )}
              </div>

              {/* Preset Buttons Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {/* View Only */}
                <button
                  type="button"
                  onClick={() => handleApplyPreset("VIEW_ONLY")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    activePreset === "VIEW_ONLY"
                      ? "bg-emerald-50 border-[#064E3B] shadow-xs"
                      : "bg-[#f9f9ff] border-[#E5E7EB] hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      View Only
                    </span>
                    {activePreset === "VIEW_ONLY" && (
                      <Check className="size-3.5 text-[#064E3B]" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                    Read-only visibility for listings & bookings feed.
                  </p>
                </button>

                {/* Operations */}
                <button
                  type="button"
                  onClick={() => handleApplyPreset("OPERATIONS")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    activePreset === "OPERATIONS"
                      ? "bg-emerald-50 border-[#064E3B] shadow-xs"
                      : "bg-[#f9f9ff] border-[#E5E7EB] hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      Operations (Recommended)
                    </span>
                    {activePreset === "OPERATIONS" && (
                      <Check className="size-3.5 text-[#064E3B]" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                    Day-to-day arrivals, bays, check-ins, and guard shifts.
                  </p>
                </button>

                {/* Full Operations */}
                <button
                  type="button"
                  onClick={() => handleApplyPreset("FULL_OPERATIONS")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    activePreset === "FULL_OPERATIONS"
                      ? "bg-emerald-50 border-[#064E3B] shadow-xs"
                      : "bg-[#f9f9ff] border-[#E5E7EB] hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      Full Operations
                    </span>
                    {activePreset === "FULL_OPERATIONS" && (
                      <Check className="size-3.5 text-[#064E3B]" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                    All operations + pricing adjustments & reviews.
                  </p>
                </button>
              </div>
            </div>

            {/* ---------------------------------------------------------- */}
            {/* 3. CATEGORIZED PERMISSIONS SWITCHES                        */}
            {/* ---------------------------------------------------------- */}
            <div className="space-y-5">
              {PERMISSION_GROUPS.map((group) => {
                const GroupIcon = group.icon;
                return (
                  <div
                    key={group.title}
                    className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-2xs space-y-4"
                  >
                    <div className="flex items-start gap-3 pb-3 border-b border-[#E5E7EB]">
                      <div className="size-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                        <GroupIcon className="size-4 text-[#064E3B]" />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-sm text-slate-900">
                          {group.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {group.description}
                        </p>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {group.items.map((item) => {
                        const isEnabled = Boolean(currentPermissions[item.key]);
                        const ItemIcon = item.icon;

                        return (
                          <div
                            key={item.key}
                            className="py-3.5 first:pt-1 last:pb-1 flex items-start justify-between gap-4 group"
                          >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div
                                className={`size-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                  isEnabled
                                    ? "bg-emerald-100 text-[#064E3B]"
                                    : "bg-slate-100 text-slate-400"
                                }`}
                              >
                                <ItemIcon className="size-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <label
                                    htmlFor={`perm-switch-${item.key}`}
                                    className="font-bold text-xs text-slate-900 cursor-pointer select-none"
                                  >
                                    {item.title}
                                  </label>
                                  {item.badge && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                      {item.badge}
                                    </span>
                                  )}
                                  {isEnabled ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Allowed
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                                      Restricted
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                  {item.description}
                                </p>
                              </div>
                            </div>

                            {/* Accessible Switch Component */}
                            <div className="shrink-0 pt-0.5">
                              <Switch
                                id={`perm-switch-${item.key}`}
                                checked={isEnabled}
                                onCheckedChange={() => handleTogglePermission(item.key)}
                                aria-label={item.title}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ---------------------------------------------------------- */}
            {/* 4. PERMANENT OWNER-ONLY RESTRICTIONS PANEL                  */}
            {/* ---------------------------------------------------------- */}
            <div className="bg-linear-to-br from-amber-500/5 via-slate-50 to-white rounded-2xl border border-amber-200/80 p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                  <Lock className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-bold text-sm text-slate-900">
                      Permanent Owner-Only Security Controls
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900">
                      Non-Delegable
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    For banking safety and fraud prevention, the following critical capabilities are strictly locked to the Property Owner account.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-white border border-amber-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Lock className="size-3 text-amber-600" />
                    <span>Payouts & Bank Accounts</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    bKash, Nagad, and bank account credentials can only be edited by the Property Owner.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-amber-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Lock className="size-3 text-amber-600" />
                    <span>Revenue Withdrawals</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Disbursal of parking earnings and wallet settlement remains exclusive to the Owner.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-amber-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Lock className="size-3 text-amber-600" />
                    <span>Property Transfer & Deletion</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Permanently deleting a property or shifting title ownership cannot be initiated by staff.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-amber-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Lock className="size-3 text-amber-600" />
                    <span>Manager Revocation</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Only the Property Owner can unassign, suspend, or invite new Managers to facilities.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* ============================================================ */}
          {/* RIGHT COL: STICKY DELEGATION SUMMARY SIDEBAR                 */}
          {/* ============================================================ */}
          <div className="space-y-6 sticky top-6">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <h3 className="font-heading font-bold text-sm text-slate-900">
                  Delegation Summary
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-[#064E3B]">
                  {activeProperty.title.split(",")[0]}
                </span>
              </div>

              {/* Scope Metrics */}
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 font-medium">Operational Scope:</span>
                  <span className="font-heading font-bold text-sm text-slate-900">
                    {enabledCount} of {totalCount} Enabled ({percentage}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-[#064E3B] transition-all duration-300 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              {/* Status checklist */}
              <div className="space-y-2 pt-2 text-xs text-slate-600">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span>Selected Facility:</span>
                  <strong className="text-slate-800">{activeProperty.title}</strong>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span>Total Bays Overseen:</span>
                  <strong className="text-slate-800">{activeProperty.totalSpaces} Bays</strong>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span>Audit Logging:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-emerald-600" />
                    Enforced
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span>Financial Isolation:</span>
                  <span className="font-bold text-amber-700 flex items-center gap-1">
                    <Lock className="size-3 text-amber-600" />
                    Strict 100%
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-[#E5E7EB] space-y-2.5">
                <button
                  type="button"
                  onClick={handleSaveChanges}
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
                      <span>Save Permissions</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setReplicateModalOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-50 hover:bg-emerald-100 text-[#064E3B] border border-emerald-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="size-3.5" />
                  <span>Apply Settings to All Properties</span>
                </button>

                <Link
                  href={`/owner/managers/${manager.id}`}
                  className="w-full py-2 px-4 rounded-xl font-semibold text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition"
                >
                  Cancel & Revert
                </Link>
              </div>
            </div>

            {/* Audit compliance note */}
            <div className="bg-[#f9f9ff] rounded-xl border border-[#E5E7EB] p-4 text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <History className="size-4 text-[#064E3B]" />
                <span>Cryptographic Audit Trail</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Every permission toggle is logged with the Property Owner timestamp and IP hash in accordance with ParkEase Security Governance.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
