"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronLeft, ChevronRight, FileText, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AdminEmptyState, AdminPageHeader, AdminStatus } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { parkingRightsApi } from "@/lib/api/parking-rights-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import type { AdminParkingRightDto, ParkingRightStatus } from "@/lib/api/marketplace-types";
import { formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";
import { DocumentViewerModal, type DocumentViewerTarget } from "@/components/common/document-viewer-modal";

type Decision = Exclude<ParkingRightStatus, "PENDING_VERIFICATION" | "EXPIRED">;
type Review = { right: AdminParkingRightDto; decision: Decision };

const statuses: ParkingRightStatus[] = [
  "PENDING_VERIFICATION",
  "VERIFIED",
  "DISPUTED",
  "REJECTED",
  "REVOKED",
  "EXPIRED",
];

function availableDecisions(status: ParkingRightStatus): Decision[] {
  if (status === "PENDING_VERIFICATION") return ["VERIFIED", "REJECTED", "DISPUTED"];
  if (status === "VERIFIED") return ["DISPUTED", "REVOKED"];
  if (status === "DISPUTED") return ["VERIFIED", "REJECTED", "REVOKED"];
  return [];
}

export default function RightsQueuePage() {
  const router = useRouter();
  const params = useSearchParams();
  const client = useQueryClient();
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const statusParam = params.get("status");
  const status = statuses.includes(statusParam as ParkingRightStatus) ? statusParam as ParkingRightStatus : undefined;
  const propertyId = params.get("propertyId") || undefined;
  const holderUserId = params.get("holderUserId") || undefined;
  const [review, setReview] = useState<Review | null>(null);
  const [reason, setReason] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<DocumentViewerTarget | null>(null);

  const filters = { page, limit: 20, status, propertyId, holderUserId };
  const query = useQuery({
    queryKey: queryKeys.adminMarketplace.rights(filters),
    queryFn: () => parkingRightsApi.adminList(filters),
  });
  const mutation = useMutation({
    mutationFn: () => parkingRightsApi.verify(review!.right.id, { decision: review!.decision, reason: reason.trim(), expectedVersion: review!.right.version }),
    onSuccess: async () => {
      toast.success("Parking right updated and audited");
      setReview(null);
      setReason("");
      await Promise.all([
        client.invalidateQueries({ queryKey: ["admin", "marketplace", "rights"] }),
        client.invalidateQueries({ queryKey: queryKeys.parkingRights.root }),
      ]);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  function update(values: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    Object.entries(values).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    router.replace(`/admin/marketplace/rights?${next.toString()}`);
  }

  function openReview(right: AdminParkingRightDto, decision: Decision) {
    setReview({ right, decision });
    setReason("");
  }

  function openDocument(document: AdminParkingRightDto["documents"][number]) {
    setSelectedDoc({
      id: document.id,
      originalName: document.originalName,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      category: document.category,
    });
  }

  return <div className="space-y-6">
    <AdminPageHeader
      eyebrow="Marketplace governance"
      title="Parking rights"
      description="Review entitlement claims, inspect their ownership scope and preserve a complete decision history."
    />

    <div className="grid gap-2 lg:grid-cols-3">
      <select className="h-10 border bg-white px-3 text-sm" value={status ?? ""} onChange={(event) => update({ status: event.target.value, page: "1" })}>
        <option value="">All right states</option>
        {statuses.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
      </select>
      <Input defaultValue={propertyId ?? ""} onBlur={(event) => update({ propertyId: event.target.value.trim(), page: "1" })} placeholder="Exact Property ID" />
      <Input defaultValue={holderUserId ?? ""} onBlur={(event) => update({ holderUserId: event.target.value.trim(), page: "1" })} placeholder="Exact holder user ID" />
    </div>

    {query.isPending ? <div className="h-64 animate-pulse bg-slate-200" /> : query.isError ? <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-800"><p>{getApiErrorMessage(query.error)}</p><Button className="mt-3" variant="outline" onClick={() => query.refetch()}>Retry</Button></div> : query.data.rights.length === 0 ? <AdminEmptyState title="No parking rights match these filters" description="Try another status or clear the exact ID filters." /> : <div className="divide-y divide-slate-100 border border-slate-200 bg-white">
      {query.data.rights.map((right) => {
        const decisions = availableDecisions(right.status);
        const validity = right.validUntil && new Date(right.validUntil) <= new Date() ? "Expired by date" : "Within validity window";
        return <article key={right.id} className="p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><AdminStatus value={right.status} /><span className="text-xs font-semibold text-slate-500">{right.rightType.replaceAll("_", " ")}</span></div>
              <h2 className="mt-2 font-bold text-slate-950">{right.parkingSpot.property.name}</h2>
              <p className="text-sm text-slate-600">{right.parkingSpot.property.publicArea} · {right.parkingSpot.displayName ?? right.parkingSpot.spotCode ?? right.parkingSpot.resourceType}</p>
              <p className="mt-2 text-xs text-slate-500">Holder: {right.holder.fullName} ({right.holder.email})</p>
              <p className="text-xs text-slate-500">Submitted {formatDateTime(right.createdAt)} · Quantity {right.quantity} of resource capacity {right.parkingSpot.capacity}</p>
            </div>
            <div className="grid min-w-[260px] grid-cols-2 gap-x-5 gap-y-2 text-xs">
              <Value label="Configured can list" value={right.canList ? "Yes" : "No"} />
              <Value label="Effective can list" value={right.status === "VERIFIED" && right.canList && (!right.validUntil || new Date(right.validUntil) > new Date()) ? "Yes" : "No"} />
              <Value label="Can set price" value={right.canSetPrice ? "Yes" : "No"} />
              <Value label="Manage bookings" value={right.canManageBookings ? "Yes" : "No"} />
              <Value label="Validity" value={validity} />
            </div>
          </div>
          {right.rejectionReason && <p className="mt-4 border-l-2 border-red-500 bg-red-50 px-3 py-2 text-xs text-red-800">Recorded reason: {right.rejectionReason}</p>}
          {right.documents.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {right.documents.map((document) => {
                const isPdf =
                  document.mimeType === "application/pdf" ||
                  document.originalName.toLowerCase().endsWith(".pdf");
                return (
                  <Button
                    key={document.id}
                    size="sm"
                    variant="outline"
                    className="gap-2 border-slate-200 bg-slate-50/80 text-slate-800 hover:bg-slate-100"
                    onClick={() => openDocument(document)}
                  >
                    <FileText
                      className={`size-4 ${
                        isPdf ? "text-rose-600" : "text-emerald-600"
                      }`}
                    />
                    <span className="max-w-[240px] truncate">
                      {document.originalName}
                    </span>
                  </Button>
                );
              })}
            </div>
          )}
          {decisions.length > 0 && <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            {decisions.map((decision) => <Button key={decision} size="sm" variant={decision === "VERIFIED" ? "default" : decision === "REVOKED" ? "destructive" : "outline"} onClick={() => openReview(right, decision)}>
              {decision === "VERIFIED" ? <ShieldCheck className="size-4" /> : <AlertTriangle className="size-4" />}{decision.replaceAll("_", " ")}
            </Button>)}
          </div>}
        </article>;
      })}
    </div>}

    {query.data && query.data.pagination.totalPages > 1 && <div className="flex flex-col items-start justify-between gap-3 text-xs text-slate-500 sm:flex-row sm:items-center"><span>{query.data.pagination.total.toLocaleString("en-BD")} parking rights</span><div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}><ChevronLeft className="size-4" />Previous</Button><span>Page {page} of {query.data.pagination.totalPages}</span><Button size="sm" variant="outline" disabled={page >= query.data.pagination.totalPages} onClick={() => update({ page: String(page + 1) })}>Next<ChevronRight className="size-4" /></Button></div></div>}

    <Dialog open={Boolean(review)} onOpenChange={(open) => { if (!open && !mutation.isPending) { setReview(null); setReason(""); } }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Confirm {review?.decision.toLowerCase().replaceAll("_", " ")}</DialogTitle><DialogDescription>This state change can affect active listings and commercial access. The reason is retained in the governance audit trail.</DialogDescription></DialogHeader>
        <Textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={5} maxLength={500} placeholder="Decision reason (minimum 5 characters)" />
        <DialogFooter><Button variant="outline" disabled={mutation.isPending} onClick={() => setReview(null)}>Cancel</Button><Button variant={review?.decision === "REVOKED" ? "destructive" : "default"} disabled={mutation.isPending || reason.trim().length < 5} onClick={() => mutation.mutate()}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Confirm decision</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    <DocumentViewerModal
      document={selectedDoc}
      isOpen={Boolean(selectedDoc)}
      onClose={() => setSelectedDoc(null)}
    />
  </div>;
}

function Value({ label, value }: { label: string; value: string }) {
  return <div><p className="font-bold uppercase text-slate-400">{label}</p><p className="mt-0.5 text-slate-700">{value}</p></div>;
}
