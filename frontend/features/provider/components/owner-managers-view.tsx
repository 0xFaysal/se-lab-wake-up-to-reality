"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Plus,
  Search,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Phone,
  MoreVertical,
  SlidersHorizontal,
  Send,
  X,
  ShieldCheck,
  MailWarning,
} from "lucide-react";
import { OwnerHeader } from "@/components/provider/provider-header";
import {
  MOCK_OWNER_MANAGERS,
  MOCK_OWNER_PROPERTIES,
  OwnerManager,
  countEnabledPermissions,
  countRestrictedPermissions,
} from "@/lib/data/mock-owner-data";

// ======================================================================
// PROVIDER MANAGERS LIST VIEW (Card-Based Layout - Refactored)
// ======================================================================

export function OwnerManagersView() {
  const [managers] = useState<OwnerManager[]>(MOCK_OWNER_MANAGERS);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [propertyFilter, setPropertyFilter] = useState<string>("ALL");

  // Notification toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Metrics
  const totalManagers = managers.length;
  const activeCount = managers.filter((m) => m.status === "ACTIVE").length;
  const propertiesManagedCount = new Set(
    managers.flatMap((m) => m.assignedPropertyIds)
  ).size;
  const pendingCount = managers.filter(
    (m) => m.status === "PENDING_INVITATION"
  ).length;

  // Filtered managers
  const filteredManagers = useMemo(() => {
    return managers.filter((manager) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        manager.name.toLowerCase().includes(q) ||
        manager.email.toLowerCase().includes(q) ||
        manager.phone.toLowerCase().includes(q) ||
        manager.assignedPropertyTitles.some((t) =>
          t.toLowerCase().includes(q)
        );

      const matchesStatus =
        statusFilter === "ALL" || manager.status === statusFilter;

      const matchesProperty =
        propertyFilter === "ALL" ||
        manager.assignedPropertyIds.includes(propertyFilter);

      return matchesSearch && matchesStatus && matchesProperty;
    });
  }, [managers, searchQuery, statusFilter, propertyFilter]);

  return (
    <div className="space-y-0">
      {/* ================================================================ */}
      {/* TOP HEADER                                                       */}
      {/* ================================================================ */}
      <OwnerHeader
        title="Managers"
        subtitle="Manage the people who help operate your parking properties."
        badge={
          <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
            Portal / Properties Operations / <span className="font-bold text-slate-800">Managers</span>
          </span>
        }
        actions={
          <Link
            href="/provider/managers/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#064E3B] text-white hover:bg-[#064E3B]/90 font-semibold text-xs sm:text-sm shadow-xs transition"
          >
            <Users className="size-4" />
            <span>+ Add Manager</span>
          </Link>
        }
      />

      <div className="px-4 sm:px-8 lg:px-10 py-6 space-y-5">
        {/* Toast / Notification Banner */}
        {toastMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs sm:text-sm text-emerald-900 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0" />
              <span className="font-medium">{toastMsg}</span>
            </div>
            <button onClick={() => setToastMsg(null)} className="text-emerald-700 hover:text-emerald-900 p-1">
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* METRICS ROW                                                     */}
        {/* ============================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Managers */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Managers
              </span>
              <div className="size-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <Users className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-heading text-slate-900">
                {totalManagers}
              </span>
              <span className="text-xs text-slate-500">assigned team</span>
            </div>
          </div>

          {/* Active Managers */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Active Managers
              </span>
              <div className="size-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-heading text-slate-900">
                {activeCount}
              </span>
              <span className="text-xs font-semibold text-emerald-700">
                On active duty
              </span>
            </div>
          </div>

          {/* Properties Managed */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Properties Managed
              </span>
              <div className="size-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <Building2 className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-heading text-slate-900">
                {propertiesManagedCount}
              </span>
              <span className="text-xs text-slate-500">
                across Dhaka hubs
              </span>
            </div>
          </div>

          {/* Pending Invitations */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Pending Invitations
              </span>
              <div className="size-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <MailWarning className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-heading text-amber-800">
                {pendingCount}
              </span>
              <span className="text-xs font-semibold text-amber-700">
                Awaiting accept
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* FILTER BAR                                                      */}
        {/* ============================================================== */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search manager by name, phone, email, or property"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B] transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:border-[#064E3B] transition min-w-[130px]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_INVITATION">Pending</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            {/* Property Filter */}
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:border-[#064E3B] transition min-w-[150px]"
            >
              <option value="ALL">All Properties</option>
              {MOCK_OWNER_PROPERTIES.map((prop) => (
                <option key={prop.id} value={prop.id}>
                  {prop.title}
                </option>
              ))}
            </select>

            {/* Filter Icon */}
            <button className="size-10 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-700 transition shrink-0">
              <SlidersHorizontal className="size-4" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MANAGER CARDS LIST                                              */}
        {/* ============================================================== */}
        <div className="space-y-4">
          {filteredManagers.length === 0 && (
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center shadow-2xs space-y-3">
              <div className="size-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Users className="size-6" />
              </div>
              <h3 className="font-heading font-bold text-slate-800 text-sm">
                No managers found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No property managers match your current filters. Try broadening
                your search or invite a new manager.
              </p>
              <Link
                href="/provider/managers/new"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#064E3B] text-white text-xs font-semibold hover:bg-[#064E3B]/90 transition"
              >
                <Plus className="size-3.5" />
                <span>Add Manager</span>
              </Link>
            </div>
          )}

          {filteredManagers.map((manager) => {
            const isPending = manager.status === "PENDING_INVITATION";
            const enabledPerms = countEnabledPermissions(manager.permissions);
            const restrictedPerms = countRestrictedPermissions(
              manager.permissions
            );

            // Find the most notable restriction for display
            const notableRestriction = !manager.permissions.canManagePricing
              ? "Pricing not allowed"
              : !manager.permissions.canManageGuards
              ? "Guard management restricted"
              : !manager.permissions.canRespondReviews
              ? "Reviews restricted"
              : null;

            const hasFullAccess = restrictedPerms === 0;

            return (
              <div
                key={manager.id}
                className={`bg-white rounded-xl border shadow-2xs overflow-hidden transition-all ${
                  isPending
                    ? "border-amber-300/80 bg-amber-50/20"
                    : "border-[#E5E7EB] hover:border-slate-300"
                }`}
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-5 lg:gap-8">
                    {/* ===== LEFT: Profile ===== */}
                    <div className="flex items-start gap-3.5 min-w-0 lg:min-w-[260px] shrink-0">
                      <div className="relative shrink-0">
                        {manager.avatarUrl ? (
                          <Image
                            src={manager.avatarUrl}
                            alt={manager.name}
                            width={48}
                            height={48}
                            className="size-12 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div
                            className={`size-12 rounded-full font-bold text-sm flex items-center justify-center font-heading ${
                              isPending
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {manager.initials}
                          </div>
                        )}
                        {/* Status Dot */}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-white ${
                            isPending
                              ? "bg-amber-500"
                              : manager.status === "ACTIVE"
                              ? "bg-emerald-500"
                              : "bg-slate-400"
                          }`}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-heading font-bold text-base text-slate-900 truncate">
                            {manager.name}
                          </h3>
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <span className="size-1.5 rounded-full bg-amber-500" />
                              Invitation Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {manager.role}
                        </p>
                        <div className="flex flex-col gap-0.5 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Mail className="size-3 text-slate-400 shrink-0" />
                            {manager.email}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Phone className="size-3 text-slate-400 shrink-0" />
                            {manager.phone}
                          </span>
                        </div>

                        {/* Pending-specific: Sent / Expires notice */}
                        {isPending && manager.inviteSentAt && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-700 font-medium">
                            <Clock className="size-3 text-amber-500 shrink-0" />
                            <span>
                              {manager.inviteSentAt} · {manager.inviteExpiresIn}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ===== CENTER: Assigned Properties & Permissions ===== */}
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Assigned Properties */}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Building2 className="size-3 text-slate-400" />
                          Assigned {manager.assignedPropertyTitles.length === 1 ? "Property" : "Properties"} ({manager.assignedPropertyTitles.length})
                        </span>
                        <div className="mt-1.5 space-y-1">
                          {manager.assignedPropertyTitles.map((title, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-xs text-slate-800"
                            >
                              <span className="size-1.5 rounded-full bg-slate-400 shrink-0" />
                              <span>{title}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Permissions Summary (Active managers only) */}
                      {!isPending && (
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Permissions
                          </span>
                          <div className="mt-1 space-y-0.5">
                            <div className="flex items-center gap-1.5 text-xs">
                              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                              <span className="text-slate-800 font-medium">
                                {enabledPerms} permissions enabled
                              </span>
                            </div>
                            {hasFullAccess ? (
                              <div className="flex items-center gap-1.5 text-xs">
                                <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                                <span className="text-emerald-700 font-medium">
                                  Full operational access to assigned permissions
                                </span>
                              </div>
                            ) : notableRestriction ? (
                              <div className="flex items-center gap-1.5 text-xs">
                                <XCircle className="size-3.5 text-rose-500 shrink-0" />
                                <span className="text-rose-700 font-medium">
                                  {notableRestriction}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ===== RIGHT: Actions ===== */}
                    <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
                      {isPending ? (
                        <>
                          <button
                            onClick={() =>
                              showToast(
                                `Invitation resent to ${manager.name} via Email + SMS.`
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#064E3B] bg-[#064E3B] text-white text-xs font-semibold hover:bg-[#064E3B]/90 transition shadow-xs cursor-pointer"
                          >
                            <Send className="size-3.5" />
                            Resend Invitation
                          </button>
                          <button
                            onClick={() =>
                              showToast(
                                `Invitation cancelled for ${manager.name}.`
                              )
                            }
                            className="px-3.5 py-2 rounded-lg border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50 transition cursor-pointer"
                          >
                            Cancel Invitation
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            href={`/provider/managers/${manager.id}`}
                            className="px-3.5 py-2 rounded-lg border border-[#E5E7EB] bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
                          >
                            View Manager
                          </Link>
                          <Link
                            href={`/provider/managers/${manager.id}/permissions`}
                            className="px-3.5 py-2 rounded-lg bg-[#064E3B] text-white text-xs font-semibold hover:bg-[#064E3B]/90 transition shadow-xs"
                          >
                            Manage Permissions
                          </Link>
                          <button className="size-8 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer">
                            <MoreVertical className="size-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
