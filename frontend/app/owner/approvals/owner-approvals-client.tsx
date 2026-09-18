"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Building2,
  Search,
  Filter,
  ChevronDown,
  ShieldAlert,
  FileText,
  Activity,
  AlertTriangle,
  ArrowRight,
  MoreVertical,
  Eye,
  Lock,
  Sparkles,
  Calendar,
  Hash,
  Zap,
} from "lucide-react";
import { OwnerHeader } from "@/components/owner/owner-header";
import { auditLogger, approvalStore } from "@/lib/security/audit-logger";
import type { ApprovalRequest, AuditLogEntry } from "@/lib/security/types";

// ─── Status Badge Component ─────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
    PENDING: {
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-800",
      icon: <Clock className="size-3 animate-pulse" />,
      label: "Pending Review",
    },
    APPROVED: {
      bg: "bg-emerald-50 border-emerald-200",
      text: "text-emerald-800",
      icon: <CheckCircle2 className="size-3" />,
      label: "Approved",
    },
    REJECTED: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-700",
      icon: <XCircle className="size-3" />,
      label: "Rejected",
    },
  };

  const c = config[status] || config.PENDING;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${c.bg} ${c.text}`}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

// ─── Rejection Dialog ───────────────────────────────────────────────────────
interface RejectDialogProps {
  isOpen: boolean;
  requestId: string;
  actionType: string;
  onClose: () => void;
  onReject: (reason: string) => void;
}

function RejectDialog({ isOpen, requestId, actionType, onClose, onReject }: RejectDialogProps) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] overflow-hidden animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#E5E7EB] bg-gradient-to-r from-red-50/60 to-white">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-red-100 flex items-center justify-center">
              <XCircle className="size-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900">
                Reject Request
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[280px]">
                {actionType}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-slate-600">
            Provide a reason for rejecting this request. The Manager will be notified.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this request is being rejected..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition resize-none"
            />
          </div>
        </div>

        {/* Footer */}
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
            onClick={() => {
              onReject(reason || "Declined by owner");
              setReason("");
              onClose();
            }}
            disabled={!reason.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <XCircle className="size-3.5" />
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Audit Action Type Icon ─────────────────────────────────────────────────
function AuditActionIcon({ actionType }: { actionType: string }) {
  const iconMap: Record<string, { icon: React.ReactNode; color: string }> = {
    CREATE: { icon: <Sparkles className="size-3.5" />, color: "text-emerald-600 bg-emerald-100" },
    UPDATE: { icon: <Zap className="size-3.5" />, color: "text-blue-600 bg-blue-100" },
    DELETE: { icon: <XCircle className="size-3.5" />, color: "text-red-600 bg-red-100" },
    ACCESS: { icon: <Eye className="size-3.5" />, color: "text-slate-600 bg-slate-100" },
    REQUEST_APPROVAL: { icon: <Clock className="size-3.5" />, color: "text-amber-600 bg-amber-100" },
    APPROVE: { icon: <CheckCircle2 className="size-3.5" />, color: "text-emerald-600 bg-emerald-100" },
    REJECT: { icon: <XCircle className="size-3.5" />, color: "text-red-600 bg-red-100" },
    OVERRIDE: { icon: <ShieldAlert className="size-3.5" />, color: "text-purple-600 bg-purple-100" },
  };

  const config = iconMap[actionType] || iconMap.ACCESS;

  return (
    <div className={`size-8 rounded-lg flex items-center justify-center ${config.color} shrink-0`}>
      {config.icon}
    </div>
  );
}

// ─── Format Timestamp ───────────────────────────────────────────────────────
function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString("en-BD", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString("en-BD", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ─── Main Approvals Component ───────────────────────────────────────────────
export function OwnerApprovalsClient() {
  // Approval Requests State (reactive)
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>(
    () => approvalStore.getAll()
  );

  // Audit Logs State (reactive)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(
    () => auditLogger.getLogs()
  );

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [auditSearchQuery, setAuditSearchQuery] = useState("");

  // Reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; actionType: string } | null>(null);

  // Subscribe to reactive updates
  useEffect(() => {
    const unsubApproval = approvalStore.subscribe((all) => {
      setApprovalRequests([...all]);
    });
    const unsubAudit = auditLogger.subscribe((logs) => {
      setAuditLogs([...logs]);
    });
    return () => {
      unsubApproval();
      unsubAudit();
    };
  }, []);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return approvalRequests.filter((r) => {
      const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
      const matchesSearch =
        !searchQuery ||
        r.actionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.managerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.propertyName || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [approvalRequests, statusFilter, searchQuery]);

  // Metrics
  const pendingCount = approvalRequests.filter((r) => r.status === "PENDING").length;
  const approvedCount = approvalRequests.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = approvalRequests.filter((r) => r.status === "REJECTED").length;

  // Filtered audit logs
  const filteredAuditLogs = useMemo(() => {
    if (!auditSearchQuery) return auditLogs.slice(0, 25);
    return auditLogs
      .filter(
        (log) =>
          log.actionDescription.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
          log.managerName.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
          log.resource.toLowerCase().includes(auditSearchQuery.toLowerCase())
      )
      .slice(0, 25);
  }, [auditLogs, auditSearchQuery]);

  // Action Handlers
  const handleApprove = (requestId: string) => {
    approvalStore.approve(requestId, "Tanvir Chowdhury (Owner)");
  };

  const handleReject = (reason: string) => {
    if (rejectTarget) {
      approvalStore.reject(rejectTarget.id, reason, "Tanvir Chowdhury (Owner)");
      setRejectTarget(null);
    }
  };

  const openRejectDialog = (request: ApprovalRequest) => {
    setRejectTarget({ id: request.id, actionType: request.actionType });
    setRejectDialogOpen(true);
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Top Header */}
      <OwnerHeader
        title="Manager Requests & Approvals"
        subtitle="Review pending operational changes requested by your managers."
        badge={
          pendingCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
              <Clock className="size-3" />
              {pendingCount} Pending
            </span>
          ) : undefined
        }
      />

      {/* Main Content */}
      <div className="p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
        {/* ================================================================ */}
        {/* 1. METRICS ROW                                                   */}
        {/* ================================================================ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Total Requests */}
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
              Total Requests
            </span>
            <div className="text-3xl font-extrabold text-slate-900 font-heading tracking-tight mt-1.5">
              {approvalRequests.length}
            </div>
          </button>

          {/* Pending */}
          <button
            type="button"
            onClick={() => setStatusFilter("PENDING")}
            className={`bg-white rounded-xl border p-5 shadow-2xs text-left transition-all cursor-pointer ${
              statusFilter === "PENDING"
                ? "border-amber-500/60 ring-1 ring-amber-500/40"
                : "border-[#E5E7EB] hover:border-slate-300"
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 font-heading block">
              Pending Review
            </span>
            <div className="text-3xl font-extrabold text-amber-800 font-heading tracking-tight mt-1.5">
              {pendingCount}
            </div>
          </button>

          {/* Approved */}
          <button
            type="button"
            onClick={() => setStatusFilter("APPROVED")}
            className={`bg-white rounded-xl border p-5 shadow-2xs text-left transition-all cursor-pointer ${
              statusFilter === "APPROVED"
                ? "border-emerald-700/60 ring-1 ring-emerald-700/40"
                : "border-[#E5E7EB] hover:border-slate-300"
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 font-heading block">
              Approved
            </span>
            <div className="text-3xl font-extrabold text-emerald-800 font-heading tracking-tight mt-1.5">
              {approvedCount}
            </div>
          </button>

          {/* Rejected */}
          <button
            type="button"
            onClick={() => setStatusFilter("REJECTED")}
            className={`bg-white rounded-xl border p-5 shadow-2xs text-left transition-all cursor-pointer ${
              statusFilter === "REJECTED"
                ? "border-red-500/60 ring-1 ring-red-500/40"
                : "border-[#E5E7EB] hover:border-slate-300"
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 font-heading block">
              Rejected
            </span>
            <div className="text-3xl font-extrabold text-red-700 font-heading tracking-tight mt-1.5">
              {rejectedCount}
            </div>
          </button>
        </div>

        {/* ================================================================ */}
        {/* 2. PENDING REQUESTS TABLE                                        */}
        {/* ================================================================ */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="size-5 text-[#064E3B]" />
              Approval Requests
            </h2>

            {/* Search */}
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search requests..."
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-[#E5E7EB] bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition shadow-2xs"
              />
            </div>
          </div>

          {/* Table */}
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center space-y-3">
              <ClipboardCheck className="size-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 font-heading">
                No requests found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {statusFilter === "PENDING"
                  ? "All clear! No pending manager requests at this time."
                  : "No requests match your current filters."}
              </p>
              {statusFilter !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className="text-xs font-semibold text-emerald-800 hover:underline pt-2 cursor-pointer"
                >
                  View All Requests
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
              {/* Table Header */}
              <div className="hidden lg:grid grid-cols-[80px_1fr_1.2fr_140px_130px_160px] gap-4 px-6 py-3 bg-slate-50/80 border-b border-[#E5E7EB] text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span>Request</span>
                <span>Manager</span>
                <span>Action Requested</span>
                <span>Timestamp</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>

              {/* Table Rows */}
              {filteredRequests.map((request, idx) => (
                <div
                  key={request.id}
                  className={`grid grid-cols-1 lg:grid-cols-[80px_1fr_1.2fr_140px_130px_160px] gap-3 lg:gap-4 px-6 py-4 items-center transition-colors ${
                    idx < filteredRequests.length - 1 ? "border-b border-[#E5E7EB]" : ""
                  } ${
                    request.status === "PENDING"
                      ? "bg-amber-50/30 hover:bg-amber-50/60"
                      : "hover:bg-slate-50/60"
                  }`}
                >
                  {/* Request ID */}
                  <div className="flex items-center gap-2 lg:block">
                    <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase">ID:</span>
                    <span className="text-xs font-mono font-bold text-slate-600">
                      {request.id.replace("req-appr-", "#").substring(0, 8)}
                    </span>
                  </div>

                  {/* Manager */}
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-emerald-100 text-[#064E3B] font-bold text-[11px] flex items-center justify-center font-heading shrink-0">
                      {request.managerName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {request.managerName}
                      </p>
                      {request.managerEmail && (
                        <p className="text-[11px] text-slate-500 truncate">
                          {request.managerEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Requested */}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {request.actionType}
                    </p>
                    {request.propertyName && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                        <Building2 className="size-3 shrink-0" />
                        {request.propertyName}
                      </p>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="size-3 text-slate-400 shrink-0 hidden lg:block" />
                    <span className="text-[11px] text-slate-500">
                      {formatTimestamp(request.timestamp)}
                    </span>
                  </div>

                  {/* Status */}
                  <div>
                    <StatusBadge status={request.status} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 justify-end">
                    {request.status === "PENDING" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApprove(request.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white text-[11px] font-bold shadow-sm transition-all active:scale-[0.99] cursor-pointer"
                        >
                          <CheckCircle2 className="size-3.5" />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => openRejectDialog(request)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 text-[11px] font-bold transition-all active:scale-[0.99] cursor-pointer"
                        >
                          <XCircle className="size-3.5" />
                          Reject
                        </button>
                      </>
                    ) : (
                      <div className="text-right">
                        {request.reviewedBy && (
                          <p className="text-[10px] text-slate-400">
                            by {request.reviewedBy}
                          </p>
                        )}
                        {request.rejectionReason && (
                          <p className="text-[10px] text-red-500 italic mt-0.5 truncate max-w-[150px]">
                            &ldquo;{request.rejectionReason}&rdquo;
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================================================================ */}
        {/* 3. MANAGER AUDIT FOOTPRINTS (RECENT ACTIVITY)                    */}
        {/* ================================================================ */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
                <Activity className="size-5 text-[#064E3B]" />
                Manager Audit Footprints
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Strictly read-only, non-deletable audit trail of all manager actions.
              </p>
            </div>

            {/* Audit Search */}
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                value={auditSearchQuery}
                onChange={(e) => setAuditSearchQuery(e.target.value)}
                placeholder="Search audit trail..."
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-[#E5E7EB] bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition shadow-2xs"
              />
            </div>
          </div>

          {/* Immutability Notice */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-[#E5E7EB]">
            <Lock className="size-4 text-slate-500 shrink-0" />
            <p className="text-[11px] text-slate-600">
              <span className="font-bold text-slate-700">DevSecOps Compliance:</span>{" "}
              This audit trail is append-only and tamper-evident. Records cannot be modified, deleted, or reordered.
              All timestamps are server-authoritative.
            </p>
          </div>

          {/* Audit Timeline */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
            {filteredAuditLogs.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <FileText className="size-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800 font-heading">
                  No audit records found
                </h3>
                <p className="text-xs text-slate-500">
                  Manager activity footprints will appear here as actions are performed.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#E5E7EB]">
                {filteredAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors ${
                      log.status === "PENDING_APPROVAL"
                        ? "bg-amber-50/20"
                        : log.status === "FAILURE"
                        ? "bg-red-50/20"
                        : ""
                    }`}
                  >
                    {/* Action Icon */}
                    <AuditActionIcon actionType={log.actionType} />

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          [{formatTime(log.timestamp)}]
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {log.managerName}
                        </span>
                        <span
                          className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                            log.actionType === "CREATE"
                              ? "bg-emerald-100 text-emerald-700"
                              : log.actionType === "UPDATE"
                              ? "bg-blue-100 text-blue-700"
                              : log.actionType === "DELETE"
                              ? "bg-red-100 text-red-700"
                              : log.actionType === "REQUEST_APPROVAL"
                              ? "bg-amber-100 text-amber-700"
                              : log.actionType === "APPROVE"
                              ? "bg-emerald-100 text-emerald-700"
                              : log.actionType === "REJECT"
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {log.actionType.replace("_", " ")}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">
                        {log.actionDescription}
                      </p>

                      {/* Metadata Row */}
                      <div className="flex items-center gap-3 flex-wrap pt-0.5">
                        {log.propertyName && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                            <Building2 className="size-3" />
                            {log.propertyName}
                          </span>
                        )}
                        {log.resource && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                            <Hash className="size-3" />
                            {log.resource}
                          </span>
                        )}
                        <span
                          className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full ${
                            log.status === "SUCCESS"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : log.status === "FAILURE"
                              ? "bg-red-50 text-red-600 border border-red-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {log.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    {/* Relative Timestamp */}
                    <span className="text-[11px] text-slate-400 shrink-0 hidden sm:block">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            {auditLogs.length > 25 && (
              <div className="px-5 py-3 border-t border-[#E5E7EB] bg-slate-50/50 text-center">
                <p className="text-[11px] text-slate-500">
                  Showing latest 25 of {auditLogs.length} audit records.{" "}
                  <span className="font-semibold text-slate-700">
                    Full audit export available via DevSecOps panel.
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rejection Dialog */}
      <RejectDialog
        isOpen={rejectDialogOpen}
        requestId={rejectTarget?.id || ""}
        actionType={rejectTarget?.actionType || ""}
        onClose={() => {
          setRejectDialogOpen(false);
          setRejectTarget(null);
        }}
        onReject={handleReject}
      />
    </div>
  );
}
