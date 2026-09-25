"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, type ReactNode, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, LogOut, Mail, Pencil, RefreshCw, Search, ShieldBan } from "lucide-react";
import { toast } from "sonner";
import { AdminEmptyState, AdminPageHeader, AdminStatus } from "@/components/admin/admin-page";
import { AdminFeeRuleControls, AdminListingReportControls, AdminModuleControls, AdminResourceStatusControls } from "@/components/admin/admin-module-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { adminOperationsApi } from "@/lib/api/admin-operations-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatBDTFromPaisa } from "@/lib/formatters";

type Row = Record<string, unknown>;
type Column = { label: string; value: (row: Row) => unknown; status?: boolean; money?: boolean };
type ModuleData = { rows: Row[]; total?: number; note?: string };
type ModuleConfig = { eyebrow: string; title: string; description: string; searchable?: boolean; columns: Column[]; load: (filters: { page: number; search?: string }) => Promise<ModuleData>; detailHref?: (row: Row) => string };

const text = (value: unknown) => value == null || value === "" ? "—" : typeof value === "object" ? "—" : String(value);
const record = (value: unknown): Row => value && typeof value === "object" ? value as Row : {};
const personName = (value: unknown) => text(record(value).fullName ?? record(value).name);
const propertyName = (value: unknown) => text(record(value).name ?? record(record(value).property).name);

function pageResult(rows: unknown[], total?: number, note?: string): ModuleData {
  return { rows: rows as Row[], total, note };
}

function moduleConfig(section: string): ModuleConfig {
  const standard = (eyebrow: string, title: string, description: string, columns: Column[], load: ModuleConfig["load"], searchable = false): ModuleConfig => ({ eyebrow, title, description, columns, load, searchable });
  switch (section) {
    case "parking-resources": return standard("Operations", "Parking resources", "Physical fixed spaces and shared pools across the platform.", [
      { label: "Resource", value: (row) => row.displayName ?? row.spotCode }, { label: "Property", value: (row) => propertyName(row.property) }, { label: "Type", value: (row) => row.resourceType }, { label: "Capacity", value: (row) => row.capacity }, { label: "Status", value: (row) => row.status, status: true },
    ], async ({ page, search }) => { const data = await adminOperationsApi.resources({ page, limit: 20, search }); return pageResult(data.resources, data.pagination.total); }, true);
    case "bookings": return { ...standard("Operations", "Bookings", "Search booking lifecycle, payment state and operational ownership.", [
      { label: "Booking", value: (row) => row.bookingCode }, { label: "Driver", value: (row) => personName(row.driver) }, { label: "Property", value: (row) => propertyName(row.property) }, { label: "Start", value: (row) => row.startAt ? new Date(String(row.startAt)).toLocaleString("en-BD") : "—" }, { label: "Amount", value: (row) => row.totalAmountPaisa, money: true }, { label: "Status", value: (row) => row.status, status: true },
    ], async ({ page, search }) => { const data = await adminOperationsApi.bookings({ page, limit: 20, search }); return pageResult(data.bookings as unknown[], data.pagination.total); }, true), detailHref: (row) => `/admin/bookings/${text(row.id)}` };
    case "sessions": return standard("Operations", "Parking sessions", "Check-in, checkout requests, payment-due sessions and overtime signals.", [
      { label: "Booking", value: (row) => row.bookingCode }, { label: "Property", value: (row) => propertyName(row.property) }, { label: "Driver", value: (row) => personName(row.driver) }, { label: "Scheduled end", value: (row) => row.scheduledEndAt ? new Date(String(row.scheduledEndAt)).toLocaleString("en-BD") : "—" }, { label: "Status", value: (row) => row.status, status: true },
    ], async ({ page }) => { const data = await adminOperationsApi.sessions({ page, limit: 20 }); return pageResult(data.bookings as unknown[], data.pagination.total); });
    case "payments": return { ...standard("Finance", "Payments", "Read-only gateway payment inspection with captured and refunded states.", [
      { label: "Payment", value: (row) => row.id }, { label: "Booking", value: (row) => record(row.booking).bookingCode }, { label: "Payer", value: (row) => personName(row.payer) }, { label: "Amount", value: (row) => row.amountPaisa, money: true }, { label: "Gateway", value: (row) => row.provider }, { label: "Status", value: (row) => row.status, status: true },
    ], async ({ page, search }) => { const data = await adminOperationsApi.payments({ page, limit: 20, search }); return pageResult(data.payments as unknown[], data.pagination.total, "Gateway records are read-only; settlement and wallet movements are recorded separately in the ledger."); }, true), detailHref: (row) => `/admin/payments/${text(row.id)}` };
    case "ledger": return { ...standard("Finance", "Ledger explorer", "Immutable double-entry transactions with balance checks.", [
      { label: "Reference", value: (row) => row.referenceType }, { label: "Description", value: (row) => row.description }, { label: "Debit", value: (row) => row.debitPaisa, money: true }, { label: "Credit", value: (row) => row.creditPaisa, money: true }, { label: "Balanced", value: (row) => row.balanced ? "BALANCED" : "MISMATCH", status: true },
    ], async ({ page, search }) => { const data = await adminOperationsApi.ledger({ page, limit: 20, search }); return pageResult(data.transactions as unknown[], data.pagination.total); }, true), detailHref: (row) => `/admin/ledger/${text(row.id)}` };
    case "refunds": return standard("Finance", "Gateway refunds", "External payment refunds. Deposit returns and cancellation credits appear in the ledger and the Driver Refund Balance.", [
      { label: "Refund", value: (row) => row.id }, { label: "Booking", value: (row) => record(record(row.payment).booking).bookingCode }, { label: "Amount", value: (row) => row.amountPaisa, money: true }, { label: "Reason", value: (row) => row.reason }, { label: "Status", value: (row) => row.status, status: true },
    ], async ({ page }) => { const data = await adminOperationsApi.refunds({ page, limit: 20 }); return pageResult(data.refunds, data.pagination.total); });
    case "reviews": return standard("Trust & Safety", "Reviews", "Customer feedback and reported review oversight.", [
      { label: "Rating", value: (row) => `${text(row.rating)}/5` }, { label: "Driver", value: (row) => personName(row.driver) }, { label: "Property", value: (row) => propertyName(record(row.booking).property) }, { label: "Comment", value: (row) => row.comment }, { label: "Reported", value: (row) => row.reportedAt ? "REPORTED" : "CLEAR", status: true },
    ], async ({ page }) => { const data = await adminOperationsApi.reviews({ page, limit: 20 }); return pageResult(data.reviews, data.pagination.total); });
    case "risk-flags": return standard("Trust & Safety", "Risk flags", "Human-created operational flags; no automated fraud score is implied.", [
      { label: "Target", value: (row) => `${text(row.targetType)} · ${text(row.targetId)}` }, { label: "Level", value: (row) => row.level, status: true }, { label: "Reason", value: (row) => row.reason }, { label: "Created by", value: (row) => personName(row.createdByAdmin) }, { label: "State", value: (row) => row.resolvedAt ? "RESOLVED" : "OPEN", status: true },
    ], async ({ page }) => { const data = await adminOperationsApi.riskFlags({ page, limit: 20 }); return pageResult(data.flags, data.pagination.total); });
    case "listing-reports": return standard("Trust & Safety", "Reported listings", "Human-submitted listing concerns awaiting operational review.", [
      { label: "Listing", value: (row) => record(row.listing).title }, { label: "Property", value: (row) => propertyName(record(record(row.listing).parkingSpot).property) }, { label: "Reporter", value: (row) => personName(row.reporter) }, { label: "Reason", value: (row) => row.reason }, { label: "Status", value: (row) => row.status, status: true },
    ], async ({ page }) => { const data = await adminOperationsApi.listingReports({ page, limit: 20 }); return pageResult(data.reports, data.pagination.total); });
    case "audit-logs":
    case "security-events": return standard("Platform", section === "security-events" ? "Security events" : "Audit logs", "Traceable platform actions with safe metadata and request identifiers.", [
      { label: "Action", value: (row) => row.eventType }, { label: "Actor", value: (row) => personName(row.actor) }, { label: "Target", value: (row) => `${text(row.entityType)} · ${text(row.entityId)}` }, { label: "Time", value: (row) => row.createdAt ? new Date(String(row.createdAt)).toLocaleString("en-BD") : "—" },
    ], async ({ page, search }) => { const data = await adminOperationsApi.auditEvents({ page, limit: 20, entityType: search }); return pageResult(data.events as unknown[], data.pagination.total); }, true);
    case "parking-operations": return standard("Operations", "Live parking operations", "Occupancy, reservations, closures and guard coverage by Property.", [
      { label: "Property", value: (row) => row.name }, { label: "Capacity", value: (row) => row.capacity }, { label: "Occupied", value: (row) => row.occupied }, { label: "Reserved", value: (row) => row.reserved }, { label: "Available", value: (row) => row.available }, { label: "Utilization", value: (row) => `${text(row.utilizationPercent)}%` }, { label: "Coverage", value: (row) => row.guardCoverageGap ? "GAP" : "COVERED", status: true },
    ], async () => { const data = await adminOperationsApi.parkingOperations(); return pageResult(data.properties); });
    case "finance/reconciliation":
    case "earnings": return standard("Finance", section === "earnings" ? "Provider earnings controls" : "Financial reconciliation", "Ledger projections are compared with wallet and payout reservations without changing balances.", [
      { label: "Wallet", value: (row) => row.walletAccountId }, { label: "Projected", value: (row) => row.projectedPaisa, money: true }, { label: "Ledger", value: (row) => row.ledgerPaisa, money: true }, { label: "Difference", value: (row) => row.differencePaisa, money: true },
    ], async () => { const data = await adminOperationsApi.reconciliation(); return pageResult((data.discrepancies as unknown[]) ?? [], Number(data.discrepancyCount ?? 0), `${text(data.checkedWallets)} wallets checked`); });
    case "content/legal": return { ...standard("Content", "Legal documents", "Immutable published versions with preserved acceptance history.", [
      { label: "Type", value: (row) => row.type }, { label: "Version", value: (row) => row.version }, { label: "Title", value: (row) => row.title }, { label: "Effective", value: (row) => row.effectiveAt ? new Date(String(row.effectiveAt)).toLocaleDateString("en-BD") : "—" }, { label: "Status", value: (row) => row.status, status: true }, { label: "Acceptances", value: (row) => record(row._count).acceptances },
    ], async () => pageResult(await adminOperationsApi.legalDocuments())), detailHref: (row) => `/admin/content/legal/${text(row.id)}` };
    case "content/faq":
    case "content/help": { const kind = section.endsWith("faq") ? "FAQ" : "HELP_ARTICLE"; return standard("Content", kind === "FAQ" ? "FAQ" : "Help articles", "Audience-aware support content stored as safe Markdown.", [
      { label: "Title", value: (row) => row.title }, { label: "Slug", value: (row) => row.slug }, { label: "Audience", value: (row) => row.audience }, { label: "Status", value: (row) => row.status, status: true },
    ], async ({ page }) => { const data = await adminOperationsApi.articles({ page, limit: 20, kind }); return pageResult(data.articles, data.pagination.total); }); }
    case "notifications": return standard("Communication", "Notification history", "In-app delivery records across active platform accounts.", [
      { label: "Recipient", value: (row) => personName(row.user) }, { label: "Type", value: (row) => row.type }, { label: "Title", value: (row) => row.title }, { label: "Created", value: (row) => row.createdAt ? new Date(String(row.createdAt)).toLocaleString("en-BD") : "—" }, { label: "State", value: (row) => row.readAt ? "READ" : "UNREAD", status: true },
    ], async ({ page }) => { const data = await adminOperationsApi.notificationHistory({ page, limit: 20 }); return pageResult(data.notifications, data.pagination.total); });
    case "broadcasts": return standard("Communication", "Broadcasts", "Role-targeted in-app communication with audited delivery history.", [
      { label: "Campaign", value: (row) => row.title }, { label: "Audience", value: (row) => row.audience }, { label: "Scheduled", value: (row) => row.scheduledAt ? new Date(String(row.scheduledAt)).toLocaleString("en-BD") : "Manual" }, { label: "Status", value: (row) => row.status, status: true },
    ], async ({ page }) => { const data = await adminOperationsApi.campaigns({ page, limit: 20 }); return pageResult(data.campaigns, data.pagination.total); });
    case "platform-fees": return standard("Finance", "Platform fees", "Versioned future pricing rules. Resolution priority: Listing, Property, Provider, Global.", [
      { label: "Scope", value: (row) => row.scopeType }, { label: "Fee", value: (row) => row.feeType === "PERCENTAGE" ? `${Number(row.percentageBps ?? 0) / 100}%` : formatBDTFromPaisa(Number(row.fixedAmountPaisa ?? 0)) }, { label: "Effective", value: (row) => row.effectiveFrom ? new Date(String(row.effectiveFrom)).toLocaleString("en-BD") : "—" }, { label: "Reason", value: (row) => row.reason }, { label: "Status", value: (row) => row.status, status: true },
    ], async ({ page }) => { const data = await adminOperationsApi.feeRules({ page, limit: 20 }); return pageResult(data.rules, data.pagination.total, `Priority: ${data.resolutionPriority.join(" → ")}`); });
    case "analytics": return standard("Platform", "Operational analytics", "Aggregated booking, finance, user and occupancy signals for the last 30 days.", [
      { label: "Dataset", value: (row) => row.dataset }, { label: "Summary", value: (row) => row.summary },
    ], async () => { const data = await adminOperationsApi.analyticsOverview(); return pageResult(Object.entries(data).map(([dataset, value]) => ({ dataset, summary: `${Object.keys(record(value)).length} grouped metrics` }))); });
    case "system-health": return standard("Platform", "System health", "Sanitized dependency status with no credentials or connection strings.", [
      { label: "Service", value: (row) => row.service }, { label: "Status", value: (row) => row.status, status: true },
    ], async () => { const data = await adminOperationsApi.systemHealth(); return pageResult(Object.entries(record(data.checks)).map(([service, value]) => ({ service, status: record(value).status })), undefined, `Overall: ${text(data.overall)} · version ${text(data.apiVersion)}`); });
    case "platform-capabilities": return standard("Platform", "Platform capabilities", "Live feature availability and intentional service limitations.", [
      { label: "Capability", value: (row) => row.capability }, { label: "State", value: (row) => row.enabled ? "ENABLED" : "DISABLED", status: true },
    ], async () => { const data = await adminOperationsApi.capabilities(); return pageResult(Object.entries(data).map(([capability, enabled]) => ({ capability, enabled }))); });
    case "email-delivery": return standard("Communication", "Email delivery", "SMTP configuration health. Campaign email queues remain disabled until a durable worker is configured.", [
      { label: "Channel", value: () => "Email" }, { label: "Status", value: (row) => row.status, status: true }, { label: "Delivery mode", value: () => "Transactional only" },
    ], async () => { const data = await adminOperationsApi.systemHealth(); return pageResult([{ status: record(record(data.checks).email).status }]); });
    default: return standard("Admin", "Module unavailable", "This route is not connected to an Admin dataset.", [{ label: "Status", value: () => "NOT_AVAILABLE", status: true }], async () => pageResult([]));
  }
}

export function AdminModulePage({ section }: { section: string }) {
  if (section.startsWith("users/")) return <AdminUserDetailModule userId={section.slice("users/".length)} />;
  if (section.startsWith("bookings/")) return <AdminBookingDetailModule bookingId={section.slice("bookings/".length)} />;
  if (section.startsWith("payments/")) return <AdminReadOnlyDetailModule kind="payment" id={section.slice("payments/".length)} />;
  if (section.startsWith("ledger/")) return <AdminReadOnlyDetailModule kind="ledger" id={section.slice("ledger/".length)} />;
  return <AdminCollectionPage section={section} />;
}

function AdminCollectionPage({ section }: { section: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const search = searchParams.get("search") ?? undefined;
  const config = moduleConfig(section);
  const query = useQuery({ queryKey: ["admin", "module", section, page, search], queryFn: () => config.load({ page, search }) });

  function updateUrl(values: { page?: number; search?: string }) {
    const next = new URLSearchParams(searchParams.toString());
    if (values.page !== undefined) next.set("page", String(values.page));
    if (values.search !== undefined) {
      if (values.search) next.set("search", values.search);
      else next.delete("search");
    }
    router.replace(`${pathname}?${next.toString()}`);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateUrl({ page: 1, search: String(form.get("search") ?? "").trim() });
  }

  const totalPages = query.data?.total ? Math.max(1, Math.ceil(query.data.total / 20)) : 1;
  return <div className="space-y-6">
    <AdminPageHeader eyebrow={config.eyebrow} title={config.title} description={config.description} action={<Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw className="size-4" />Refresh</Button>} />
    <AdminModuleControls section={section} rows={query.data?.rows ?? []} onChanged={() => query.refetch()} />
    {section === "platform-fees" && <AdminFeeRuleControls rows={query.data?.rows ?? []} onChanged={() => query.refetch()} />}
    {section === "parking-resources" && <AdminResourceStatusControls rows={query.data?.rows ?? []} onChanged={() => query.refetch()} />}
    {section === "listing-reports" && <AdminListingReportControls rows={query.data?.rows ?? []} onChanged={() => query.refetch()} />}
    {config.searchable && <form onSubmit={submitSearch} className="flex max-w-xl gap-2"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" /><Input name="search" defaultValue={search} className="pl-9" placeholder="Search this dataset" /></div><Button type="submit">Search</Button></form>}
    {query.isPending ? <div className="h-64 animate-pulse bg-slate-200" /> : query.isError ? <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-800"><strong className="block">Unable to load this module</strong><span>{getApiErrorMessage(query.error)}</span><Button variant="outline" size="sm" className="mt-3" onClick={() => query.refetch()}>Retry</Button></div> : query.data.rows.length === 0 ? <AdminEmptyState title={`No ${config.title.toLowerCase()} need attention`} description="Records will appear here when the platform has matching operational data." /> : <>
      {query.data.note && <p className="border-l-2 border-emerald-700 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">{query.data.note}</p>}
      <div className="overflow-x-auto border border-slate-200 bg-white"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase text-slate-500"><tr>{config.columns.map((column) => <th key={column.label} className="px-4 py-3 font-bold">{column.label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{query.data.rows.map((row, rowIndex) => <tr key={text(row.id ?? rowIndex)} className="hover:bg-slate-50">{config.columns.map((column, columnIndex) => { const value = column.value(row); const content = column.status ? <AdminStatus value={text(value)} /> : column.money ? <span className="font-semibold text-slate-950">{formatBDTFromPaisa(Number(value ?? 0))}</span> : <span className="line-clamp-2">{text(value)}</span>; return <td key={column.label} className="max-w-xs px-4 py-3 text-xs text-slate-700">{columnIndex === 0 && config.detailHref ? <Link href={config.detailHref(row)} className="font-bold text-emerald-800 hover:underline">{content}</Link> : content}</td>; })}</tr>)}</tbody></table></div>
      {query.data.total !== undefined && <div className="flex items-center justify-between text-xs text-slate-500"><span>{query.data.total.toLocaleString("en-BD")} records</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => updateUrl({ page: page - 1 })}><ChevronLeft className="size-4" />Previous</Button><span>Page {page} of {totalPages}</span><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => updateUrl({ page: page + 1 })}>Next<ChevronRight className="size-4" /></Button></div></div>}
    </>}
    {section === "bookings" && <p className="text-xs text-slate-500">Open a booking from its code in the dedicated operational detail view when investigation is required.</p>}
    {section === "risk-flags" && <Link href="/admin/users" className="text-xs font-semibold text-emerald-800">Open user oversight</Link>}
  </div>;
}

type UserAction = "suspend" | "unsuspend" | "block" | "unblock" | "logout-all";

function AdminUserDetailModule({ userId }: { userId: string }) {
  const client = useQueryClient();
  const [action, setAction] = useState<UserAction | null>(null);
  const [reason, setReason] = useState("");
  const [oversightAction, setOversightAction] = useState<"note" | "risk" | null>(null);
  const [riskLevel, setRiskLevel] = useState("MEDIUM");
  const [editOpen, setEditOpen] = useState(false);
  const [editProfile, setEditProfile] = useState({ fullName: "", email: "", phone: "" });
  const [resolvingFlagId, setResolvingFlagId] = useState<string | null>(null);
  const [resolveReason, setResolveReason] = useState("");
  const query = useQuery({ queryKey: ["admin", "users", "detail", userId], queryFn: () => adminOperationsApi.user(userId) });
  const mutation = useMutation({
    mutationFn: async () => action === "logout-all" ? adminOperationsApi.revokeUserSessions(userId, reason) : adminOperationsApi.moderateUser(userId, action!, reason),
    onSuccess: async () => {
      toast.success("Admin action completed");
      setAction(null);
      setReason("");
      await Promise.all([query.refetch(), client.invalidateQueries({ queryKey: ["admin", "users"] })]);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  const oversightMutation = useMutation({
    mutationFn: () => oversightAction === "note"
      ? adminOperationsApi.createNote({ subjectType: "USER", subjectId: userId, body: reason })
      : adminOperationsApi.createRiskFlag({ targetType: "USER", targetId: userId, level: riskLevel, reason }),
    onSuccess: async () => { toast.success(oversightAction === "note" ? "Private note added" : "Risk flag added"); setOversightAction(null); setReason(""); await query.refetch(); },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  const editMutation = useMutation({
    mutationFn: () => adminOperationsApi.updateUser(userId, {
      fullName: editProfile.fullName.trim(),
      email: editProfile.email.trim().toLowerCase(),
      phone: editProfile.phone.trim(),
    }),
    onSuccess: async () => {
      toast.success("User profile updated");
      setEditOpen(false);
      await Promise.all([query.refetch(), client.invalidateQueries({ queryKey: ["admin", "users"] })]);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  const resendSetupMutation = useMutation({
    mutationFn: () => adminOperationsApi.resendUserSetup(userId),
    onSuccess: () => toast.success("A fresh account setup link was sent"),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  const resolveRiskMutation = useMutation({
    mutationFn: () => adminOperationsApi.resolveRiskFlag(resolvingFlagId!, resolveReason.trim()),
    onSuccess: async () => {
      toast.success("Risk flag resolved");
      setResolvingFlagId(null);
      setResolveReason("");
      await query.refetch();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  if (query.isPending) return <div className="h-64 animate-pulse bg-slate-200" />;
  if (query.isError) return <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-800">{getApiErrorMessage(query.error)}</div>;
  const user = query.data;
  return <div className="space-y-6">
    <AdminPageHeader eyebrow="People / User" title={user.fullName} description={`${user.email} · ${user.phone}`} action={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => { setEditProfile({ fullName: user.fullName, email: user.email, phone: user.phone }); setEditOpen(true); }}><Pencil className="size-4" />Edit profile</Button>{user.status === "PENDING" && user.accountOrigin.startsWith("ADMIN_CREATED") && <Button variant="outline" disabled={resendSetupMutation.isPending} onClick={() => resendSetupMutation.mutate()}><Mail className="size-4" />Resend setup</Button>}<Button variant="outline" onClick={() => { setReason(""); setOversightAction("note"); }}>Add note</Button><Button variant="outline" onClick={() => { setReason(""); setOversightAction("risk"); }}>Flag risk</Button>{user.status === "SUSPENDED" ? <Button variant="outline" onClick={() => setAction("unsuspend")}>Unsuspend</Button> : user.status !== "BLOCKED" ? <Button variant="outline" onClick={() => setAction("suspend")}>Suspend</Button> : null}{user.status === "BLOCKED" ? <Button variant="outline" onClick={() => setAction("unblock")}>Unblock</Button> : <Button variant="destructive" onClick={() => setAction("block")}><ShieldBan className="size-4" />Block</Button>}<Button variant="outline" onClick={() => setAction("logout-all")}><LogOut className="size-4" />Revoke sessions</Button></div>} />
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Info label="Status" value={<AdminStatus value={user.status} />} /><Info label="Roles" value={user.roles.map((item) => item.role).join(" · ")} /><Info label="Email" value={user.emailVerified ? "Verified" : "Pending"} /><Info label="Active sessions" value={user.activeSessionCount.toString()} /></section>
    <section className="border border-slate-200 bg-white"><h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Account footprint</h2><div className="grid gap-px bg-slate-100 sm:grid-cols-3"><Info label="Driver bookings" value={user._count.driverBookings.toString()} /><Info label="Provider bookings" value={user._count.providerBookings.toString()} /><Info label="Vehicles" value={user._count.vehicles.toString()} /><Info label="Provider memberships" value={user._count.providerMemberships.toString()} /><Info label="Manager delegations" value={user._count.managerDelegations.toString()} /><Info label="Guard memberships" value={user._count.propertyGuardMemberships.toString()} /></div></section>
    <section className="grid gap-4 lg:grid-cols-2"><div className="border border-slate-200 bg-white"><h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Property roles</h2>{user.providerMemberships.length + user.managerDelegations.length + user.propertyGuardMemberships.length ? <div className="divide-y divide-slate-100">{user.providerMemberships.map((membership) => <div key={membership.id} className="flex justify-between gap-3 px-4 py-3 text-xs"><span><strong>Provider</strong> · {membership.property.name}</span><AdminStatus value={membership.status} /></div>)}{user.managerDelegations.map((delegation) => <div key={delegation.id} className="flex justify-between gap-3 px-4 py-3 text-xs"><span><strong>Manager</strong> · {delegation.property.name}</span><AdminStatus value={delegation.status} /></div>)}{user.propertyGuardMemberships.map((membership) => <div key={membership.id} className="flex justify-between gap-3 px-4 py-3 text-xs"><span><strong>Guard</strong> · {membership.property.name}</span><AdminStatus value={membership.status} /></div>)}</div> : <p className="p-4 text-sm text-slate-500">No Property role history.</p>}</div><div className="border border-slate-200 bg-white"><h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Driver vehicles</h2>{user.vehicles.length ? <div className="divide-y divide-slate-100">{user.vehicles.map((vehicle) => <div key={vehicle.id} className="flex justify-between gap-3 px-4 py-3 text-xs"><span><strong>{vehicle.registrationNumber}</strong> · {vehicle.vehicleType}{vehicle.isDefault ? " · Default" : ""}</span><AdminStatus value={vehicle.verificationStatus} /></div>)}</div> : <p className="p-4 text-sm text-slate-500">No registered vehicles.</p>}</div></section>
    <div className="grid gap-4 lg:grid-cols-2"><section className="border border-slate-200 bg-white"><h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Risk flags</h2>{user.riskFlags.length ? <div className="divide-y divide-slate-100">{user.riskFlags.map((flag) => <div key={flag.id} className="p-4 text-xs"><div className="flex items-center justify-between gap-3"><AdminStatus value={flag.level} />{flag.resolvedAt ? <span>Resolved</span> : <Button size="sm" variant="outline" onClick={() => { setResolvingFlagId(flag.id); setResolveReason(""); }}>Resolve</Button>}</div><p className="mt-2 text-slate-700">{flag.reason}</p></div>)}</div> : <p className="p-4 text-sm text-slate-500">No operational risk flags.</p>}</section><section className="border border-slate-200 bg-white"><h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Private Admin notes</h2>{user.adminNotes.length ? <div className="divide-y divide-slate-100">{user.adminNotes.map((note) => <div key={note.id} className="p-4 text-xs"><p className="text-slate-700">{note.body}</p><p className="mt-2 text-slate-400">{note.authorAdmin.fullName} · {new Date(note.createdAt).toLocaleString("en-BD")}</p></div>)}</div> : <p className="p-4 text-sm text-slate-500">No private notes.</p>}</section></div>
    <section className="border border-slate-200 bg-white"><h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Safe session history</h2>{user.refreshSessions.length ? <div className="divide-y divide-slate-100">{user.refreshSessions.map((session) => <div key={session.id} className="grid gap-2 px-4 py-3 text-xs sm:grid-cols-3"><span className="line-clamp-1">{session.userAgent ?? "Unknown device"}</span><span>{new Date(session.createdAt).toLocaleString("en-BD")}</span><AdminStatus value={session.revokedAt ? "REVOKED" : new Date(session.expiresAt) < new Date() ? "EXPIRED" : "ACTIVE"} /></div>)}</div> : <p className="p-4 text-sm text-slate-500">No sessions recorded.</p>}</section>
    <section className="border border-slate-200 bg-white"><h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Account activity timeline</h2>{user.timeline.length ? <ol className="max-h-[480px] divide-y divide-slate-100 overflow-y-auto">{user.timeline.map((event) => <li key={event.id} className="grid gap-1 px-4 py-3 text-xs sm:grid-cols-[1fr_auto]"><span><strong>{event.eventType.replaceAll("_", " ")}</strong> · {event.entityType}</span><time className="text-slate-400">{new Date(event.createdAt).toLocaleString("en-BD")}</time><span className="text-slate-500">Actor: {event.actor?.fullName ?? "System"}{event.requestId ? ` · Request ${event.requestId}` : ""}</span></li>)}</ol> : <p className="p-4 text-sm text-slate-500">No audited account activity.</p>}</section>
    <Dialog open={Boolean(action)} onOpenChange={(open) => { if (!open && !mutation.isPending) { setAction(null); setReason(""); } }}><DialogContent><DialogHeader><DialogTitle>Confirm Admin action</DialogTitle><DialogDescription>This high-impact action is audited. Enter a clear operational reason before continuing.</DialogDescription></DialogHeader><Textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={500} placeholder="Reason (minimum 10 characters)" /><DialogFooter><Button variant="outline" onClick={() => setAction(null)} disabled={mutation.isPending}>Cancel</Button><Button variant={action === "block" ? "destructive" : "default"} disabled={mutation.isPending || reason.trim().length < 10} onClick={() => mutation.mutate()}>Confirm {action?.replace("-", " ")}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={Boolean(oversightAction)} onOpenChange={(open) => { if (!open && !oversightMutation.isPending) { setOversightAction(null); setReason(""); } }}><DialogContent><DialogHeader><DialogTitle>{oversightAction === "note" ? "Add private Admin note" : "Create operational risk flag"}</DialogTitle><DialogDescription>{oversightAction === "note" ? "This note is visible only inside the Admin console." : "This is a human-created flag, not an automated fraud score."}</DialogDescription></DialogHeader>{oversightAction === "risk" && <select className="h-10 border bg-white px-3 text-sm" value={riskLevel} onChange={(event) => setRiskLevel(event.target.value)}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select>}<Textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={oversightAction === "risk" ? 10 : 2} maxLength={oversightAction === "risk" ? 1000 : 3000} placeholder={oversightAction === "note" ? "Private note" : "Risk reason (minimum 10 characters)"} /><DialogFooter><Button variant="outline" onClick={() => setOversightAction(null)} disabled={oversightMutation.isPending}>Cancel</Button><Button disabled={oversightMutation.isPending || reason.trim().length < (oversightAction === "risk" ? 10 : 2)} onClick={() => oversightMutation.mutate()}>Save</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={editOpen} onOpenChange={(open) => { if (!editMutation.isPending) setEditOpen(open); }}><DialogContent><DialogHeader><DialogTitle>Edit user profile</DialogTitle><DialogDescription>Changing the email resets email verification and revokes active sessions. Every change is audited.</DialogDescription></DialogHeader><div className="space-y-3"><Input value={editProfile.fullName} onChange={(event) => setEditProfile((current) => ({ ...current, fullName: event.target.value }))} placeholder="Full name" /><Input type="email" value={editProfile.email} onChange={(event) => setEditProfile((current) => ({ ...current, email: event.target.value }))} placeholder="Email address" /><Input value={editProfile.phone} onChange={(event) => setEditProfile((current) => ({ ...current, phone: event.target.value }))} placeholder="Bangladesh phone number" /></div><DialogFooter><Button variant="outline" disabled={editMutation.isPending} onClick={() => setEditOpen(false)}>Cancel</Button><Button disabled={editMutation.isPending || editProfile.fullName.trim().length < 2 || !editProfile.email.includes("@") || editProfile.phone.trim().length < 10} onClick={() => editMutation.mutate()}>{editMutation.isPending && <RefreshCw className="size-4 animate-spin" />}Save changes</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={Boolean(resolvingFlagId)} onOpenChange={(open) => { if (!open && !resolveRiskMutation.isPending) { setResolvingFlagId(null); setResolveReason(""); } }}><DialogContent><DialogHeader><DialogTitle>Resolve risk flag</DialogTitle><DialogDescription>Record why this operational concern is no longer open. The original flag remains in history.</DialogDescription></DialogHeader><Textarea value={resolveReason} onChange={(event) => setResolveReason(event.target.value)} minLength={10} maxLength={1000} placeholder="Resolution reason (minimum 10 characters)" /><DialogFooter><Button variant="outline" disabled={resolveRiskMutation.isPending} onClick={() => setResolvingFlagId(null)}>Cancel</Button><Button disabled={resolveRiskMutation.isPending || resolveReason.trim().length < 10} onClick={() => resolveRiskMutation.mutate()}>Resolve flag</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

type BookingAction = "refund" | "cancel";

function AdminBookingDetailModule({ bookingId }: { bookingId: string }) {
  const [action, setAction] = useState<BookingAction | null>(null);
  const [reason, setReason] = useState("");
  const [amountPaisa, setAmountPaisa] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const query = useQuery({ queryKey: ["admin", "bookings", bookingId], queryFn: () => adminOperationsApi.booking(bookingId) });
  const mutation = useMutation({
    mutationFn: () => action === "refund"
      ? adminOperationsApi.refundBooking(bookingId, { amountPaisa: Number(amountPaisa), reason, idempotencyKey })
      : adminOperationsApi.cancelBooking(bookingId, reason),
    onSuccess: async () => { toast.success(action === "refund" ? "Refund processed" : "Booking cancelled"); setAction(null); setReason(""); setAmountPaisa(""); await query.refetch(); },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  if (query.isPending) return <div className="h-64 animate-pulse bg-slate-200" />;
  if (query.isError) return <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-800">{getApiErrorMessage(query.error)}</div>;
  const booking = record(query.data);
  const driver = record(booking.driver); const provider = record(booking.provider); const property = record(booking.property); const vehicle = record(booking.vehicle);
  const payments = Array.isArray(booking.payments) ? booking.payments.map(record) : [];
  const timeline = Array.isArray(booking.timeline) ? booking.timeline.map(record) : [];
  const refundable = payments.some((payment) => payment.status === "CAPTURED" || payment.status === "PARTIALLY_REFUNDED");
  const cancellable = ["PAYMENT_PENDING", "CONFIRMED"].includes(text(booking.status)) && new Date(String(booking.startAt)) > new Date();
  function openRefund() { setIdempotencyKey(globalThis.crypto.randomUUID()); setAction("refund"); }
  return <div className="space-y-6">
    <AdminPageHeader eyebrow="Operations / Booking" title={text(booking.bookingCode)} description={`Created ${booking.createdAt ? new Date(String(booking.createdAt)).toLocaleString("en-BD") : "—"}`} action={<div className="flex gap-2">{refundable && <Button variant="outline" onClick={openRefund}>Refund</Button>}{cancellable && <Button variant="destructive" onClick={() => setAction("cancel")}>Cancel booking</Button>}</div>} />
    <section className="grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4"><Info label="Status" value={<AdminStatus value={text(booking.status)} />} /><Info label="Driver" value={text(driver.fullName)} /><Info label="Provider" value={text(provider.fullName)} /><Info label="Property" value={text(property.name)} /><Info label="Vehicle" value={text(vehicle.registrationNumber)} /><Info label="Starts" value={booking.startAt ? new Date(String(booking.startAt)).toLocaleString("en-BD") : "—"} /><Info label="Scheduled end" value={booking.scheduledEndAt ? new Date(String(booking.scheduledEndAt)).toLocaleString("en-BD") : "—"} /><Info label="Total" value={formatBDTFromPaisa(Number(booking.totalAmountPaisa ?? 0))} /></section>
    <section className="border border-slate-200 bg-white"><h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Payments and refunds</h2>{payments.length ? <div className="divide-y divide-slate-100">{payments.map((payment) => <div key={text(payment.id)} className="grid gap-2 px-4 py-3 text-xs sm:grid-cols-4"><span className="font-mono">{text(payment.id)}</span><AdminStatus value={text(payment.status)} /><span>{formatBDTFromPaisa(Number(payment.amountPaisa ?? 0))}</span><span>{text(payment.provider)}</span></div>)}</div> : <p className="p-4 text-sm text-slate-500">No payment attempt is linked to this booking.</p>}</section>
    <section className="border border-slate-200 bg-white"><h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Operational timeline</h2>{timeline.length ? <ol className="divide-y divide-slate-100">{timeline.map((event) => <li key={text(event.id)} className="flex justify-between gap-3 px-4 py-3 text-xs"><span><strong>{text(event.eventType)}</strong><span className="ml-2 text-slate-500">{text(event.entityType)}</span></span><time>{event.createdAt ? new Date(String(event.createdAt)).toLocaleString("en-BD") : "—"}</time></li>)}</ol> : <p className="p-4 text-sm text-slate-500">No audited lifecycle event is available yet.</p>}</section>
    <Dialog open={Boolean(action)} onOpenChange={(open) => { if (!open && !mutation.isPending) setAction(null); }}><DialogContent><DialogHeader><DialogTitle>{action === "refund" ? "Process booking refund" : "Cancel booking"}</DialogTitle><DialogDescription>{action === "refund" ? "The backend enforces the refundable balance and posts a balanced ledger reversal. Enter the amount in paisa." : "Confirmed bookings must be fully refunded first. Started bookings cannot be cancelled."}</DialogDescription></DialogHeader>{action === "refund" && <Input value={amountPaisa} onChange={(event) => setAmountPaisa(event.target.value)} type="number" min={1} step={1} placeholder="Refund amount in paisa" />}<Textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={500} placeholder="Reason (minimum 10 characters)" /><DialogFooter><Button variant="outline" onClick={() => setAction(null)} disabled={mutation.isPending}>Cancel</Button><Button variant={action === "cancel" ? "destructive" : "default"} disabled={mutation.isPending || reason.trim().length < 10 || (action === "refund" && Number(amountPaisa) <= 0)} onClick={() => mutation.mutate()}>{mutation.isPending && <RefreshCw className="size-4 animate-spin" />}Confirm</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function AdminReadOnlyDetailModule({ kind, id }: { kind: "payment" | "ledger"; id: string }) {
  const query = useQuery({ queryKey: ["admin", kind, id], queryFn: () => kind === "payment" ? adminOperationsApi.payment(id) : adminOperationsApi.ledgerTransaction(id) });
  if (query.isPending) return <div className="h-64 animate-pulse bg-slate-200" />;
  if (query.isError) return <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-800">{getApiErrorMessage(query.error)}</div>;
  const item = record(query.data);
  const children = kind === "payment" ? (Array.isArray(item.refunds) ? item.refunds.map(record) : []) : (Array.isArray(item.entries) ? item.entries.map(record) : []);
  const hidden = new Set(["refunds", "entries", "payer", "booking", "actor"]);
  return <div className="space-y-6"><AdminPageHeader eyebrow={`Finance / ${kind}`} title={kind === "payment" ? `Payment ${id}` : text(item.description)} description={kind === "payment" ? "Read-only payment gateway record" : "Immutable double-entry transaction"} />
    <section className="grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(item).filter(([key, value]) => !hidden.has(key) && typeof value !== "object").map(([key, value]) => <Info key={key} label={key.replaceAll(/([A-Z])/g, " $1")} value={key.toLowerCase().includes("paisa") ? formatBDTFromPaisa(Number(value ?? 0)) : text(value)} />)}</section>
    <section className="border border-slate-200 bg-white"><h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">{kind === "payment" ? "Refund history" : "Ledger entries"}</h2>{children.length ? <div className="divide-y divide-slate-100">{children.map((child, index) => <div key={text(child.id ?? index)} className="grid gap-2 px-4 py-3 text-xs sm:grid-cols-4"><span>{text(child.accountCode ?? child.reason ?? child.id)}</span><span>{text(child.entrySide ?? child.status)}</span><span>{formatBDTFromPaisa(Number(child.amountPaisa ?? 0))}</span><span>{child.createdAt ? new Date(String(child.createdAt)).toLocaleString("en-BD") : "—"}</span></div>)}</div> : <p className="p-4 text-sm text-slate-500">No related records.</p>}</section>
  </div>;
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return <div className="bg-white p-4"><p className="text-[11px] font-bold uppercase text-slate-500">{label}</p><div className="mt-2 text-sm font-semibold text-slate-950">{value}</div></div>;
}
