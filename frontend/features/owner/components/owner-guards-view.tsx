"use client";

import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  Plus,
  Search,
  ChevronDown,
  X,
  Info,
  Clock,
  Phone,
  Mail,
  Building2,
  Lock,
  CheckCircle2,
  Users,
  Shield,
  Send,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { OwnerHeader } from "@/components/owner/owner-header";
import {
  MOCK_OWNER_GUARDS,
  MOCK_OWNER_PROPERTIES,
  OwnerGuard,
} from "@/lib/data/mock-owner-data";

export function OwnerGuardsView() {
  const [guards, setGuards] = useState<OwnerGuard[]>(MOCK_OWNER_GUARDS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State for Add Guard
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    MOCK_OWNER_PROPERTIES[0].id
  );
  const [assignedGate, setAssignedGate] = useState("Gate 1 (Main Entrance)");
  const [shiftStart, setShiftStart] = useState("08:00 AM");
  const [shiftEnd, setShiftEnd] = useState("06:00 PM");
  const [tempPassword, setTempPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Metrics
  const totalGuards = guards.length;
  const onDutyCount = guards.filter((g) => g.status === "ON_DUTY").length;
  const offDutyCount = guards.filter((g) => g.status === "OFF_DUTY").length;

  // Filtered Guards
  const filteredGuards = useMemo(() => {
    return guards.filter((guard) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        guard.name.toLowerCase().includes(q) ||
        guard.phone.toLowerCase().includes(q) ||
        guard.propertyTitle.toLowerCase().includes(q) ||
        guard.gate.toLowerCase().includes(q);

      let matchesStatus = true;
      if (statusFilter !== "ALL") {
        matchesStatus = guard.status === statusFilter;
      }

      return matchesSearch && matchesStatus;
    });
  }, [guards, searchQuery, statusFilter]);

  const handleCreateGuard = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!fullName.trim()) {
      setFormError("Please provide the guard's full name.");
      return;
    }
    if (!phone.trim()) {
      setFormError("Please provide a valid phone number for SMS delivery.");
      return;
    }
    if (!tempPassword || tempPassword.length < 8) {
      setFormError("Temporary initial password must be at least 8 characters.");
      return;
    }
    if (tempPassword !== confirmPassword) {
      setFormError("Temporary initial passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const selectedProp =
        MOCK_OWNER_PROPERTIES.find((p) => p.id === selectedPropertyId) ||
        MOCK_OWNER_PROPERTIES[0];

      const nameParts = fullName.trim().split(" ");
      const initials =
        nameParts.length > 1
          ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
          : nameParts[0].slice(0, 2).toUpperCase();

      const newGuard: OwnerGuard = {
        id: `guard-${Date.now()}`,
        name: fullName.trim(),
        initials,
        phone: phone.trim(),
        email: email.trim() || `${fullName.toLowerCase().replace(/\s+/g, "")}@example.com`,
        propertyId: selectedProp.id,
        propertyTitle: selectedProp.title,
        gate: assignedGate.split(" ")[0],
        shiftStart,
        shiftEnd,
        shiftWindow: `${shiftStart} – ${shiftEnd}`,
        status: "PENDING_ACTIVATION",
        invitationNote: "Sent Today via SMS & Email",
        assignedBy: "Tanvir Chowdhury (Property Owner)",
      };

      setGuards((prev) => [newGuard, ...prev]);
      setIsSubmitting(false);
      setIsModalOpen(false);

      // Reset Form
      setFullName("");
      setPhone("");
      setEmail("");
      setTempPassword("");
      setConfirmPassword("");
    }, 600);
  };

  return (
    <div className="flex flex-col min-h-full relative">
      {/* Top Header */}
      <OwnerHeader
        title="Guards"
        subtitle="Manage guard accounts, property assignments, gates, and duty schedules."
        actions={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 py-2 px-4 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-[0.99]"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>+ Add Guard</span>
          </button>
        }
      />

      {/* Main Content Area */}
      <div className="p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-7">
        {/* ==================================================================== */}
        {/* 1. METRICS ROW (3 Cards)                                             */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Card 1: TOTAL GUARDS */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs flex items-start justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading block">
                Total Guards
              </span>
              <div className="text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                {totalGuards}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Across 2 properties
              </p>
            </div>

            <div className="size-11 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
              <Users className="size-5" />
            </div>
          </div>

          {/* Card 2: ON DUTY */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs flex items-start justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading block">
                On Duty
              </span>
              <div className="text-3xl font-extrabold text-emerald-950 font-heading tracking-tight">
                {onDutyCount}
              </div>
              <p className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Active now</span>
              </p>
            </div>

            <div className="size-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-100">
              <ShieldCheck className="size-5" />
            </div>
          </div>

          {/* Card 3: OFF DUTY */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs flex items-start justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading block">
                Off Duty
              </span>
              <div className="text-3xl font-extrabold text-slate-800 font-heading tracking-tight">
                {offDutyCount}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Next shift at 2:00 PM
              </p>
            </div>

            <div className="size-11 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
              <Clock className="size-5" />
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 2. FILTER BAR                                                        */}
        {/* ==================================================================== */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guard by name, phone, property, or gate"
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#E5E7EB] bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition shadow-2xs"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative">
            <select
              aria-label="Filter by guard status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 pl-3.5 pr-8 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition appearance-none cursor-pointer shadow-2xs"
            >
              <option value="ALL">Status: All</option>
              <option value="ON_DUTY">On Duty</option>
              <option value="OFF_DUTY">Off Duty</option>
              <option value="PENDING_ACTIVATION">Pending Activation</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 3. GUARDS DATA TABLE / LIST                                          */}
        {/* ==================================================================== */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
          <div className="divide-y divide-[#E5E7EB]">
            {filteredGuards.length === 0 ? (
              <div className="py-12 px-5 text-center text-slate-500">
                <Shield className="size-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-800 font-heading text-sm">
                  No guards found
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Try adjusting your search criteria or add a new guard.
                </p>
              </div>
            ) : (
              filteredGuards.map((guard) => {
                const isOnDuty = guard.status === "ON_DUTY";
                const isOffDuty = guard.status === "OFF_DUTY";
                const isPending = guard.status === "PENDING_ACTIVATION";

                return (
                  <div
                    key={guard.id}
                    className="p-5 sm:p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-5"
                  >
                    {/* Guard Info Block */}
                    <div className="flex items-center gap-4 min-w-[240px]">
                      {/* Avatar Initials Circle */}
                      <div
                        className={`size-12 rounded-full font-bold font-heading text-xs flex items-center justify-center shrink-0 border ${
                          isOnDuty
                            ? "bg-emerald-100 text-[#064E3B] border-emerald-200"
                            : isPending
                            ? "bg-amber-100 text-amber-900 border-amber-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {guard.initials}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900">
                            {guard.name}
                          </h3>

                          {/* Status Badge */}
                          {isOnDuty && (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              On Duty
                            </span>
                          )}
                          {isOffDuty && (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                              Off Duty
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                              Pending Activation
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 font-medium">
                          {guard.propertyTitle} • {guard.gate}
                        </p>
                      </div>
                    </div>

                    {/* Shift Window / Invitation Status */}
                    <div className="min-w-[180px] text-xs">
                      {isPending ? (
                        <div className="space-y-0.5">
                          <span className="text-[11px] text-slate-400 font-medium block">
                            Invitation Status
                          </span>
                          <span className="font-semibold text-slate-800 block">
                            {guard.invitationNote}
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="text-[11px] text-slate-400 font-medium block">
                            Shift Window
                          </span>
                          <span className="font-mono font-bold text-slate-800 block text-xs">
                            {guard.shiftWindow}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Assigned By */}
                    <div className="min-w-[200px] text-xs">
                      <span className="text-[11px] text-slate-400 font-medium block mb-0.5">
                        Assigned By
                      </span>
                      <span className="font-semibold text-slate-700 block truncate">
                        {guard.assignedBy}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. ADD NEW GUARD SLIDE-OVER / MODAL                                  */}
      {/* ==================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in-50">
          {/* Slide-over Card */}
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold font-heading text-slate-900 tracking-tight">
                  Add New Guard
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Create a guard account and assign operational access.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="size-8 rounded-lg border border-[#E5E7EB] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreateGuard} className="p-6 space-y-6 flex-1">
              {/* Form Error Banner */}
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
                  {formError}
                </div>
              )}

              {/* 1. Important Guard Policy Banner */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-900 font-heading">
                  <Info className="size-4 text-emerald-700 shrink-0" />
                  <span>Important regarding Guards</span>
                </div>
                <p className="text-emerald-800/90 leading-relaxed text-[11px]">
                  Guards can only access operational information for their assigned property and gate.
                  They cannot access pricing, earnings, payouts, ownership controls, or manager controls.
                </p>
              </div>

              {/* 2. Full Name Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 font-heading">
                  Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jamal Hossain"
                  className="w-full h-11 px-3.5 rounded-xl border border-[#E5E7EB] bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition"
                />
              </div>

              {/* 3. Phone & Email (2-Column Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 font-heading">
                    Phone Number <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 17XX XXXXXX"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#E5E7EB] bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 font-heading">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jamal@example.com"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#E5E7EB] bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition"
                  />
                </div>
              </div>

              {/* 4. Assign Property Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 font-heading">
                  Assign to Property <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    className="w-full h-11 pl-3.5 pr-8 rounded-xl border border-[#E5E7EB] bg-white text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition appearance-none cursor-pointer"
                  >
                    {MOCK_OWNER_PROPERTIES.map((prop) => (
                      <option key={prop.id} value={prop.id}>
                        {prop.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* 5. Assign Gate / Access Point */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 font-heading">
                  Assigned Gate / Access Point <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <select
                    value={assignedGate}
                    onChange={(e) => setAssignedGate(e.target.value)}
                    className="w-full h-11 pl-3.5 pr-8 rounded-xl border border-[#E5E7EB] bg-white text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition appearance-none cursor-pointer"
                  >
                    <option value="Gate 1 (Main Entrance)">Gate 1 (Main Entrance)</option>
                    <option value="Gate 2 (Basement Access)">Gate 2 (Basement Access)</option>
                    <option value="Gate 3 (Rear Barrier)">Gate 3 (Rear Barrier)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* 6. Shift Start & Shift End (2-Column Grid) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 font-heading">
                    Shift Start
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={shiftStart}
                      onChange={(e) => setShiftStart(e.target.value)}
                      placeholder="08:00 AM"
                      className="w-full h-11 pl-3.5 pr-8 rounded-xl border border-[#E5E7EB] bg-white text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition"
                    />
                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 font-heading">
                    Shift End
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={shiftEnd}
                      onChange={(e) => setShiftEnd(e.target.value)}
                      placeholder="06:00 PM"
                      className="w-full h-11 pl-3.5 pr-8 rounded-xl border border-[#E5E7EB] bg-white text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition"
                    />
                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* 7 & 8. ARCHITECTURAL OVERRIDE: Temporary Password Fields */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="size-4 text-emerald-800" />
                    <span className="text-xs font-bold text-slate-900 font-heading">
                      Initial Temporary Password
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Required by Backend
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Temporary Password */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-600">
                      Temporary Password <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={tempPassword}
                        onChange={(e) => setTempPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="w-full h-10 px-3 pr-8 rounded-lg border border-[#E5E7EB] bg-white text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? (
                          <EyeOff className="size-3.5" />
                        ) : (
                          <Eye className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-600">
                      Confirm Password <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  The guard must reset this temporary password upon their first login on the mobile app.
                </p>
              </div>

              {/* 9. Account Activation Box */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-700" />
                    <span className="text-xs font-bold text-emerald-950 font-heading">
                      Account Activation
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Secure Invitation
                  </span>
                </div>

                <div className="text-[11px] text-emerald-900/80 flex items-center justify-between">
                  <span>Delivery: <strong>Email + SMS</strong></span>
                  <span>Status: <strong>Pending Activation</strong></span>
                </div>

                <p className="text-[11px] text-emerald-800/80 italic leading-relaxed pt-1">
                  &ldquo;The guard will receive a secure invitation to activate the account and login with their temporary password.&rdquo;
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-slate-700 hover:bg-slate-50 font-semibold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-semibold text-xs shadow-2xs transition active:scale-[0.99] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Creating Guard Account...</span>
                  ) : (
                    <>
                      <ShieldCheck className="size-4" />
                      <span>Create Guard Account</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                Temporary password required • Guard must reset password on first login.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
