"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  Plus,
  Search,
  ChevronDown,
  MoreVertical,
  MapPin,
  Car,
  CheckCircle2,
  Users,
  ShieldCheck,
  PauseCircle,
  PlayCircle,
  Eye,
  Clock,
  ShieldAlert,
  AlertTriangle,
  Send,
  X,
  FileText,
  Lock,
  Archive,
  Trash2,
} from "lucide-react";
import { OwnerHeader } from "@/components/owner/owner-header";
import {
  MOCK_OWNER_PROPERTIES,
  OwnerProperty,
} from "@/lib/data/mock-owner-data";
import { usePermissions } from "@/lib/security/use-permissions";
import { PermissionGuard } from "@/lib/security/permission-guard";
import { auditLogger, approvalStore } from "@/lib/security/audit-logger";
import type { ApprovalRequest } from "@/lib/security/types";
import safetyGarageImg from "@/assets/safety-garage.jpg";
import garageEntranceImg from "@/assets/garage-entrance.jpg";

// ─── Approval Intercept Modal ──────────────────────────────────────────────────
interface ApprovalInterceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: "add" | "delete" | "archive" | "pause" | "activate";
  propertyName?: string;
  onSubmitForApproval: (reason: string) => void;
}

function ApprovalInterceptModal({
  isOpen,
  onClose,
  actionType,
  propertyName,
  onSubmitForApproval,
}: ApprovalInterceptModalProps) {
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const actionLabels: Record<string, { title: string; desc: string; icon: React.ReactNode }> = {
    add: {
      title: "Request to Add New Property",
      desc: "Adding a new property listing requires Owner approval. Your request will be reviewed before the listing goes live.",
      icon: <Plus className="size-5 text-emerald-700" />,
    },
    delete: {
      title: "Request to Delete Property",
      desc: `Deleting "${propertyName}" is a critical action that requires Owner approval. This action cannot be undone once approved.`,
      icon: <Trash2 className="size-5 text-red-600" />,
    },
    archive: {
      title: "Request to Archive Property",
      desc: `Archiving "${propertyName}" will remove it from active listings. This requires Owner approval.`,
      icon: <Archive className="size-5 text-amber-600" />,
    },
    pause: {
      title: "Request to Pause Property",
      desc: `Pausing "${propertyName}" will temporarily disable bookings. This requires Owner approval.`,
      icon: <PauseCircle className="size-5 text-amber-600" />,
    },
    activate: {
      title: "Request to Activate Property",
      desc: `Activating "${propertyName}" will enable it for bookings. This requires Owner approval.`,
      icon: <PlayCircle className="size-5 text-emerald-600" />,
    },
  };

  const label = actionLabels[actionType] || actionLabels.add;

  const handleSubmit = () => {
    onSubmitForApproval(reason);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setReason("");
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] overflow-hidden animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#E5E7EB] bg-gradient-to-r from-amber-50/60 to-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-100 flex items-center justify-center">
                {label.icon}
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900">
                  {label.title}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <ShieldAlert className="size-3 text-amber-600" />
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                    Owner Approval Required
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {submitted ? (
            <div className="text-center py-6 space-y-3">
              <div className="size-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="size-7 text-emerald-700" />
              </div>
              <h4 className="font-heading font-bold text-lg text-slate-900">
                Request Submitted
              </h4>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Your request has been sent to the Property Owner for review. You'll be notified once it's approved or rejected.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600 leading-relaxed">
                {label.desc}
              </p>

              {/* Info Banner */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                <AlertTriangle className="size-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-800 leading-relaxed">
                  <span className="font-bold">DevSecOps Policy:</span> All critical property mutations by delegated managers
                  are intercepted and require explicit Owner authorization. This action will be logged in the audit trail.
                </div>
              </div>

              {/* Reason Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Justification / Notes <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide context for the Owner to review..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition resize-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!submitted && (
          <div className="px-6 py-4 border-t border-[#E5E7EB] bg-slate-50/50 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#E5E7EB] hover:bg-white text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.99] cursor-pointer"
            >
              <Send className="size-3.5" />
              Submit for Approval
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Approval Pending Badge ─────────────────────────────────────────────────
function ApprovalPendingBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
      <Clock className="size-3" />
      {count} Pending Approval
    </span>
  );
}

// ─── Main Manager Properties View ───────────────────────────────────────────
export function ManagerPropertiesClient() {
  const { permissions, manager, hasPermission } = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("RECENT");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Approval Intercept Modal State
  const [interceptModalOpen, setInterceptModalOpen] = useState(false);
  const [interceptAction, setInterceptAction] = useState<"add" | "delete" | "archive" | "pause" | "activate">("add");
  const [interceptPropertyName, setInterceptPropertyName] = useState<string | undefined>();
  const [interceptPropertyId, setInterceptPropertyId] = useState<string | undefined>();

  // Pending approvals state (reactive from approvalStore)
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>(
    () => approvalStore.getPending()
  );

  useEffect(() => {
    const unsub = approvalStore.subscribe((all) => {
      setPendingApprovals(all.filter((r) => r.status === "PENDING"));
    });
    return unsub;
  }, []);

  // Property Image resolver
  const getPropertyImage = (property: OwnerProperty) => {
    if (property.id === "prop-gulshan-1") return safetyGarageImg;
    if (property.id === "prop-banani-2") return garageEntranceImg;
    return null;
  };

  // Only show properties assigned to this manager
  const assignedProperties = useMemo(() => {
    return MOCK_OWNER_PROPERTIES.filter(
      (p) => p.managerName === manager?.name || p.managerName === "Rahim Uddin"
    );
  }, [manager]);

  // Metrics
  const totalCount = assignedProperties.length;
  const activeCount = assignedProperties.filter((p) => p.status === "ACTIVE").length;
  const pausedCount = assignedProperties.filter((p) => p.status === "PAUSED").length;
  const draftCount = assignedProperties.filter((p) => p.status === "DRAFT").length;

  // Filtered and sorted properties
  const filteredProperties = useMemo(() => {
    return assignedProperties
      .filter((property) => {
        const matchesSearch =
          property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          property.area.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
          statusFilter === "ALL" || property.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "RATE_HIGH") return (b.ratePerHour || 0) - (a.ratePerHour || 0);
        if (sortBy === "SPACES") return b.totalSpaces - a.totalSpaces;
        if (sortBy === "NAME") return a.title.localeCompare(b.title);
        return 0;
      });
  }, [assignedProperties, searchQuery, statusFilter, sortBy]);

  // Check if a property has pending approval
  const getPropertyPendingCount = useCallback(
    (propertyId: string) => {
      return pendingApprovals.filter(
        (r) => r.resourceId === propertyId || r.resource === "PROPERTY"
      ).length;
    },
    [pendingApprovals]
  );

  // ── Intercept Handlers ──────────────────────────────────────────────
  const handleAddPropertyIntercept = () => {
    setInterceptAction("add");
    setInterceptPropertyName(undefined);
    setInterceptPropertyId(undefined);
    setInterceptModalOpen(true);
  };

  const handlePropertyActionIntercept = (
    action: "delete" | "archive" | "pause" | "activate",
    property: OwnerProperty
  ) => {
    setInterceptAction(action);
    setInterceptPropertyName(property.title);
    setInterceptPropertyId(property.id);
    setActiveMenuId(null);
    setInterceptModalOpen(true);
  };

  const handleSubmitApproval = (reason: string) => {
    const actionDescriptions: Record<string, string> = {
      add: "Add New Property Listing",
      delete: `Delete Property: ${interceptPropertyName}`,
      archive: `Archive Property: ${interceptPropertyName}`,
      pause: `Pause Property: ${interceptPropertyName}`,
      activate: `Activate Property: ${interceptPropertyName}`,
    };

    approvalStore.submitRequest({
      managerId: manager?.id || "mgr-1",
      managerName: manager?.name || "Rahim Uddin",
      managerEmail: manager?.email,
      actionType: actionDescriptions[interceptAction],
      resource: "PROPERTY",
      resourceId: interceptPropertyId || null,
      propertyName: interceptPropertyName || "New Property (Pending Details)",
      payload: {
        action: interceptAction,
        propertyId: interceptPropertyId,
        propertyName: interceptPropertyName,
        justification: reason,
      },
    });

    // Also log to audit trail
    auditLogger.log({
      actionType: "REQUEST_APPROVAL",
      actionDescription: `Manager requested approval: ${actionDescriptions[interceptAction]}`,
      resource: "PROPERTY",
      resourceId: interceptPropertyId,
      managerId: manager?.id || "mgr-1",
      managerName: manager?.name || "Rahim Uddin",
      propertyId: interceptPropertyId,
      propertyName: interceptPropertyName,
      status: "PENDING_APPROVAL",
      metadata: { justification: reason },
    });
  };

  // ── Audit-logged View action ──────────────────────────────────────
  const handleViewProperty = (property: OwnerProperty) => {
    auditLogger.log({
      actionType: "ACCESS",
      actionDescription: `Viewed property listing: ${property.title}`,
      resource: "PROPERTY",
      resourceId: property.id,
      managerId: manager?.id || "mgr-1",
      managerName: manager?.name || "Rahim Uddin",
      propertyId: property.id,
      propertyName: property.title,
      status: "SUCCESS",
    });
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Top Header */}
      <OwnerHeader
        title="Assigned Listings"
        subtitle="View and manage parking properties assigned to your operational scope."
        badge={
          pendingApprovals.length > 0 ? (
            <ApprovalPendingBadge count={pendingApprovals.filter((r) => r.resource === "PROPERTY").length} />
          ) : undefined
        }
        actions={
          <PermissionGuard
            requiredPermission="canEditProperty"
            fallbackMode="disable"
            fallbackMessage="Adding new properties requires 'canEditProperty' scope and Owner approval."
          >
            <button
              type="button"
              onClick={handleAddPropertyIntercept}
              className="flex items-center gap-2 py-2 px-4 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white text-xs font-semibold shadow-2xs transition-all active:scale-[0.99] cursor-pointer"
            >
              <Plus className="size-4 stroke-[2.5]" />
              <span>+ Add Parking Space</span>
            </button>
          </PermissionGuard>
        }
      />

      {/* Main Content Container */}
      <div className="p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-7">
        {/* ================================================================ */}
        {/* MANAGER SCOPE INDICATOR                                          */}
        {/* ================================================================ */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
          <ShieldCheck className="size-5 text-emerald-700 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-emerald-900">
              Manager Scope: {manager?.name || "Rahim Uddin"}
            </span>
            <p className="text-[11px] text-emerald-700/80 mt-0.5">
              Showing only properties assigned to your delegation scope. Critical modifications (add, delete, archive)
              require Owner approval.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-[#064E3B] shrink-0">
            RBAC Enforced
          </span>
        </div>

        {/* ================================================================ */}
        {/* 1. METRICS ROW (4 Standard Cards)                                */}
        {/* ================================================================ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: ALL ASSIGNED */}
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`bg-white rounded-xl border p-5 shadow-2xs text-left transition-all cursor-pointer ${
              statusFilter === "ALL"
                ? "border-emerald-700/60 ring-1 ring-emerald-700/40"
                : "border-[#E5E7EB] hover:border-slate-300"
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading block">
              Assigned Listings
            </span>
            <div className="text-3xl font-extrabold text-slate-900 font-heading tracking-tight mt-1.5">
              {totalCount}
            </div>
          </button>

          {/* Card 2: ACTIVE */}
          <button
            type="button"
            onClick={() => setStatusFilter("ACTIVE")}
            className={`bg-white rounded-xl border p-5 shadow-2xs text-left transition-all cursor-pointer ${
              statusFilter === "ACTIVE"
                ? "border-emerald-700/60 ring-1 ring-emerald-700/40"
                : "border-[#E5E7EB] hover:border-slate-300"
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading block">
              Active
            </span>
            <div className="text-3xl font-extrabold text-slate-900 font-heading tracking-tight mt-1.5">
              {activeCount}
            </div>
          </button>

          {/* Card 3: PAUSED */}
          <button
            type="button"
            onClick={() => setStatusFilter("PAUSED")}
            className={`bg-white rounded-xl border p-5 shadow-2xs text-left transition-all cursor-pointer ${
              statusFilter === "PAUSED"
                ? "border-emerald-700/60 ring-1 ring-emerald-700/40"
                : "border-[#E5E7EB] hover:border-slate-300"
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading block">
              Paused
            </span>
            <div className="text-3xl font-extrabold text-slate-900 font-heading tracking-tight mt-1.5">
              {pausedCount}
            </div>
          </button>

          {/* Card 4: PENDING APPROVALS */}
          <div className="bg-white rounded-xl border border-amber-200/60 p-5 shadow-2xs text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 font-heading block">
              Pending Approvals
            </span>
            <div className="text-3xl font-extrabold text-amber-800 font-heading tracking-tight mt-1.5">
              {pendingApprovals.filter((r) => r.resource === "PROPERTY").length}
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 2. FILTER & SEARCH BAR                                           */}
        {/* ================================================================ */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assigned listings by name or location"
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#E5E7EB] bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition shadow-2xs"
            />
          </div>

          {/* Controls: Status & Sort Dropdowns */}
          <div className="flex items-center gap-2.5">
            {/* Status Dropdown */}
            <div className="relative">
              <select
                aria-label="Filter by property status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 pl-3.5 pr-8 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition appearance-none cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="PAUSED">Paused</option>
                <option value="DRAFT">Draft</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                aria-label="Sort listings"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-11 pl-3.5 pr-8 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition appearance-none cursor-pointer shadow-2xs"
              >
                <option value="RECENT">Recently Updated</option>
                <option value="RATE_HIGH">Highest Rate (৳/hr)</option>
                <option value="SPACES">Total Spaces</option>
                <option value="NAME">Name (A–Z)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 3. LISTINGS LIST (Horizontal Cards with Manager Intercepts)      */}
        {/* ================================================================ */}
        <div className="space-y-4">
          {filteredProperties.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center space-y-3">
              <Building2 className="size-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 font-heading">
                No assigned listings match your search
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Your operational scope only includes properties delegated by the Property Owner.
                Try adjusting your filters or contact the Owner for additional assignments.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                }}
                className="text-xs font-semibold text-emerald-800 hover:underline pt-2 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredProperties.map((property) => {
              const imageSrc = getPropertyImage(property);
              const isDraft = property.status === "DRAFT";
              const isPaused = property.status === "PAUSED";
              const isActive = property.status === "ACTIVE";
              const propertyPendingCount = getPropertyPendingCount(property.id);

              return (
                <div
                  key={property.id}
                  className={`bg-white rounded-xl border p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 relative ${
                    propertyPendingCount > 0
                      ? "border-amber-300/70 ring-1 ring-amber-200/50"
                      : "border-[#E5E7EB]"
                  }`}
                >
                  {/* Pending Approval Banner */}
                  {propertyPendingCount > 0 && (
                    <div className="absolute -top-3 left-6 z-10">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">
                        <Clock className="size-3 animate-pulse" />
                        Approval Pending
                      </span>
                    </div>
                  )}

                  {/* Left & Center Info Wrapper */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 flex-1 min-w-0">
                    {/* Property Image or Draft Box */}
                    <div className="w-full sm:w-44 h-36 sm:h-28 rounded-xl overflow-hidden shrink-0 border border-[#E5E7EB] relative bg-slate-50 flex items-center justify-center">
                      {imageSrc ? (
                        <Image
                          src={imageSrc}
                          alt={property.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                          <Building2 className="size-7 stroke-[1.5] mb-1 text-slate-300" />
                          <span className="text-[11px] font-semibold">Draft Photo</span>
                        </div>
                      )}
                    </div>

                    {/* Center Property Details */}
                    <div className="flex-1 min-w-0 space-y-2.5">
                      {/* Title + Status Badge */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 tracking-tight">
                          {property.title}
                        </h3>

                        {isActive && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Active
                          </span>
                        )}
                        {isPaused && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            Paused
                          </span>
                        )}
                        {isDraft && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            Draft
                          </span>
                        )}
                      </div>

                      {/* Address */}
                      <p className="flex items-center gap-1.5 text-xs text-slate-500 font-normal">
                        <MapPin className="size-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{property.address}</span>
                      </p>

                      {/* Spaces & Pricing Row */}
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Car className="size-3.5 text-slate-400" />
                          <span>{property.totalSpaces} Spaces Total</span>
                        </span>

                        {property.availableSpaces !== undefined && !isDraft && (
                          <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                            <CheckCircle2 className="size-3.5 text-emerald-600" />
                            <span>{property.availableSpaces} Available</span>
                          </span>
                        )}

                        {property.ratePerHour ? (
                          <span className="font-mono font-bold text-[#064E3B] text-sm flex items-center gap-0.5">
                            ৳{property.ratePerHour}{" "}
                            <span className="text-[11px] font-sans font-normal text-slate-500">/ hr</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Pricing not published
                          </span>
                        )}
                      </div>

                      {/* Operations Team Assignment Row */}
                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        {/* Manager Badge */}
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full">
                          <Users className="size-3 text-slate-400" />
                          <span>Manager: {property.managerName || "Not Assigned"}</span>
                        </span>

                        {/* Guard Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-medium border px-2.5 py-0.5 rounded-full ${
                            property.guardStatus === "On Duty"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-slate-50 text-slate-500 border-slate-200"
                          }`}
                        >
                          <ShieldCheck className="size-3" />
                          <span>Guard: {property.guardStatus || "Not Assigned"}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center pt-2 md:pt-0">
                    {/* View Button (always accessible with canViewProperty) */}
                    <PermissionGuard
                      requiredPermission="canViewProperty"
                      fallbackMode="hide"
                    >
                      <Link
                        href={`/manager/properties/${property.id}`}
                        onClick={() => handleViewProperty(property)}
                        className="px-4 py-2 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
                      >
                        View
                      </Link>
                    </PermissionGuard>

                    {/* Edit Button (requires canEditProperty) */}
                    {!isDraft && (
                      <PermissionGuard
                        requiredPermission="canEditProperty"
                        fallbackMode="disable"
                        fallbackMessage="Editing requires 'canEditProperty' permission from the Owner."
                      >
                        <Link
                          href={`/manager/properties/${property.id}/edit`}
                          className="px-4 py-2 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
                        >
                          Edit
                        </Link>
                      </PermissionGuard>
                    )}

                    {/* Vertical Ellipsis Menu */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMenuId(activeMenuId === property.id ? null : property.id)
                        }
                        className="size-9 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 flex items-center justify-center text-slate-500 transition-colors shadow-2xs cursor-pointer"
                        aria-label="More property options"
                      >
                        <MoreVertical className="size-4" />
                      </button>

                      {/* Dropdown Options */}
                      {activeMenuId === property.id && (
                        <div
                          className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl border border-[#E5E7EB] shadow-lg py-1.5 z-30 animate-in fade-in-50 zoom-in-95 text-xs font-medium"
                          onMouseLeave={() => setActiveMenuId(null)}
                        >
                          <Link
                            href={`/manager/properties/${property.id}`}
                            onClick={() => {
                              handleViewProperty(property);
                              setActiveMenuId(null);
                            }}
                            className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50"
                          >
                            <Eye className="size-3.5 text-slate-400" />
                            View Public Listing
                          </Link>

                          {/* Audit Trail Link */}
                          <button
                            type="button"
                            onClick={() => setActiveMenuId(null)}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            <FileText className="size-3.5 text-slate-400" />
                            View Audit Trail
                          </button>

                          <div className="my-1 border-t border-[#E5E7EB]" />

                          {/* Pause/Activate → Requires Approval */}
                          <button
                            type="button"
                            onClick={() =>
                              handlePropertyActionIntercept(
                                property.status === "ACTIVE" ? "pause" : "activate",
                                property
                              )
                            }
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            {property.status === "ACTIVE" ? (
                              <>
                                <PauseCircle className="size-3.5 text-amber-600" />
                                <span>Pause Listing</span>
                                <Clock className="size-3 text-amber-500 ml-auto" />
                              </>
                            ) : (
                              <>
                                <PlayCircle className="size-3.5 text-emerald-700" />
                                <span>Activate Listing</span>
                                <Clock className="size-3 text-amber-500 ml-auto" />
                              </>
                            )}
                          </button>

                          {/* Archive → Requires Approval */}
                          <button
                            type="button"
                            onClick={() => handlePropertyActionIntercept("archive", property)}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-amber-700 hover:bg-amber-50 cursor-pointer"
                          >
                            <Archive className="size-3.5 text-amber-600" />
                            <span>Archive Listing</span>
                            <Clock className="size-3 text-amber-500 ml-auto" />
                          </button>

                          {/* Delete → Requires Approval (guarded) */}
                          <PermissionGuard
                            requiredPermission="property_delete"
                            fallbackMode="disable"
                            fallbackMessage="Property deletion is restricted to the Owner."
                          >
                            <button
                              type="button"
                              onClick={() => handlePropertyActionIntercept("delete", property)}
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="size-3.5 text-red-500" />
                              <span>Delete Listing</span>
                              <Lock className="size-3 text-red-400 ml-auto" />
                            </button>
                          </PermissionGuard>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ================================================================ */}
        {/* 4. PENDING APPROVAL REQUESTS TIMELINE                            */}
        {/* ================================================================ */}
        {pendingApprovals.filter((r) => r.resource === "PROPERTY").length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="size-4 text-amber-600" />
              Your Pending Approval Requests
            </h3>
            <div className="space-y-2.5">
              {pendingApprovals
                .filter((r) => r.resource === "PROPERTY")
                .map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-amber-50/50 border border-amber-200/60"
                  >
                    <div className="size-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <Clock className="size-4 text-amber-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {request.actionType}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Submitted {new Date(request.timestamp).toLocaleDateString("en-BD", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                      Awaiting Owner
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Approval Intercept Modal */}
      <ApprovalInterceptModal
        isOpen={interceptModalOpen}
        onClose={() => setInterceptModalOpen(false)}
        actionType={interceptAction}
        propertyName={interceptPropertyName}
        onSubmitForApproval={handleSubmitApproval}
      />
    </div>
  );
}
