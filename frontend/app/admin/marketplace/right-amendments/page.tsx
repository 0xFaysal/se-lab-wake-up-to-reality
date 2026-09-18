"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GitCompare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminEmptyState, AdminPageHeader, AdminStatus } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { parkingRightsApi } from "@/lib/api/parking-rights-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import type { ParkingRightAmendmentDto, ParkingRightAmendmentStatus, ParkingRightDto } from "@/lib/api/marketplace-types";
import { formatDateTime } from "@/lib/formatters";

type AdminAmendment = ParkingRightAmendmentDto & { requestedBy: { id: string; fullName: string; email: string }; parkingRight: ParkingRightDto & { parkingSpot: NonNullable<ParkingRightDto["parkingSpot"]> & { property: { id: string; name: string; publicArea: string } } } };
type Review = { amendment: AdminAmendment; decision: "APPROVED" | "REJECTED" };

export default function AdminRightAmendmentsPage() {
  const client = useQueryClient();
  const [status, setStatus] = useState<ParkingRightAmendmentStatus | "">("PENDING");
  const [review, setReview] = useState<Review | null>(null);
  const [reason, setReason] = useState("");
  const query = useQuery({ queryKey: ["admin", "marketplace", "right-amendments", status], queryFn: () => parkingRightsApi.adminAmendments({ page: 1, limit: 100, ...(status ? { status } : {}) }) });
  const mutation = useMutation({
    mutationFn: () => parkingRightsApi.reviewAmendment(review!.amendment.id, { decision: review!.decision, expectedRightVersion: review!.amendment.parkingRight.version, ...(reason.trim() ? { reason: reason.trim() } : {}) }),
    onSuccess: async () => { toast.success(`Change request ${review!.decision.toLowerCase()}`); setReview(null); setReason(""); await Promise.all([query.refetch(), client.invalidateQueries({ queryKey: ["admin", "marketplace", "rights"] })]); },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  return <div className="space-y-6"><AdminPageHeader eyebrow="Marketplace governance" title="Parking Right changes" description="Compare requested changes against the currently verified Right. The original authority remains active until an amendment is approved." />
    <select className="h-10 border bg-white px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value as ParkingRightAmendmentStatus | "")}><option value="">All states</option>{["PENDING", "APPROVED", "REJECTED", "CANCELLED"].map((value) => <option key={value} value={value}>{value}</option>)}</select>
    {query.isPending ? <div className="h-64 animate-pulse bg-slate-200" /> : query.isError ? <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-800">{getApiErrorMessage(query.error)}</div> : query.data.amendments.length === 0 ? <AdminEmptyState title="No Parking Right changes need review" description="Provider amendment requests will appear here without changing the currently verified Right." /> : <div className="divide-y border border-slate-200 bg-white">{query.data.amendments.map((amendment) => <AmendmentRow key={amendment.id} amendment={amendment as AdminAmendment} review={(decision) => { setReview({ amendment: amendment as AdminAmendment, decision }); setReason(""); }} />)}</div>}
    <Dialog open={Boolean(review)} onOpenChange={(open) => { if (!open && !mutation.isPending) setReview(null); }}><DialogContent><DialogHeader><DialogTitle>{review?.decision === "APPROVED" ? "Approve Parking Right changes" : "Reject Parking Right changes"}</DialogTitle><DialogDescription>Approval applies the displayed field changes transactionally and increments the Right version. A stale base version is rejected.</DialogDescription></DialogHeader><Textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={5} maxLength={500} placeholder={review?.decision === "REJECTED" ? "Rejection reason (required)" : "Admin note (optional)"} /><DialogFooter><Button variant="outline" disabled={mutation.isPending} onClick={() => setReview(null)}>Cancel</Button><Button variant={review?.decision === "REJECTED" ? "destructive" : "default"} disabled={mutation.isPending || (review?.decision === "REJECTED" && reason.trim().length < 5)} onClick={() => mutation.mutate()}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Confirm</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function AmendmentRow({ amendment, review }: { amendment: AdminAmendment; review: (decision: "APPROVED" | "REJECTED") => void }) {
  const current = amendment.parkingRight as unknown as Record<string, unknown>;
  return <article className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><GitCompare className="size-4 text-emerald-700" /><AdminStatus value={amendment.status} /></div><h2 className="mt-2 font-bold">{amendment.parkingRight.parkingSpot.property.name} · {amendment.parkingRight.parkingSpot.displayName ?? amendment.parkingRight.parkingSpot.spotCode}</h2><p className="text-xs text-slate-500">Requested by {amendment.requestedBy.fullName} · Base Right v{amendment.baseRightVersion} · {formatDateTime(amendment.createdAt)}</p></div>{amendment.status === "PENDING" && <div className="flex gap-2"><Button size="sm" onClick={() => review("APPROVED")}>Approve</Button><Button size="sm" variant="destructive" onClick={() => review("REJECTED")}>Reject</Button></div>}</div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-xs"><thead className="bg-slate-50"><tr><th className="px-3 py-2">Field</th><th className="px-3 py-2">Current</th><th className="px-3 py-2">Proposed</th></tr></thead><tbody className="divide-y">{Object.entries(amendment.proposedChanges).map(([field, proposed]) => <tr key={field}><td className="px-3 py-2 font-semibold">{field.replaceAll(/([A-Z])/g, " $1")}</td><td className="px-3 py-2 text-slate-500">{display(current[field])}</td><td className="px-3 py-2 font-semibold text-emerald-800">{display(proposed)}</td></tr>)}</tbody></table></div>{amendment.reason && <p className="mt-3 border-l-2 border-slate-300 px-3 text-xs text-slate-600">Decision note: {amendment.reason}</p>}</article>;
}

function display(value: unknown) { if (value === null) return "No expiry"; if (typeof value === "boolean") return value ? "Yes" : "No"; if (typeof value === "string" && !Number.isNaN(Date.parse(value)) && value.includes("T")) return formatDateTime(value); return String(value ?? "—"); }
