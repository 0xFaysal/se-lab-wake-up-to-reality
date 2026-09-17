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
  Clock,
  Info,
  Lock,
  Mail,
  Phone,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { OwnerHeader } from "@/components/owner/owner-header";
import {
  MOCK_OWNER_PROPERTIES,
  DEFAULT_MANAGER_PERMISSIONS,
  ManagerPermissions,
  countEnabledPermissions,
} from "@/lib/data/mock-owner-data";

interface PermissionItem {
  key: keyof ManagerPermissions;
  title: string;
  description: string;
  recommended?: boolean;
}

const PROPERTY_PERMISSIONS: PermissionItem[] = [
  {
    key: "canViewProperty",
    title: "View Property Details",
    description: "View parking facility specs, space counts, address, and live facility status.",
    recommended: true,
  },
  {
    key: "canEditProperty",
    title: "Edit Property Information",
    description: "Update property descriptions, amenities, gate directions, and operational instructions.",
    recommended: true,
  },
  {
    key: "canManageParkingSpaces",
    title: "Manage Parking Bays",
    description: "Add, reconfigure, or mark individual parking spots as offline for maintenance.",
    recommended: true,
  },
  {
    key: "canManageAvailability",
    title: "Schedule & Operating Hours",
    description: "Control lot open/close hours, weekly schedules, and temporary holiday closures.",
    recommended: true,
  },
  {
    key: "canManagePricing",
    title: "Manage Pricing & Rates",
    description: "Configure hourly base rates, peak surcharge multipliers, and seasonal adjustments.",
    recommended: false,
  },
];

const BOOKING_PERMISSIONS: PermissionItem[] = [
  {
    key: "canViewBookings",
    title: "View All Bookings",
    description: "Access incoming, ongoing active, and historical driver reservation logs.",
    recommended: true,
  },
  {
    key: "canManageBookings",
    title: "Manage & Confirm Bookings",
    description: "Process manual approvals, resolve booking conflicts, and approve extensions.",
    recommended: true,
  },
  {
    key: "canManageActiveSessions",
    title: "Live Bay Check-In / Overrides",
    description: "Verify digital OTP passes, handle vehicle entry/exit overrides, and manage bay allocation.",
    recommended: true,
  },
];

const TEAM_PERMISSIONS: PermissionItem[] = [
  {
    key: "canManageGuards",
    title: "Manage Security Guards",
    description: "Assign on-duty shifts, issue gate credentials, and monitor guard check-ins.",
    recommended: false,
  },
  {
    key: "canRespondReviews",
    title: "Customer Reviews & Ratings",
    description: "View driver satisfaction ratings, review feedback, and post official replies.",
    recommended: false,
  },
];

export function AddManagerWizard() {
  const router = useRouter();

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+880 ");
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([
    "prop-banani-2",
  ]);
  const [permissions, setPermissions] = useState<ManagerPermissions>(
    DEFAULT_MANAGER_PERMISSIONS
  );
  const [personalMessage, setPersonalMessage] = useState("");

  // Validation & UI states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Toggle property selection
  const handleToggleProperty = (propId: string) => {
    setSelectedPropertyIds((prev) =>
      prev.includes(propId)
        ? prev.filter((id) => id !== propId)
        : [...prev, propId]
    );
  };

  // Toggle individual permission
  const handleTogglePermission = (key: keyof ManagerPermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Permission Presets
  const applyPreset = (preset: "ALL" | "OPERATIONS" | "VIEW_ONLY" | "CLEAR") => {
    if (preset === "ALL") {
      const allTrue: ManagerPermissions = {
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
      };
      setPermissions(allTrue);
    } else if (preset === "OPERATIONS") {
      setPermissions(DEFAULT_MANAGER_PERMISSIONS);
    } else if (preset === "VIEW_ONLY") {
      setPermissions({
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
    } else if (preset === "CLEAR") {
      setPermissions({
        canViewProperty: false,
        canEditProperty: false,
        canManageParkingSpaces: false,
        canManageAvailability: false,
        canManagePricing: false,
        canViewBookings: false,
        canManageBookings: false,
        canManageActiveSessions: false,
        canManageGuards: false,
        canRespondReviews: false,
      });
    }
  };

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!phone.trim() || phone.trim() === "+880") {
      newErrors.phone = "Phone number is required";
    } else if (phone.replace(/\D/g, "").length < 11) {
      newErrors.phone = "Please enter a valid 11-digit Bangladeshi mobile number";
    }

    if (selectedPropertyIds.length === 0) {
      newErrors.properties = "Please assign at least one property to this manager";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendInvitation = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to top of form
      window.scrollTo({ top: 100, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1200);
  };

  const enabledCount = countEnabledPermissions(permissions);
  const totalPermissions = Object.keys(permissions).length;
  const permissionPercentage = Math.round((enabledCount / totalPermissions) * 100);

  const selectedProperties = MOCK_OWNER_PROPERTIES.filter((p) =>
    selectedPropertyIds.includes(p.id)
  );

  return (
    <div className="space-y-0 pb-16">
      {/* ================================================================ */}
      {/* HEADER WITH BREADCRUMBS                                          */}
      {/* ================================================================ */}
      <OwnerHeader
        title="Add Manager"
        subtitle="Invite a new operational manager and configure their property scopes & permissions."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Link
              href="/owner/managers"
              className="hover:text-[#064E3B] transition-colors"
            >
              Managers
            </Link>
            <ChevronRight className="size-3.5 text-slate-400" />
            <span className="font-bold text-slate-900">Add Manager</span>
          </div>
        }
        actions={
          <Link
            href="/owner/managers"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-[#E5E7EB] rounded-lg transition-colors shadow-2xs"
          >
            <ArrowLeft className="size-3.5" />
            Back to Managers
          </Link>
        }
      />

      <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-7xl mx-auto">
        {/* SUCCESS STATE MODAL / OVERLAY */}
        {isSuccess ? (
          <div className="bg-white rounded-2xl border border-emerald-200 p-8 sm:p-12 shadow-sm text-center max-w-2xl mx-auto my-12 animate-in fade-in zoom-in-95 duration-200">
            <div className="size-16 rounded-full bg-emerald-100 text-[#064E3B] flex items-center justify-center mx-auto mb-5 ring-8 ring-emerald-50">
              <CheckCircle2 className="size-8 text-[#064E3B]" />
            </div>

            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-[#064E3B] border border-emerald-200 mb-3 font-heading">
              Invitation Sent
            </span>

            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 mb-3">
              Manager Invitation Dispatched!
            </h2>

            <p className="text-sm text-slate-600 max-w-lg mx-auto mb-6 leading-relaxed">
              We have dispatched an activation email to{" "}
              <strong className="text-slate-900">{email}</strong> and an instant SMS
              alert to <strong className="text-slate-900">{phone}</strong> for{" "}
              <strong className="text-slate-900">{fullName}</strong>.
            </p>

            <div className="bg-[#f9f9ff] border border-[#E5E7EB] rounded-xl p-5 mb-8 text-left space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E5E7EB]">
                <span className="text-slate-500 font-medium">Assigned Properties:</span>
                <span className="font-bold text-slate-800">
                  {selectedProperties.length} Properties
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E5E7EB]">
                <span className="text-slate-500 font-medium">Baseline Permissions:</span>
                <span className="font-bold text-emerald-700">
                  {enabledCount} of {totalPermissions} granted
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Invitation Validity:</span>
                <span className="font-bold text-amber-700 flex items-center gap-1">
                  <Clock className="size-3.5" />
                  Expires in 48 Hours
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/owner/managers"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-sm bg-[#064E3B] text-white hover:bg-emerald-900 transition-colors shadow-2xs"
              >
                Go to Managers List
              </Link>
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setFullName("");
                  setEmail("");
                  setPhone("+880 ");
                  setSelectedPropertyIds(["prop-banani-2"]);
                  setPermissions(DEFAULT_MANAGER_PERMISSIONS);
                  setPersonalMessage("");
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-700 bg-white hover:bg-slate-50 border border-[#E5E7EB] transition-colors"
              >
                Invite Another Manager
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendInvitation} noValidate>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* ============================================================ */}
              {/* LEFT COLUMN: 2/3 (8 COLS) - WIZARD FORM STEPS                */}
              {/* ============================================================ */}
              <div className="lg:col-span-8 space-y-8">
                {/* ---------------------------------------------------------- */}
                {/* SECTION 1: MANAGER INFORMATION                             */}
                {/* ---------------------------------------------------------- */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-7 shadow-2xs">
                  <div className="flex items-center gap-3 pb-5 border-b border-[#E5E7EB] mb-6">
                    <div className="size-9 rounded-xl bg-emerald-50 text-[#064E3B] flex items-center justify-center font-bold text-sm">
                      1
                    </div>
                    <div>
                      <h2 className="font-heading font-bold text-lg text-slate-900">
                        Manager Information
                      </h2>
                      <p className="text-xs text-slate-500">
                        Basic profile details of the person you are delegating to.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {/* Full Name */}
                    <div>
                      <label
                        htmlFor="fullName"
                        className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                      >
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="fullName"
                          type="text"
                          value={fullName}
                          onChange={(e) => {
                            setFullName(e.target.value);
                            if (errors.fullName) {
                              setErrors((prev) => ({ ...prev, fullName: "" }));
                            }
                          }}
                          placeholder="e.g. Tariqul Islam"
                          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]/20 transition-all ${
                            errors.fullName
                              ? "border-rose-400 bg-rose-50/20"
                              : "border-[#E5E7EB] bg-white focus:border-[#064E3B]"
                          }`}
                        />
                      </div>
                      {errors.fullName && (
                        <p className="text-xs text-rose-600 mt-1.5 font-medium flex items-center gap-1">
                          <Info className="size-3.5" />
                          {errors.fullName}
                        </p>
                      )}
                    </div>

                    {/* Email & Phone (2-col) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Email Address */}
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                        >
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              if (errors.email) {
                                setErrors((prev) => ({ ...prev, email: "" }));
                              }
                            }}
                            placeholder="manager@example.com"
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]/20 transition-all ${
                              errors.email
                                ? "border-rose-400 bg-rose-50/20"
                                : "border-[#E5E7EB] bg-white focus:border-[#064E3B]"
                            }`}
                          />
                        </div>
                        {errors.email && (
                          <p className="text-xs text-rose-600 mt-1.5 font-medium flex items-center gap-1">
                            <Info className="size-3.5" />
                            {errors.email}
                          </p>
                        )}
                      </div>

                      {/* Phone Number */}
                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                        >
                          Phone Number (SMS Alert) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => {
                              setPhone(e.target.value);
                              if (errors.phone) {
                                setErrors((prev) => ({ ...prev, phone: "" }));
                              }
                            }}
                            placeholder="+880 1712-345678"
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]/20 transition-all ${
                              errors.phone
                                ? "border-rose-400 bg-rose-50/20"
                                : "border-[#E5E7EB] bg-white focus:border-[#064E3B]"
                            }`}
                          />
                        </div>
                        {errors.phone && (
                          <p className="text-xs text-rose-600 mt-1.5 font-medium flex items-center gap-1">
                            <Info className="size-3.5" />
                            {errors.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Read-Only Assigned Role Block */}
                    <div className="bg-[#f9f9ff] border border-[#E5E7EB] rounded-xl p-4 flex items-start gap-3.5">
                      <div className="size-10 rounded-lg bg-emerald-100 text-[#064E3B] flex items-center justify-center shrink-0 mt-0.5">
                        <UserCheck className="size-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Assigned Portal Role:
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#064E3B] text-white">
                            Property Manager
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          This role grants operational delegation. The manager can
                          operate on assigned properties within granted limits, but has
                          strictly zero access to owner banking or payout withdrawals.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ---------------------------------------------------------- */}
                {/* SECTION 2: ASSIGN PROPERTIES                               */}
                {/* ---------------------------------------------------------- */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-7 shadow-2xs">
                  <div className="flex items-center justify-between pb-5 border-b border-[#E5E7EB] mb-6">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-emerald-50 text-[#064E3B] flex items-center justify-center font-bold text-sm">
                        2
                      </div>
                      <div>
                        <h2 className="font-heading font-bold text-lg text-slate-900">
                          Assign Properties
                        </h2>
                        <p className="text-xs text-slate-500">
                          Select the properties this manager will be responsible for.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      {selectedPropertyIds.length} of {MOCK_OWNER_PROPERTIES.length}{" "}
                      Selected
                    </span>
                  </div>

                  {errors.properties && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium">
                      <Info className="size-4 shrink-0 text-rose-600" />
                      <span>{errors.properties}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    {MOCK_OWNER_PROPERTIES.map((property) => {
                      const isSelected = selectedPropertyIds.includes(property.id);
                      return (
                        <div
                          key={property.id}
                          onClick={() => {
                            handleToggleProperty(property.id);
                            if (errors.properties) {
                              setErrors((prev) => ({ ...prev, properties: "" }));
                            }
                          }}
                          className={`group p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                            isSelected
                              ? "border-[#064E3B] bg-emerald-50/40 ring-1 ring-[#064E3B]/20"
                              : "border-[#E5E7EB] bg-white hover:border-slate-300 hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Checkbox circle */}
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
                                <h3 className="text-sm font-bold text-slate-900 truncate">
                                  {property.title}
                                </h3>
                                {isSelected && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-[#064E3B] font-heading">
                                    Active Selection
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 truncate mt-0.5">
                                {property.address} • {property.area}
                              </p>
                              {property.managerName && (
                                <p className="text-[11px] text-amber-700 font-medium mt-1 flex items-center gap-1">
                                  <Users className="size-3" />
                                  Currently: {property.managerName} (will be reassigned)
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

                  <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs text-slate-600">
                    <Info className="size-4 shrink-0 text-slate-500" />
                    <span>
                      Rule: Each property can have only <strong>1 Manager</strong> at a
                      time, while 1 Manager can be assigned to multiple properties.
                    </span>
                  </div>
                </div>

                {/* ---------------------------------------------------------- */}
                {/* SECTION 3: BASELINE PERMISSIONS                            */}
                {/* ---------------------------------------------------------- */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-7 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E5E7EB] mb-6 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-emerald-50 text-[#064E3B] flex items-center justify-center font-bold text-sm">
                        3
                      </div>
                      <div>
                        <h2 className="font-heading font-bold text-lg text-slate-900">
                          Operational Permissions
                        </h2>
                        <p className="text-xs text-slate-500">
                          Choose baseline permissions granted to this manager across
                          assigned properties.
                        </p>
                      </div>
                    </div>

                    {/* Presets Button Group */}
                    <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => applyPreset("OPERATIONS")}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-md text-slate-700 hover:bg-white hover:shadow-2xs transition-colors"
                      >
                        Standard
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset("ALL")}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-md text-slate-700 hover:bg-white hover:shadow-2xs transition-colors"
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset("VIEW_ONLY")}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-md text-slate-700 hover:bg-white hover:shadow-2xs transition-colors"
                      >
                        View Only
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset("CLEAR")}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-md text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* SUB-SECTION A: Property Operations */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                        <Building2 className="size-3.5 text-[#064E3B]" />
                        Property Operations
                      </h3>
                      <div className="space-y-2.5">
                        {PROPERTY_PERMISSIONS.map((perm) => {
                          const isChecked = permissions[perm.key];
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
                              <div className="flex-1 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900">
                                    {perm.title}
                                  </span>
                                  {perm.recommended && (
                                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                      Recommended
                                    </span>
                                  )}
                                </div>
                                <p className="text-slate-500 mt-0.5 leading-relaxed">
                                  {perm.description}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* SUB-SECTION B: Bookings & Sessions */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                        <Clock className="size-3.5 text-[#064E3B]" />
                        Bookings & Active Sessions
                      </h3>
                      <div className="space-y-2.5">
                        {BOOKING_PERMISSIONS.map((perm) => {
                          const isChecked = permissions[perm.key];
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
                              <div className="flex-1 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900">
                                    {perm.title}
                                  </span>
                                  {perm.recommended && (
                                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                      Recommended
                                    </span>
                                  )}
                                </div>
                                <p className="text-slate-500 mt-0.5 leading-relaxed">
                                  {perm.description}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* SUB-SECTION C: Team & Customer */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                        <Shield className="size-3.5 text-[#064E3B]" />
                        Staff Guards & Customer Feedback
                      </h3>
                      <div className="space-y-2.5">
                        {TEAM_PERMISSIONS.map((perm) => {
                          const isChecked = permissions[perm.key];
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
                              <div className="flex-1 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900">
                                    {perm.title}
                                  </span>
                                </div>
                                <p className="text-slate-500 mt-0.5 leading-relaxed">
                                  {perm.description}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* INFO NOTE */}
                  <div className="mt-6 p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-start gap-3">
                    <Info className="size-4 text-[#064E3B] shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-900 leading-relaxed">
                      <strong className="font-bold">Customizable per property later:</strong>{" "}
                      These baseline permissions apply to all assigned properties by
                      default. You can fine-tune or restrict specific permissions per
                      individual property at any time from the Manager Detail portal.
                    </div>
                  </div>

                  {/* LOCK NOTE: FINANCIAL ISOLATION */}
                  <div className="mt-4 p-4 rounded-xl bg-slate-900 text-white flex items-start gap-3.5 shadow-xs">
                    <div className="size-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Lock className="size-4" />
                    </div>
                    <div className="text-xs space-y-1">
                      <h4 className="font-bold text-white flex items-center gap-1.5">
                        Financial Access Isolation (Strict Owner Exclusive)
                      </h4>
                      <p className="text-slate-300 leading-relaxed">
                        Financial analytics, payout bank accounts, bKash disbursement,
                        and fee structures are strictly restricted to your Owner account.
                        Managers cannot view or modify financial balances.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ---------------------------------------------------------- */}
                {/* SECTION 4: INVITATION DISPATCH                             */}
                {/* ---------------------------------------------------------- */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-7 shadow-2xs">
                  <div className="flex items-center gap-3 pb-5 border-b border-[#E5E7EB] mb-6">
                    <div className="size-9 rounded-xl bg-emerald-50 text-[#064E3B] flex items-center justify-center font-bold text-sm">
                      4
                    </div>
                    <div>
                      <h2 className="font-heading font-bold text-lg text-slate-900">
                        Invitation Dispatch
                      </h2>
                      <p className="text-xs text-slate-500">
                        Delivery channels and optional welcome message for onboarding.
                      </p>
                    </div>
                  </div>

                  {/* Delivery Methods (Read-only active cards) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-emerald-100 text-[#064E3B] flex items-center justify-center shrink-0">
                        <Mail className="size-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">
                            Email Invitation
                          </h4>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900">
                            Active
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-normal">
                          Includes secure activation link valid for 48 hours to set up
                          credentials.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-emerald-100 text-[#064E3B] flex items-center justify-center shrink-0">
                        <Phone className="size-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">
                            SMS Notification
                          </h4>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900">
                            Active
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-normal">
                          Instant SMS alert delivered to the Bangladesh mobile number with
                          OTP verification.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Personal Message */}
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Personal Message (Optional)
                    </label>
                    <textarea
                      id="message"
                      rows={3}
                      value={personalMessage}
                      onChange={(e) => setPersonalMessage(e.target.value)}
                      placeholder="e.g. Welcome to the team! You will be overseeing daily vehicle check-in and parking availability for our Banani hub."
                      className="w-full p-3 rounded-xl border border-[#E5E7EB] text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20 transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* ============================================================ */}
              {/* RIGHT SIDEBAR: 1/3 (4 COLS) - INVITATION SUMMARY (STICKY)    */}
              {/* ============================================================ */}
              <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
                {/* Summary Card */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-2xs space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                    <h3 className="font-heading font-bold text-base text-slate-900">
                      Invitation Summary
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-100 text-amber-900 font-heading">
                      Draft
                    </span>
                  </div>

                  {/* Live Manager Preview */}
                  <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="size-11 rounded-full bg-[#064E3B] text-white flex items-center justify-center font-bold font-heading text-sm shadow-2xs">
                      {fullName.trim()
                        ? fullName
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()
                        : "NM"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {fullName.trim() || "New Manager"}
                      </h4>
                      <p className="text-xs text-slate-500 truncate">
                        {email.trim() || "manager@example.com"}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {phone.trim() || "+880 17XX-XXXXXX"}
                      </p>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="space-y-4">
                    {/* Properties Count */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500 font-medium flex items-center gap-1.5">
                          <Building2 className="size-3.5 text-slate-400" />
                          Assigned Properties:
                        </span>
                        <span className="font-bold text-slate-900">
                          {selectedProperties.length} Properties
                        </span>
                      </div>

                      {/* Chips */}
                      {selectedProperties.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {selectedProperties.map((p) => (
                            <span
                              key={p.id}
                              className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-[#064E3B] border border-emerald-200 flex items-center gap-1"
                            >
                              <span className="size-1.5 rounded-full bg-[#064E3B]" />
                              {p.area} ({p.totalSpaces} bays)
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-rose-500 italic mt-1">
                          No property assigned yet
                        </p>
                      )}
                    </div>

                    {/* Permissions Count */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500 font-medium flex items-center gap-1.5">
                          <ShieldCheck className="size-3.5 text-slate-400" />
                          Global Permissions:
                        </span>
                        <span className="font-bold text-emerald-700">
                          {enabledCount} of {totalPermissions} enabled
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#064E3B] transition-all duration-300 rounded-full"
                          style={{ width: `${permissionPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Security Isolation Status */}
                    <div className="pt-2 border-t border-[#E5E7EB] text-[11px] space-y-1.5 text-slate-500">
                      <div className="flex items-center justify-between">
                        <span>Financial Isolation:</span>
                        <span className="font-bold text-emerald-700 flex items-center gap-1">
                          <Check className="size-3" /> Enforced
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Invitation Expiry:</span>
                        <span className="font-bold text-slate-700">48 Hours</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Delivery:</span>
                        <span className="font-bold text-slate-700">Email & SMS</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-[#E5E7EB] space-y-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#064E3B] hover:bg-emerald-900 text-white flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Dispatching Invitation...</span>
                        </>
                      ) : (
                        <>
                          <Send className="size-4" />
                          <span>Send Manager Invitation</span>
                        </>
                      )}
                    </button>

                    <Link
                      href="/owner/managers"
                      className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors"
                    >
                      Cancel & Discard
                    </Link>
                  </div>
                </div>

                {/* FAQ / Security Tip Box */}
                <div className="bg-[#f9f9ff] rounded-xl border border-[#E5E7EB] p-4 text-xs text-slate-600 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Sparkles className="size-4 text-[#064E3B]" />
                    <span>How Manager Activation Works</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    The manager will receive an SMS and email with an encrypted
                    token. Upon setting their password and authenticating via 2FA, their
                    status flips to <strong className="text-slate-700">Active</strong> and
                    they can log in to the Manager Portal.
                  </p>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
