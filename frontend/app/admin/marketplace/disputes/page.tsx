"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronLeft, ChevronRight, Clock3, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminEmptyState, AdminPageHeader } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { adminMarketplaceApi } from "@/lib/api/admin-marketplace-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { disputeStatus } from "@/lib/marketplace-status";
import { queryKeys } from "@/lib/query-keys";

type Decision = "RESOLVED" | "REJECTED";

export default function DisputeQueuePage() {
  const router = useRouter();
  const params = useSearchParams();
  const client = useQueryClient();
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const statusFilter = params.get("status") || undefined;
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [slaHours, setSlaHours] = useState<24 | 48>(48);
  const [escalate, setEscalate] = useState(false);
  const [resolutions, setResolutions] = useState<Record<string, string>>({});
  const filters = { page, limit: 20, status: statusFilter };
  const query = useQuery({ queryKey: queryKeys.adminMarketplace.disputes(filters), queryFn: () => adminMarketplaceApi.disputes(filters) });
  const beginReview = useMutation({
    mutationFn: () => adminMarketplaceApi.beginDisputeReview(reviewId!, { reason, slaHours, escalate }),
    onSuccess: async () => { toast.success("Dispute review started"); setReviewId(null); setReason(""); setEscalate(false); setSlaHours(48); await client.invalidateQueries({ queryKey: ["admin", "marketplace", "disputes"] }); },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  const resolve = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: Decision }) => adminMarketplaceApi.resolveDispute(id, { decision, resolution: resolutions[id] ?? "" }),
    onSuccess: async () => { toast.success("Dispute decision saved"); await client.invalidateQueries({ queryKey: ["admin", "marketplace", "disputes"] }); },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  function update(values: Record<string, string>) { const next = new URLSearchParams(params.toString()); Object.entries(values).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key)); router.replace(`/admin/marketplace/disputes?${next.toString()}`); }

  return <div className="space-y-6">
    <AdminPageHeader eyebrow="Trust & Safety" title="Dispute center" description="Case review, internal SLA tracking, evidence context and controlled resolution." />
    <select className="h-10 border bg-white px-3 text-sm" value={statusFilter ?? ""} onChange={(event) => update({ status: event.target.value, page: "1" })}><option value="">All cases</option>{["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"].map((status) => <option key={status}>{status}</option>)}</select>
    {query.isPending ? <div className="h-64 animate-pulse bg-slate-200" /> : query.isError ? <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p>{getApiErrorMessage(query.error)}</p><Button className="mt-3" variant="outline" onClick={() => query.refetch()}>Retry</Button></div> : query.data.disputes.length === 0 ? <AdminEmptyState title="No disputes match this queue" description="New cases and cases in the selected state will appear here." /> : <div className="space-y-4">{query.data.disputes.map((item) => {
      const style = disputeStatus[item.status];
      const dueAt = item.slaDueAt ? new Date(item.slaDueAt) : null;
      const overdue = dueAt ? dueAt < new Date() && item.status === "UNDER_REVIEW" : false;
      return <article key={item.id} className="border border-slate-200 bg-white p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row"><div><p className="text-xs font-bold uppercase text-slate-400">{item.category.replaceAll("_", " ")}</p><h2 className="mt-1 font-bold">Booking {item.booking?.bookingCode}</h2><p className="mt-1 text-xs text-slate-500">Opened by {item.openedBy?.fullName} · Case {item.id}</p></div><div className="flex items-start gap-2"><span className={`px-2 py-1 text-[10px] font-bold ${style.className}`}>{style.label}</span>{item.escalatedAt && <span className="inline-flex items-center gap-1 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700"><AlertTriangle className="size-3" />ESCALATED</span>}</div></div><p className="mt-4 text-sm leading-6 text-slate-700">{item.description}</p>{dueAt && <p className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold ${overdue ? "text-red-700" : "text-slate-500"}`}><Clock3 className="size-3.5" />Internal review target: {dueAt.toLocaleString("en-BD")}{overdue ? " (overdue)" : ""}</p>}{item.status === "OPEN" && <div className="mt-4"><Button size="sm" onClick={() => setReviewId(item.id)}>Begin review</Button></div>}{item.status === "UNDER_REVIEW" && <div className="mt-4 border-t border-slate-100 pt-4"><Textarea minLength={10} placeholder="Mandatory resolution note" value={resolutions[item.id] ?? ""} onChange={(event) => setResolutions((current) => ({ ...current, [item.id]: event.target.value }))} /><p className="mt-2 text-xs text-slate-500">Any financial remedy must be processed from the booking refund workflow before resolving this case.</p><div className="mt-3 flex gap-2"><Button size="sm" disabled={(resolutions[item.id]?.trim().length ?? 0) < 10 || resolve.isPending} onClick={() => resolve.mutate({ id: item.id, decision: "RESOLVED" })}>Resolve</Button><Button size="sm" variant="outline" disabled={(resolutions[item.id]?.trim().length ?? 0) < 10 || resolve.isPending} onClick={() => resolve.mutate({ id: item.id, decision: "REJECTED" })}>Reject claim</Button></div></div>}</article>;
    })}</div>}
    {query.data && query.data.pagination.totalPages > 1 && <div className="flex items-center justify-between text-xs text-slate-500"><span>{query.data.pagination.total.toLocaleString("en-BD")} disputes</span><div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}><ChevronLeft className="size-4" />Previous</Button><span>Page {page} of {query.data.pagination.totalPages}</span><Button size="sm" variant="outline" disabled={page >= query.data.pagination.totalPages} onClick={() => update({ page: String(page + 1) })}>Next<ChevronRight className="size-4" /></Button></div></div>}
    <Dialog open={Boolean(reviewId)} onOpenChange={(open) => { if (!open && !beginReview.isPending) setReviewId(null); }}><DialogContent><DialogHeader><DialogTitle>Begin dispute review</DialogTitle><DialogDescription>The target is an internal operations goal, not a legal service guarantee. Your reason is saved as a private Admin note.</DialogDescription></DialogHeader><Textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={500} placeholder="Investigation note (minimum 10 characters)" /><div className="grid grid-cols-2 gap-2"><Button type="button" variant={slaHours === 24 ? "default" : "outline"} onClick={() => setSlaHours(24)}>24 hours</Button><Button type="button" variant={slaHours === 48 ? "default" : "outline"} onClick={() => setSlaHours(48)}>48 hours</Button></div><label className="flex items-center gap-3 text-sm"><Checkbox checked={escalate} onCheckedChange={(checked) => setEscalate(checked === true)} />Escalate for priority review</label><DialogFooter><Button variant="outline" onClick={() => setReviewId(null)} disabled={beginReview.isPending}>Cancel</Button><Button disabled={reason.trim().length < 10 || beginReview.isPending} onClick={() => beginReview.mutate()}>{beginReview.isPending && <Loader2 className="size-4 animate-spin" />}Start review</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
