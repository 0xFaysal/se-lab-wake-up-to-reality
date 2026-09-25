"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminEmptyState, AdminPageHeader } from "@/components/admin/admin-page";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminMarketplaceApi } from "@/lib/api/admin-marketplace-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatBDTFromPaisa, formatDateTime } from "@/lib/formatters";
import { payoutStatus } from "@/lib/marketplace-status";
import { queryKeys } from "@/lib/query-keys";

type PayoutAction = "APPROVED" | "REJECTED" | "PAID" | "HOLD" | "RELEASE";
const statuses = ["REQUESTED", "PENDING", "ON_HOLD", "APPROVED", "REJECTED", "PAID", "CANCELLED"];

export default function PayoutQueuePage() {
  const router = useRouter();
  const params = useSearchParams();
  const client = useQueryClient();
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const statusFilter = params.get("status") || undefined;
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [references, setReferences] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] = useState<{ id: string; action: PayoutAction } | null>(null);
  const filters = { page, limit: 20, status: statusFilter };
  const query = useQuery({ queryKey: queryKeys.adminMarketplace.payouts(filters), queryFn: () => adminMarketplaceApi.payouts(filters) });
  const mutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: PayoutAction }) => {
      const note = notes[id] ?? "";
      if (action === "HOLD") return adminMarketplaceApi.holdPayout(id, note);
      if (action === "RELEASE") return adminMarketplaceApi.releasePayout(id, note);
      return adminMarketplaceApi.reviewPayout(id, { decision: action, note, ...(action === "PAID" ? { externalReference: references[id]?.trim() } : {}) });
    },
    onSuccess: async () => { toast.success("Payout updated"); setConfirmation(null); await client.invalidateQueries({ queryKey: ["admin", "marketplace", "payouts"] }); },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  function update(values: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    Object.entries(values).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    router.replace(`/admin/marketplace/payouts?${next.toString()}`);
  }

  return <div className="space-y-6">
    <AdminPageHeader eyebrow="Finance" title="Payout operations" description="Review Driver and Provider withdrawals, place risk holds, and record manual bank or MFS transfers." />
    <label className="block w-fit space-y-1 text-xs font-bold text-slate-600"><span>Status</span><select className="h-10 border bg-white px-3 text-sm font-normal" value={statusFilter ?? ""} onChange={(event) => update({ status: event.target.value, page: "1" })}><option value="">All states</option>{statuses.map((status) => <option key={status}>{status.replaceAll("_", " ")}</option>)}</select></label>
    {query.isPending ? <div className="h-64 animate-pulse bg-slate-200" /> : query.isError ? <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p>{getApiErrorMessage(query.error)}</p><Button className="mt-3" variant="outline" onClick={() => query.refetch()}>Retry</Button></div> : query.data.payouts.length === 0 ? <AdminEmptyState title="No payout requests need review" description="New Driver and Provider withdrawal requests will appear here." /> : <div className="divide-y border bg-white">{query.data.payouts.map((item) => {
      const status = payoutStatus[item.status];
      const reviewable = item.status === "REQUESTED" || item.status === "PENDING";
      return <article key={item.id} className="p-5">
        <div className="flex flex-wrap justify-between gap-3"><div><strong className="text-sm">{item.provider?.fullName ?? "Account holder"}</strong><p className="mt-1 text-xs text-slate-500">{item.provider?.email} · {formatDateTime(item.createdAt)}</p><p className="mt-2 text-xs font-semibold text-slate-700">{item.destinationSnapshot ? `${item.destinationSnapshot.type.replaceAll("_", " ")} · ${item.destinationSnapshot.maskedAccountIdentifier}` : "Legacy payout destination"}</p></div><div className="text-right"><strong>{formatBDTFromPaisa(item.amountPaisa)}</strong><span className={`ml-2 px-2 py-1 text-[10px] font-bold ${status.className}`}>{status.label}</span></div></div>
        {item.holdReason && <p className="mt-3 border-l-2 border-red-500 bg-red-50 px-3 py-2 text-xs text-red-800">Hold reason: {item.holdReason}</p>}
        {(reviewable || item.status === "ON_HOLD" || item.status === "APPROVED") && <Input className="mt-4" placeholder="Auditable admin note" value={notes[item.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} />}
        {item.status === "APPROVED" && <Input className="mt-2" placeholder="Bank or MFS transfer reference" value={references[item.id] ?? ""} onChange={(event) => setReferences((current) => ({ ...current, [item.id]: event.target.value }))} />}
        <div className="mt-3 flex flex-wrap gap-2">{reviewable && <><Button size="sm" disabled={(notes[item.id]?.trim().length ?? 0) < 3} onClick={() => setConfirmation({ id: item.id, action: "APPROVED" })}>Approve</Button><Button size="sm" variant="outline" disabled={(notes[item.id]?.trim().length ?? 0) < 10} onClick={() => setConfirmation({ id: item.id, action: "HOLD" })}>Hold</Button><Button size="sm" variant="destructive" disabled={(notes[item.id]?.trim().length ?? 0) < 3} onClick={() => setConfirmation({ id: item.id, action: "REJECTED" })}>Reject</Button></>}{item.status === "ON_HOLD" && <Button size="sm" disabled={(notes[item.id]?.trim().length ?? 0) < 10} onClick={() => setConfirmation({ id: item.id, action: "RELEASE" })}>Release hold</Button>}{item.status === "APPROVED" && <Button size="sm" disabled={(notes[item.id]?.trim().length ?? 0) < 3 || (references[item.id]?.trim().length ?? 0) < 3} onClick={() => setConfirmation({ id: item.id, action: "PAID" })}>Confirm transfer paid</Button>}</div>
      </article>;
    })}</div>}
    {query.data && query.data.pagination.totalPages > 1 && <div className="flex items-center justify-between text-xs text-slate-500"><span>{query.data.pagination.total.toLocaleString("en-BD")} payout requests</span><div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}><ChevronLeft className="size-4" />Previous</Button><span>Page {page} of {query.data.pagination.totalPages}</span><Button size="sm" variant="outline" disabled={page >= query.data.pagination.totalPages} onClick={() => update({ page: String(page + 1) })}>Next<ChevronRight className="size-4" /></Button></div></div>}
    <AlertDialog open={Boolean(confirmation)} onOpenChange={(open) => { if (!open && !mutation.isPending) setConfirmation(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirm payout action</AlertDialogTitle><AlertDialogDescription>This action changes reserved funds and is permanently audited. Confirm only after checking the destination and written note.</AlertDialogDescription></AlertDialogHeader><p className="border-l-2 border-amber-500 bg-amber-50 px-3 py-2 text-sm">{confirmation ? notes[confirmation.id] : ""}</p><AlertDialogFooter><AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel><AlertDialogAction variant={confirmation?.action === "REJECTED" ? "destructive" : "default"} disabled={mutation.isPending} onClick={() => confirmation && mutation.mutate(confirmation)}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Confirm {confirmation?.action.toLowerCase().replace("_", " ")}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
