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
  CheckCircle2,
  XCircle,
  Shield,
  Send,
  MoreVertical,
  Download,
  Calendar,
  Briefcase,
  AlertCircle,
  Check,
} from "lucide-react";
import { OwnerHeader } from "@/components/provider/provider-header";
import {
  MOCK_OWNER_GUARDS,
  MOCK_OWNER_PROPERTIES,
  MOCK_GUARD_COVERAGE,
  MOCK_UPCOMING_SHIFTS,
  GUARD_ACCESS_SCOPE,
  OwnerGuard,
} from "@/lib/data/mock-owner-data";

export function OwnerGuardsView() {
  const [guards, setGuards] = useState<OwnerGuard[]>(MOCK_OWNER_GUARDS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [propertyFilter, setPropertyFilter] = useState<string>("ALL");
  const [gateFilter, setGateFilter] = useState<string>("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingGuard, setViewingGuard] = useState<OwnerGuard | null>(null);
  const [resendNotification, setResendNotification] = useState<string | null>(null);

  // Form State for Add Guard
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    MOCK_OWNER_PROPERTIES[0]?.id || "prop-gulshan-1"
  );
  const [assignedGate, setAssignedGate] = useState("Gate 1");
  const [shiftStart, setShiftStart] = useState("08:00 AM");
  const [shiftEnd, setShiftEnd] = useState("06:00 PM");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Metrics
  const totalGuards = guards.length;
  const onDutyCount = guards.filter((g) => g.status === "ON_DUTY").length;
  const offDutyCount = guards.filter((g) => g.status === "OFF_DUTY").length;
  const pendingCount = guards.filter((g) => g.status === "PENDING_ACTIVATION").length;

  // Filtered Guards
  const filteredGuards = useMemo(() => {
    return guards.filter((guard) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        guard.name.toLowerCase().includes(q) ||
        guard.phone.toLowerCase().includes(q) ||
        guard.propertyTitle.toLowerCase().includes(q) ||
        guard.guardCode.toLowerCase().includes(q) ||
        guard.gate.toLowerCase().includes(q);

      let matchesStatus = true;
      if (statusFilter !== "ALL") {
        matchesStatus = guard.status === statusFilter;
      }

      let matchesProperty = true;
      if (propertyFilter !== "ALL") {
        matchesProperty = guard.propertyTitle
          .toLowerCase()
          .includes(propertyFilter.toLowerCase());
      }

      let matchesGate = true;
      if (gateFilter !== "ALL") {
        matchesGate = guard.gate.toLowerCase() === gateFilter.toLowerCase();
      }

      return matchesSearch && matchesStatus && matchesProperty && matchesGate;
    });
  }, [guards, searchQuery, statusFilter, propertyFilter, gateFilter]);

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

      const newGuardCode = `GD-${Math.floor(1000 + Math.random() * 9000)}`;

      const newGuard: OwnerGuard = {
        id: `guard-${Date.now()}`,
        guardCode: newGuardCode,
        name: fullName.trim(),
        initials,
        phone: phone.trim(),
        email: email.trim() || `${fullName.toLowerCase().replace(/\s+/g, "")}@parkease.com`,
        propertyId: selectedProp.id,
        propertyTitle: selectedProp.title,
        gate: assignedGate,
        shiftStart,
        shiftEnd,
        shiftWindow: `${shiftStart} – ${shiftEnd}`,
        status: "PENDING_ACTIVATION",
        invitationNote: "Invitation: Sent Today",
        assignedBy: "Tanvir Chowdhury (Parking Provider)",
      };

      setGuards((prev) => [newGuard, ...prev]);
      setIsSubmitting(false);
      setIsModalOpen(false);

      // Reset Form
      setFullName("");
      setPhone("");
      setEmail("");
    }, 450);
  };

  const handleResend = (guardName: string) => {
    setResendNotification(`Invitation resent to ${guardName} via SMS & Email.`);
    setTimeout(() => setResendNotification(null), 3500);
  };

  return (
    <div className="flex flex-col min-h-full relative bg-[#f9f9ff]">
      {/* Top Header */}
      <OwnerHeader
        title="Guards"
        badge={
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {totalGuards} Total
          </span>
        }
        subtitle="Manage guard accounts, property assignments, gates, and duty schedules."
        actions={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 py-2 px-4 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-[0.99]"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>+ Add Guard</span>
          </button>
        }
      />

      {/* Resend Notification Toast */}
      {resendNotification && (
        <div className="fixed top-24 right-8 z-50 bg-emerald-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="size-4 text-emerald-300" />
          <span>{resendNotification}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="p-6 sm:p-8 lg:p-8 max-w-[1400px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ==================================================================== */}
          {/* MAIN COLUMN (LEFT 2/3: 8 COLS)                                       */}
          {/* ==================================================================== */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. METRICS ROW (4 Cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Card 1: Total Guards */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-heading block">
                    TOTAL GUARDS
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight mt-1">
                    {totalGuards}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Across 2 active properties
                  </p>
                </div>
                <div className="size-10 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
                  <Shield className="size-5" />
                </div>
              </div>

              {/* Card 2: On-Duty */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-heading block">
                    ON-DUTY
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#064E3B] font-heading tracking-tight mt-1">
                    {onDutyCount}
                  </div>
                  <p className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold mt-1">
                    <span className="size-2 rounded-full bg-emerald-600" />
                    <span>Active at gates</span>
                  </p>
                </div>
                <div className="size-10 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center shrink-0 border border-emerald-100">
                  <Briefcase className="size-5" />
                </div>
              </div>

              {/* Card 3: Off-Duty */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-heading block">
                    OFF-DUTY
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 font-heading tracking-tight mt-1">
                    {offDutyCount}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Next shift starts 2:00 PM
                  </p>
                </div>
                <div className="size-10 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
                  <Clock className="size-5" />
                </div>
              </div>

              {/* Card 4: Pending Activation */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 font-heading block">
                    PENDING ACTIVATION
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-heading tracking-tight mt-1">
                    {pendingCount}
                  </div>
                  <p className="text-[11px] text-amber-700 font-medium mt-1">
                    Invite sent today
                  </p>
                </div>
                <div className="size-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                  <Mail className="size-5" />
                </div>
              </div>
            </div>

            {/* 2. FILTER BAR */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-2.5 shadow-2xs flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search guard by name, phone, property, or gate"
                  className="w-full h-9.5 pl-9.5 pr-3 rounded-lg border border-[#E5E7EB] bg-[#fcfcfd] text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B] transition"
                />
              </div>

              {/* Status Select */}
              <div className="relative">
                <select
                  aria-label="Filter by guard status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9.5 pl-3 pr-7 rounded-lg border border-[#E5E7EB] bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B] transition appearance-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ON_DUTY">On-Duty</option>
                  <option value="OFF_DUTY">Off-Duty</option>
                  <option value="PENDING_ACTIVATION">Pending Activation</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400 pointer-events-none" />
              </div>

              {/* Property Select */}
              <div className="relative">
                <select
                  aria-label="Filter by property"
                  value={propertyFilter}
                  onChange={(e) => setPropertyFilter(e.target.value)}
                  className="h-9.5 pl-3 pr-7 rounded-lg border border-[#E5E7EB] bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B] transition appearance-none cursor-pointer"
                >
                  <option value="ALL">All Properties</option>
                  <option value="Gulshan">Gulshan Property</option>
                  <option value="Banani">Banani Office</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400 pointer-events-none" />
              </div>

              {/* Gates Select */}
              <div className="relative">
                <select
                  aria-label="Filter by gate"
                  value={gateFilter}
                  onChange={(e) => setGateFilter(e.target.value)}
                  className="h-9.5 pl-3 pr-7 rounded-lg border border-[#E5E7EB] bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B] transition appearance-none cursor-pointer"
                >
                  <option value="ALL">All Gates</option>
                  <option value="Gate 1">Gate 1</option>
                  <option value="Gate 2">Gate 2</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400 pointer-events-none" />
              </div>

              {/* Export Button */}
              <button
                type="button"
                title="Export Guard Roster"
                onClick={() => alert("Exporting guard roster as CSV...")}
                className="size-9.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 flex items-center justify-center text-slate-600 transition cursor-pointer shrink-0"
              >
                <Download className="size-4" />
              </button>
            </div>

            {/* 3. INFO BANNER */}
            <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5 sm:p-4 flex items-center justify-between gap-3 text-xs text-sky-900">
              <div className="flex items-center gap-2.5">
                <Info className="size-4.5 text-sky-600 shrink-0" />
                <p className="font-medium text-slate-700">
                  <span className="font-bold text-slate-900">Guard Assignment Authority:</span>{" "}
                  Guards may be assigned by the Parking Provider or an authorized Property Manager with{" "}
                  <span className="font-semibold text-slate-900">Manage Guards</span> permission.
                </p>
              </div>
              <button
                type="button"
                onClick={() => alert("Guard assignment policy: Providers have root control. Property managers with 'Manage Guards' permission can add/edit schedules.")}
                className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:text-sky-900 shrink-0 cursor-pointer"
              >
                <span>Learn permissions</span>
                <span className="text-sm">→</span>
              </button>
            </div>

            {/* 4. ACTIVE GUARD ROSTER */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold font-heading text-slate-900">
                    Active Guard Roster
                  </h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {filteredGuards.length} Guards
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  Sorted by: Recently Assigned
                </span>
              </div>

              {filteredGuards.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#E5E7EB] p-8 text-center text-slate-500 text-xs">
                  No guards match your search filters.
                </div>
              ) : (
                filteredGuards.map((guard) => {
                  const isOnDuty = guard.status === "ON_DUTY";
                  const isOffDuty = guard.status === "OFF_DUTY";
                  const isPending = guard.status === "PENDING_ACTIVATION";

                  return (
                    <div
                      key={guard.id}
                      className={`bg-white rounded-xl border ${
                        isPending ? "border-amber-200" : "border-[#E5E7EB]"
                      } shadow-2xs overflow-hidden transition-all hover:shadow-xs`}
                    >
                      {/* Guard Card Header */}
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
                        {/* Guard Identity */}
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`size-11 rounded-full flex items-center justify-center font-bold text-xs font-heading shrink-0 ${
                              isPending
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-800 text-white"
                            }`}
                          >
                            {guard.initials}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-slate-900 font-heading">
                                {guard.name}
                              </h3>

                              {isOnDuty && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <span className="size-1.5 rounded-full bg-emerald-600" />
                                  On-Duty
                                </span>
                              )}

                              {isOffDuty && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                  Off-Duty
                                </span>
                              )}

                              {isPending && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                  Pending Activation
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2.5 text-xs text-slate-500 mt-1">
                              <span className="inline-flex items-center gap-1">
                                <Phone className="size-3 text-slate-400" />
                                {guard.phone}
                              </span>
                              <span>•</span>
                              <span className="font-medium text-slate-600">
                                ID: {guard.guardCode}
                              </span>

                              {isPending && guard.invitationNote && (
                                <>
                                  <span>•</span>
                                  <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                                    <Mail className="size-3 text-amber-600" />
                                    {guard.invitationNote}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setViewingGuard(guard)}
                            className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
                          >
                            View Guard
                          </button>

                          {isPending ? (
                            <button
                              type="button"
                              onClick={() => handleResend(guard.name)}
                              className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-[#064E3B] transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Send className="size-3" />
                              <span>Resend Invitation</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => alert(`Edit assignment for ${guard.name}`)}
                              className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
                            >
                              Edit Assignment
                            </button>
                          )}

                          <button
                            type="button"
                            className="size-8 rounded-lg border border-transparent hover:border-[#E5E7EB] hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                          >
                            <MoreVertical className="size-4" />
                          </button>
                        </div>
                      </div>

                      {/* Card Details Grid */}
                      <div className="p-4 sm:p-5 bg-slate-50/50 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-[11px] font-medium text-slate-500 block">
                            Property
                          </span>
                          <span className="font-semibold text-slate-900 mt-0.5 block">
                            {guard.propertyTitle}
                          </span>
                        </div>

                        <div>
                          <span className="text-[11px] font-medium text-slate-500 block">
                            Assigned Gate
                          </span>
                          <span className="font-semibold text-slate-900 mt-0.5 block">
                            {guard.gate}
                          </span>
                        </div>

                        <div>
                          <span className="text-[11px] font-medium text-slate-500 block">
                            Duty Shift
                          </span>
                          <span
                            className={`mt-0.5 block ${
                              isPending
                                ? "italic text-slate-500"
                                : "font-semibold text-slate-900"
                            }`}
                          >
                            {isPending ? "Pending Activation" : guard.shiftWindow}
                          </span>
                        </div>

                        <div>
                          <span className="text-[11px] font-medium text-slate-500 block">
                            Assigned By
                          </span>
                          <span
                            className={`mt-0.5 block font-medium ${
                              guard.assignedBy.includes("Parking Provider") || guard.assignedBy.includes("Provider")
                                ? "text-[#064E3B] font-semibold"
                                : "text-slate-800"
                            }`}
                          >
                            {guard.assignedBy}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer: Recent Activity */}
                      {guard.recentActivity && (
                        <div className="px-4 sm:px-5 py-2.5 bg-emerald-50/30 border-t border-emerald-100 flex items-center justify-between text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                            <span>
                              <span className="font-medium text-slate-700">Recent Activity:</span>{" "}
                              {guard.recentActivity}
                            </span>
                          </div>
                          {guard.recentActivityTime && (
                            <span className="text-[11px] text-slate-500">
                              {guard.recentActivityTime}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ==================================================================== */}
          {/* RIGHT SIDEBAR (RIGHT 1/3: 4 COLS)                                    */}
          {/* ==================================================================== */}
          <div className="lg:col-span-4 space-y-6">
            {/* 1. GUARD COVERAGE */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900 font-bold font-heading text-sm">
                  <Building2 className="size-4 text-[#064E3B]" />
                  <span>Guard Coverage</span>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {MOCK_GUARD_COVERAGE.length} Properties
                </span>
              </div>

              <div className="space-y-3">
                {MOCK_GUARD_COVERAGE.map((cov, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#fcfcfd] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 font-heading">
                        {cov.propertyTitle}
                      </h4>
                      <span className="text-xs font-bold text-slate-700">
                        {cov.totalGuards} Guards
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {cov.onDutyCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="size-1.5 rounded-full bg-emerald-600" />
                          {cov.onDutyCount} On-Duty
                        </span>
                      )}

                      {cov.offDutyCount > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {cov.offDutyCount} Off-Duty
                        </span>
                      )}

                      {cov.pendingCount > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          {cov.pendingCount} Pending Activation
                        </span>
                      )}

                      {cov.subtext && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          {cov.subtext}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. UPCOMING SHIFTS */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900 font-bold font-heading text-sm">
                  <Calendar className="size-4 text-[#064E3B]" />
                  <span>Upcoming Shifts</span>
                </div>
                <span className="text-xs text-slate-500 font-medium">Next 24h</span>
              </div>

              <div className="space-y-3">
                {MOCK_UPCOMING_SHIFTS.map((shift) => (
                  <div
                    key={shift.id}
                    className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#fcfcfd] flex items-start gap-3"
                  >
                    <div className="size-9 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center font-heading shrink-0 mt-0.5">
                      {shift.initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 font-heading truncate">
                          {shift.guardName}
                        </h4>
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            shift.dayLabel === "Today"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {shift.dayLabel}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                        {shift.propertyTitle} • {shift.gate}
                      </p>

                      <p className="text-[11px] font-semibold text-slate-900 mt-1">
                        {shift.shiftWindow}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. GUARD ACCESS SCOPE */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold font-heading text-sm">
                  <ShieldCheck className="size-4 text-[#064E3B]" />
                  <span>Guard Access Scope</span>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Role Profile
                </span>
              </div>

              {/* Can Access */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  CAN ACCESS
                </span>
                <ul className="space-y-2 text-xs text-slate-700">
                  {GUARD_ACCESS_SCOPE.canAccess.map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cannot Access */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block">
                  CANNOT ACCESS
                </span>
                <ul className="space-y-2 text-xs text-slate-700">
                  {GUARD_ACCESS_SCOPE.cannotAccess.map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <XCircle className="size-4 text-rose-500 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. MODAL: ADD GUARD                                                  */}
      {/* ==================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-emerald-50 text-[#064E3B] flex items-center justify-center">
                  <Plus className="size-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-slate-900">
                    Add New Security Guard
                  </h3>
                  <p className="text-xs text-slate-500">
                    Set up credentials and assign gate duty schedule
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle className="size-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateGuard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rafiqul Islam"
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs text-slate-900 focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number (SMS Login) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 17XX-XXXXXX"
                    className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs text-slate-900 focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="guard@example.com"
                    className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs text-slate-900 focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Property *
                  </label>
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#064E3B] bg-white"
                  >
                    {MOCK_OWNER_PROPERTIES.map((prop) => (
                      <option key={prop.id} value={prop.id}>
                        {prop.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gate Assignment *
                  </label>
                  <select
                    value={assignedGate}
                    onChange={(e) => setAssignedGate(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#064E3B] bg-white"
                  >
                    <option value="Gate 1">Gate 1 (Main Entrance)</option>
                    <option value="Gate 2">Gate 2 (Basement Ramp)</option>
                    <option value="Gate 3">Gate 3 (Rear Exit)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shift Starts
                  </label>
                  <input
                    type="text"
                    value={shiftStart}
                    onChange={(e) => setShiftStart(e.target.value)}
                    placeholder="08:00 AM"
                    className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shift Ends
                  </label>
                  <input
                    type="text"
                    value={shiftEnd}
                    onChange={(e) => setShiftEnd(e.target.value)}
                    placeholder="06:00 PM"
                    className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[11px] leading-relaxed text-emerald-900">
                <span className="font-bold">Secure account setup:</span> An account setup link will be sent securely to the Guard. ParkEase never creates or displays a plaintext temporary password.
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <span>Sending Invite...</span>
                  ) : (
                    <>
                      <Plus className="size-3.5 stroke-[2.5]" />
                      <span>Send Secure Invitation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. MODAL: VIEW GUARD DETAILS                                         */}
      {/* ==================================================================== */}
      {viewingGuard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center font-heading">
                  {viewingGuard.initials}
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-slate-900">
                    {viewingGuard.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Guard Code: {viewingGuard.guardCode}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingGuard(null)}
                className="size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="font-semibold text-slate-900">{viewingGuard.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone</span>
                  <span className="font-semibold text-slate-900">{viewingGuard.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Property</span>
                  <span className="font-semibold text-slate-900">{viewingGuard.propertyTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Gate</span>
                  <span className="font-semibold text-slate-900">{viewingGuard.gate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duty Window</span>
                  <span className="font-semibold text-slate-900">{viewingGuard.shiftWindow || "Pending"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned By</span>
                  <span className="font-semibold text-[#064E3B]">{viewingGuard.assignedBy}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingGuard(null)}
                className="px-4 py-2 rounded-lg bg-[#064E3B] text-white text-xs font-semibold hover:bg-[#064E3B]/90 transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
