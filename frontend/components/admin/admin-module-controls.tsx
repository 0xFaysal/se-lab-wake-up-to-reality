"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Archive, CalendarClock, CheckCircle2, Copy, Loader2, Pencil, Play, Plus, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminOperationsApi } from "@/lib/api/admin-operations-api";
import { getApiErrorMessage } from "@/lib/api/api-error";

type Row = Record<string, unknown>;
type Action = { kind: "publish-legal" | "publish-article" | "send-campaign" | "deactivate-fee"; id: string; title: string };

const labels: Record<string, { button: string; title: string; description: string }> = {
  "content/legal": { button: "New legal version", title: "Create legal draft", description: "Published versions stay immutable. Create a new draft for every change." },
  "content/faq": { button: "New FAQ", title: "Create FAQ draft", description: "Content is stored as plain Markdown and rendered through the safe content layer." },
  "content/help": { button: "New help article", title: "Create help draft", description: "Choose the intended audience before publishing." },
  broadcasts: { button: "New broadcast", title: "Create broadcast draft", description: "Creating a draft does not send notifications. Sending requires a separate confirmation." },
  "platform-fees": { button: "New fee rule", title: "Create future fee rule", description: "Rules apply only to new quotes after the effective time. Existing booking snapshots never change." },
};

export function AdminModuleControls({ section, rows, onChanged }: { section: string; rows: Row[]; onChanged: () => Promise<unknown> }) {
  const copy = labels[section];
  const [createOpen, setCreateOpen] = useState(false);
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState("");
  const actionableRows = useMemo(() => rows.filter((row) => {
    if (section === "content/legal" || section === "content/faq" || section === "content/help" || section === "broadcasts") return row.status === "DRAFT";
    return false;
  }), [rows, section]);
  const actionMutation = useMutation({
    mutationFn: async () => {
      if (!action) throw new Error("No action selected");
      if (action.kind === "publish-legal") return adminOperationsApi.publishLegal(action.id);
      if (action.kind === "publish-article") return adminOperationsApi.publishArticle(action.id);
      if (action.kind === "send-campaign") return adminOperationsApi.sendCampaign(action.id);
      return adminOperationsApi.deactivateFeeRule(action.id, reason);
    },
    onSuccess: async () => { toast.success("Admin action completed"); setAction(null); setReason(""); await onChanged(); },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  if (!copy) return null;
  return <section className="space-y-3 border border-slate-200 bg-white p-4">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-sm font-bold">Module controls</h2><p className="text-xs text-slate-500">Draft first, then perform the audited high-impact action separately.</p></div><Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="size-4" />{copy.button}</Button></div>
    {actionableRows.length > 0 && <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">{actionableRows.slice(0, 12).map((row) => {
      const id = String(row.id);
      const title = String(row.title ?? row.version ?? row.scopeType ?? id);
      const kind: Action["kind"] = section === "content/legal" ? "publish-legal" : section === "broadcasts" ? "send-campaign" : section === "platform-fees" ? "deactivate-fee" : "publish-article";
      const verb = kind === "send-campaign" ? "Send" : kind === "deactivate-fee" ? "Deactivate" : "Publish";
      return <Button key={id} size="sm" variant="outline" onClick={() => setAction({ kind, id, title })}>{verb}: {title}</Button>;
    })}</div>}
    <CreateDialog section={section} open={createOpen} onOpenChange={setCreateOpen} onChanged={onChanged} copy={copy} />
    <Dialog open={Boolean(action)} onOpenChange={(open) => { if (!open && !actionMutation.isPending) { setAction(null); setReason(""); } }}><DialogContent><DialogHeader><DialogTitle>Confirm Admin action</DialogTitle><DialogDescription>{action?.kind === "send-campaign" ? `Send “${action.title}” to its selected audience now? Recipient targeting is calculated by the backend.` : action?.kind === "deactivate-fee" ? `Deactivate “${action.title}”? Historical quote and booking fee snapshots remain unchanged.` : `Publish “${action?.title}”? Published content is immutable.`}</DialogDescription></DialogHeader>{action?.kind === "deactivate-fee" && <Textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={500} placeholder="Reason (minimum 10 characters)" />}<DialogFooter><Button variant="outline" onClick={() => setAction(null)} disabled={actionMutation.isPending}>Cancel</Button><Button variant={action?.kind === "deactivate-fee" ? "destructive" : "default"} disabled={actionMutation.isPending || (action?.kind === "deactivate-fee" && reason.trim().length < 10)} onClick={() => actionMutation.mutate()}>{actionMutation.isPending && <Loader2 className="size-4 animate-spin" />}Confirm</Button></DialogFooter></DialogContent></Dialog>
  </section>;
}

type FeeAction = "edit" | "clone" | "schedule" | "activate" | "deactivate" | "archive" | "delete";

export function AdminFeeRuleControls({ rows, onChanged }: { rows: Row[]; onChanged: () => Promise<unknown> }) {
  const [selection, setSelection] = useState<{ action: FeeAction; row: Row } | null>(null);
  const [reason, setReason] = useState("");
  const [effectiveAt, setEffectiveAt] = useState("");
  const [value, setValue] = useState("");
  const mutation = useMutation({
    mutationFn: async () => {
      if (!selection) throw new Error("No fee action selected");
      const id = String(selection.row.id);
      const iso = effectiveAt ? new Date(effectiveAt).toISOString() : "";
      if (selection.action === "edit") return adminOperationsApi.updateFeeRule(id, { effectiveFrom: iso, reason: reason.trim(), ...(selection.row.feeType === "PERCENTAGE" ? { percentageBps: Number(value), fixedAmountPaisa: null } : { fixedAmountPaisa: Number(value), percentageBps: null }) });
      if (selection.action === "clone") return adminOperationsApi.cloneFeeRule(id, { effectiveFrom: iso, reason: reason.trim() });
      if (selection.action === "schedule") return adminOperationsApi.scheduleFeeRule(id, iso, reason.trim());
      if (selection.action === "activate") return adminOperationsApi.activateFeeRule(id, reason.trim());
      if (selection.action === "deactivate") return adminOperationsApi.deactivateFeeRule(id, reason.trim());
      if (selection.action === "archive") return adminOperationsApi.archiveFeeRule(id, reason.trim());
      return adminOperationsApi.deleteFeeRule(id);
    },
    onSuccess: async () => { toast.success("Platform fee lifecycle updated"); setSelection(null); setReason(""); await onChanged(); },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  function open(action: FeeAction, row: Row) {
    setSelection({ action, row });
    setReason(String(row.reason ?? ""));
    setValue(String(row.feeType === "PERCENTAGE" ? row.percentageBps ?? "" : row.fixedAmountPaisa ?? ""));
    setEffectiveAt(row.effectiveFrom ? toLocalInput(String(row.effectiveFrom)) : "");
  }
  if (rows.length === 0) return null;
  const needsDate = selection?.action === "edit" || selection?.action === "clone" || selection?.action === "schedule";
  const needsReason = selection?.action !== "delete";
  return <section className="space-y-3 border border-slate-200 bg-white p-4"><div><h2 className="text-sm font-bold">Fee rule lifecycle</h2><p className="text-xs text-slate-500">Drafts are editable. Historical rules are cloned into a new version; quote snapshots never change.</p></div><div className="space-y-2 border-t pt-3">{rows.slice(0, 20).map((row) => <div key={String(row.id)} className="flex flex-wrap items-center justify-between gap-3 border-b pb-2 text-xs"><span><strong>{String(row.scopeType)} v{String(row.version ?? 1)}</strong> · {String(row.status)}</span><div className="flex flex-wrap gap-1">{row.status === "DRAFT" && <><Button size="sm" variant="outline" onClick={() => open("edit", row)}><Pencil className="size-3" />Edit</Button><Button size="sm" variant="outline" onClick={() => open("schedule", row)}><CalendarClock className="size-3" />Schedule</Button><Button size="sm" onClick={() => open("activate", row)}><Play className="size-3" />Activate</Button><Button size="icon" variant="ghost" title="Delete unused draft" onClick={() => open("delete", row)}><Trash2 className="size-3 text-red-600" /></Button></>}{row.status !== "DRAFT" && <Button size="sm" variant="outline" onClick={() => open("clone", row)}><Copy className="size-3" />Clone</Button>}{(row.status === "ACTIVE" || row.status === "SCHEDULED") && <Button size="sm" variant="outline" onClick={() => open("deactivate", row)}>Deactivate</Button>}{row.status === "INACTIVE" && <Button size="sm" variant="outline" onClick={() => open("archive", row)}><Archive className="size-3" />Archive</Button>}</div></div>)}</div><Dialog open={Boolean(selection)} onOpenChange={(open) => { if (!open && !mutation.isPending) setSelection(null); }}><DialogContent><DialogHeader><DialogTitle>{selection ? `${selection.action[0]?.toUpperCase()}${selection.action.slice(1)} fee rule` : "Fee rule action"}</DialogTitle><DialogDescription>{selection?.action === "delete" ? "Only a never-used draft without replacement versions can be permanently deleted." : "This action is audited. Used quote and booking fee amounts remain unchanged."}</DialogDescription></DialogHeader>{selection?.action === "edit" && <Input type="number" min={0} value={value} onChange={(event) => setValue(event.target.value)} placeholder={selection.row.feeType === "PERCENTAGE" ? "Basis points" : "Fixed paisa"} />}{needsDate && <label className="text-xs font-semibold">Effective date and time<Input className="mt-1" type="datetime-local" value={effectiveAt} onChange={(event) => setEffectiveAt(event.target.value)} /></label>}{needsReason && <Textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={500} placeholder="Reason (minimum 10 characters)" />}<DialogFooter><Button variant="outline" disabled={mutation.isPending} onClick={() => setSelection(null)}>Cancel</Button><Button variant={selection?.action === "delete" || selection?.action === "deactivate" || selection?.action === "archive" ? "destructive" : "default"} disabled={mutation.isPending || (needsReason && reason.trim().length < 10) || (needsDate && !effectiveAt) || (selection?.action === "edit" && Number(value) < 0)} onClick={() => mutation.mutate()}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Confirm</Button></DialogFooter></DialogContent></Dialog></section>;
}

function toLocalInput(value: string) { const date = new Date(value); const offset = date.getTimezoneOffset(); return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16); }

export function AdminResourceStatusControls({ rows, onChanged }: { rows: Row[]; onChanged: () => Promise<unknown> }) {
  const [resourceId, setResourceId] = useState("");
  const [status, setStatus] = useState("MAINTENANCE");
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const selected = rows.find((row) => String(row.id) === resourceId);
  const mutation = useMutation({
    mutationFn: () => adminOperationsApi.updateResourceStatus(resourceId, status, reason.trim()),
    onSuccess: async () => {
      toast.success("Parking resource status updated");
      setConfirmOpen(false);
      setReason("");
      await onChanged();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  if (rows.length === 0) return null;
  return <section className="space-y-3 border border-slate-200 bg-white p-4">
    <div><h2 className="text-sm font-bold">Resource status control</h2><p className="text-xs text-slate-500">Changing a resource away from active automatically suspends its active listings.</p></div>
    <div className="grid gap-2 lg:grid-cols-[1fr_180px_auto]">
      <select className="h-10 min-w-0 border bg-white px-3 text-sm" value={resourceId} onChange={(event) => setResourceId(event.target.value)}>
        <option value="">Select a resource from this page</option>
        {rows.map((row) => <option key={String(row.id)} value={String(row.id)}>{String(row.displayName ?? row.spotCode ?? row.id)} · {String(row.status)}</option>)}
      </select>
      <select className="h-10 border bg-white px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
        {['ACTIVE', 'BLOCKED', 'MAINTENANCE', 'INACTIVE'].map((value) => <option key={value} value={value}>{value}</option>)}
      </select>
      <Button disabled={!resourceId || selected?.status === status} onClick={() => setConfirmOpen(true)}>Review change</Button>
    </div>
    <Dialog open={confirmOpen} onOpenChange={(open) => { if (!mutation.isPending) setConfirmOpen(open); }}><DialogContent><DialogHeader><DialogTitle>Confirm resource status change</DialogTitle><DialogDescription>Change {String(selected?.displayName ?? selected?.spotCode ?? "this resource")} from {String(selected?.status ?? "its current state")} to {status}? This action is audited and may suspend listings.</DialogDescription></DialogHeader><Textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={500} placeholder="Operational reason (minimum 10 characters)" /><DialogFooter><Button variant="outline" disabled={mutation.isPending} onClick={() => setConfirmOpen(false)}>Cancel</Button><Button variant={status === "ACTIVE" ? "default" : "destructive"} disabled={mutation.isPending || reason.trim().length < 10} onClick={() => mutation.mutate()}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Confirm status</Button></DialogFooter></DialogContent></Dialog>
  </section>;
}

export function AdminListingReportControls({ rows, onChanged }: { rows: Row[]; onChanged: () => Promise<unknown> }) {
  const [reportId, setReportId] = useState("");
  const [decision, setDecision] = useState<"RESOLVED" | "DISMISSED">("RESOLVED");
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const openReports = rows.filter((row) => row.status === "OPEN");
  const selected = openReports.find((row) => String(row.id) === reportId);
  const listing = selected && typeof selected.listing === "object" && selected.listing ? selected.listing as Row : {};
  const mutation = useMutation({
    mutationFn: () => adminOperationsApi.resolveListingReport(reportId, decision, reason.trim()),
    onSuccess: async () => {
      toast.success(decision === "RESOLVED" ? "Listing report resolved" : "Listing report dismissed");
      setConfirmOpen(false);
      setReportId("");
      setReason("");
      await onChanged();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  if (openReports.length === 0) return null;
  return <section className="space-y-3 border border-slate-200 bg-white p-4">
    <div><h2 className="text-sm font-bold">Report review</h2><p className="text-xs text-slate-500">Close a reviewed report with a traceable reason. Listing suspension remains a separate moderation decision.</p></div>
    <div className="grid gap-2 lg:grid-cols-[1fr_180px_auto]">
      <select className="h-10 min-w-0 border bg-white px-3 text-sm" value={reportId} onChange={(event) => setReportId(event.target.value)}>
        <option value="">Select an open report from this page</option>
        {openReports.map((row) => <option key={String(row.id)} value={String(row.id)}>{String((row.listing as Row | undefined)?.title ?? row.id)} · {String(row.reason)}</option>)}
      </select>
      <select className="h-10 border bg-white px-3 text-sm" value={decision} onChange={(event) => setDecision(event.target.value as "RESOLVED" | "DISMISSED")}>
        <option value="RESOLVED">Resolved</option>
        <option value="DISMISSED">Dismissed</option>
      </select>
      <Button disabled={!reportId} onClick={() => setConfirmOpen(true)}>Review decision</Button>
    </div>
    <Dialog open={confirmOpen} onOpenChange={(open) => { if (!mutation.isPending) setConfirmOpen(open); }}><DialogContent><DialogHeader><DialogTitle>{decision === "RESOLVED" ? "Resolve listing report" : "Dismiss listing report"}</DialogTitle><DialogDescription>{decision === "RESOLVED" ? `Mark the report for “${String(listing.title ?? "this listing")}” as operationally resolved?` : `Dismiss the report for “${String(listing.title ?? "this listing")}” after review?`} This does not change the listing status.</DialogDescription></DialogHeader><Textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={500} placeholder="Review reason (minimum 10 characters)" /><DialogFooter><Button variant="outline" disabled={mutation.isPending} onClick={() => setConfirmOpen(false)}>Cancel</Button><Button variant={decision === "DISMISSED" ? "outline" : "default"} disabled={mutation.isPending || reason.trim().length < 10} onClick={() => mutation.mutate()}>{mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : decision === "RESOLVED" ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}Confirm {decision.toLowerCase()}</Button></DialogFooter></DialogContent></Dialog>
  </section>;
}

function CreateDialog({ section, open, onOpenChange, onChanged, copy }: { section: string; open: boolean; onOpenChange: (open: boolean) => void; onChanged: () => Promise<unknown>; copy: { title: string; description: string } }) {
  const mutation = useMutation({
    mutationFn: async (form: FormData) => {
      if (section === "content/legal") return adminOperationsApi.createLegalDraft({ type: form.get("type"), version: form.get("version"), title: form.get("title"), content: form.get("body"), effectiveAt: new Date(String(form.get("effectiveAt"))).toISOString() });
      if (section === "content/faq" || section === "content/help") return adminOperationsApi.createArticle({ kind: section.endsWith("faq") ? "FAQ" : "HELP_ARTICLE", title: form.get("title"), slug: form.get("slug"), body: form.get("body"), audience: form.get("audience"), sortOrder: 0 });
      if (section === "broadcasts") return adminOperationsApi.createCampaign({ title: String(form.get("title")), message: String(form.get("body")), audience: String(form.get("audience")) });
      const feeType = String(form.get("feeType"));
      return adminOperationsApi.createFeeRule({ scopeType: form.get("scopeType"), scopeId: form.get("scopeId") || null, feeType, percentageBps: feeType === "PERCENTAGE" ? Number(form.get("value")) : null, fixedAmountPaisa: feeType === "FIXED" ? Number(form.get("value")) : null, effectiveFrom: new Date(String(form.get("effectiveAt"))).toISOString(), effectiveUntil: null, reason: form.get("reason") });
    },
    onSuccess: async () => { toast.success("Draft or rule created"); onOpenChange(false); await onChanged(); },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); mutation.mutate(new FormData(event.currentTarget)); }
  const isLegal = section === "content/legal";
  const isArticle = section === "content/faq" || section === "content/help";
  const isBroadcast = section === "broadcasts";
  const isFee = section === "platform-fees";
  return <Dialog open={open} onOpenChange={(next) => { if (!mutation.isPending) onOpenChange(next); }}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>{copy.title}</DialogTitle><DialogDescription>{copy.description}</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-3">
    {isLegal && <select name="type" required className="h-10 w-full border bg-white px-3 text-sm"><option value="TERMS_OF_SERVICE">Terms of Service</option><option value="PRIVACY_POLICY">Privacy Policy</option><option value="OWNER_OPERATIONAL_POLICY">Provider operational policy</option><option value="GUARD_OPERATIONAL_POLICY">Guard operational policy</option></select>}
    {isLegal && <Input name="version" required minLength={1} maxLength={30} placeholder="Version, e.g. 2.0" />}
    {(isLegal || isArticle || isBroadcast) && <Input name="title" required minLength={3} maxLength={180} placeholder={isBroadcast ? "Campaign title" : "Title"} />}
    {isArticle && <Input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={200} placeholder="url-safe-slug" />}
    {(isArticle || isBroadcast) && <select name="audience" required className="h-10 w-full border bg-white px-3 text-sm"><option value="ALL">All active users</option><option value="DRIVER">Drivers</option><option value="PROVIDER">Providers</option><option value="MANAGER">Managers</option><option value="GUARD">Guards</option></select>}
    {(isLegal || isArticle || isBroadcast) && <Textarea name="body" required minLength={isBroadcast ? 5 : 20} maxLength={isBroadcast ? 500 : 100000} rows={8} placeholder={isBroadcast ? "Notification message" : "Markdown content"} />}
    {(isLegal || isFee) && <label className="block text-xs font-semibold text-slate-600">Effective date and time<Input name="effectiveAt" type="datetime-local" required className="mt-1" /></label>}
    {isFee && <><select name="scopeType" required className="h-10 w-full border bg-white px-3 text-sm"><option value="GLOBAL">Global</option><option value="PROVIDER">Provider</option><option value="PROPERTY">Property</option><option value="LISTING">Listing</option></select><Input name="scopeId" placeholder="Scope UUID (leave blank only for Global)" /><select name="feeType" required className="h-10 w-full border bg-white px-3 text-sm"><option value="PERCENTAGE">Percentage in basis points</option><option value="FIXED">Fixed amount in paisa</option></select><Input name="value" type="number" min={0} max={1000000000} required placeholder="500 basis points = 5%" /><Textarea name="reason" required minLength={10} maxLength={500} placeholder="Reason (minimum 10 characters)" /></>}
    <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancel</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}{isFee ? "Create rule" : "Create draft"}</Button></DialogFooter>
  </form></DialogContent></Dialog>;
}
