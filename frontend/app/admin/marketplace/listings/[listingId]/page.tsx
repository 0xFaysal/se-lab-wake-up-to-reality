"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, PauseCircle, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { AdminStatus } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { adminMarketplaceApi } from "@/lib/api/admin-marketplace-api";
import { ApiError, getApiErrorMessage } from "@/lib/api/api-error";
import { formatBDTFromPaisa, formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

type ModerationAction = "suspend" | "resume";

export default function AdminListingDetailPage({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = use(params);
  const client = useQueryClient();
  const [action, setAction] = useState<ModerationAction | null>(null);
  const [reason, setReason] = useState("");
  const [eligibilityReasons, setEligibilityReasons] = useState<string[]>([]);
  const query = useQuery({
    queryKey: queryKeys.adminMarketplace.listing(listingId),
    queryFn: () => adminMarketplaceApi.listing(listingId),
  });
  const moderation = useMutation({
    mutationFn: () => action === "resume"
      ? adminMarketplaceApi.resumeListing(listingId, reason)
      : adminMarketplaceApi.suspendListing(listingId, reason),
    onSuccess: async () => {
      toast.success(action === "resume" ? "Listing resumed" : "Listing suspended");
      setAction(null);
      setReason("");
      setEligibilityReasons([]);
      await Promise.all([
        query.refetch(),
        client.invalidateQueries({ queryKey: ["admin", "marketplace", "listings"] }),
      ]);
    },
    onError: (error) => {
      const details = error instanceof ApiError && error.details && typeof error.details === "object"
        ? error.details as { reasons?: string[] }
        : undefined;
      setEligibilityReasons(details?.reasons ?? []);
      toast.error(getApiErrorMessage(error));
    },
  });

  if (query.isPending) return <div className="h-64 animate-pulse bg-slate-200" />;
  if (query.isError) return <p role="alert" className="border border-red-200 bg-red-50 p-4 text-red-700">{getApiErrorMessage(query.error)}</p>;
  const listing = query.data;
  const mayModerate = listing.status !== "ENDED";

  return <div className="max-w-5xl space-y-6">
    <Link href="/admin/marketplace/listings" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft className="size-4" />Listings</Link>
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div><p className="text-xs font-bold uppercase text-emerald-700">Operations / Listing</p><h1 className="mt-1 text-3xl font-extrabold">{listing.title}</h1><p className="mt-1 text-sm text-slate-500">Created {formatDateTime(listing.createdAt)}</p></div>
      <div className="flex items-center gap-2"><AdminStatus value={listing.status} />{mayModerate && (listing.status === "SUSPENDED" ? <Button variant="outline" onClick={() => setAction("resume")}><PlayCircle className="size-4" />Resume</Button> : <Button variant="destructive" onClick={() => setAction("suspend")}><PauseCircle className="size-4" />Suspend</Button>)}</div>
    </header>
    <section className="grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
      <Info label="Provider" value={`${listing.provider.fullName} (${listing.provider.email})`} />
      <Info label="Property" value={`${listing.parkingSpot.property.name}, ${listing.parkingSpot.property.publicArea}`} />
      <Info label="Resource" value={listing.parkingSpot.displayName ?? listing.parkingSpot.spotCode ?? listing.parkingSpot.resourceType} />
      <Info label="Scope" value={listing.parkingResourceUnit ? `Unit ${listing.parkingResourceUnit.spotCode}` : "Entire resource"} />
      <Info label="Price" value={`${formatBDTFromPaisa(listing.pricePerHourPaisa)}/hour`} />
      <Info label="Right status" value={listing.parkingRight.status} />
      <Info label="Membership" value={`${listing.providerMembership.status} / ${listing.providerMembership.verificationStatus}`} />
    </section>
    <section className="border border-slate-200 bg-white p-5"><h2 className="text-sm font-bold">Price history</h2>{listing.priceHistory.length ? <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-3 py-2">Changed</th><th className="px-3 py-2">Previous</th><th className="px-3 py-2">New price</th><th className="px-3 py-2">Changed by</th></tr></thead><tbody className="divide-y">{listing.priceHistory.map((entry) => <tr key={entry.id}><td className="px-3 py-2">{formatDateTime(entry.createdAt)}</td><td className="px-3 py-2">{entry.previousPricePaisa === null ? "Initial price" : formatBDTFromPaisa(entry.previousPricePaisa)}</td><td className="px-3 py-2 font-semibold">{formatBDTFromPaisa(entry.pricePerHourPaisa)}</td><td className="px-3 py-2">{entry.changedBy.fullName}</td></tr>)}</tbody></table></div> : <p className="mt-2 text-sm text-slate-500">No price changes recorded.</p>}</section>
    <section className="border border-slate-200 bg-white p-5"><h2 className="text-sm font-bold">Moderation safety</h2><p className="mt-2 text-sm text-slate-600">Resume is accepted only when the Property, resource, Provider membership and parking right still satisfy backend eligibility rules. Every action is audited.</p></section>
    {eligibilityReasons.length > 0 && <section className="border border-amber-300 bg-amber-50 p-5"><h2 className="text-sm font-bold text-amber-950">Listing cannot be resumed</h2><ul className="mt-3 space-y-2 text-sm text-amber-900">{eligibilityReasons.map((item) => <li key={item}>{eligibilityMessage(item, listing.parkingRight.id)}</li>)}</ul>{eligibilityReasons.some((item) => item.startsWith("RIGHT_")) && <Link href={`/admin/marketplace/rights?holderUserId=${listing.provider.id}`} className="mt-4 inline-flex text-sm font-bold text-emerald-800">View Parking Right</Link>}</section>}
    <Dialog open={Boolean(action)} onOpenChange={(open) => { if (!open && !moderation.isPending) { setAction(null); setReason(""); } }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{action === "resume" ? "Resume listing" : "Suspend listing"}</DialogTitle><DialogDescription>Enter a clear operational reason. The Provider will be notified and the action will appear in the audit trail.</DialogDescription></DialogHeader>
        <Textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={5} maxLength={500} placeholder="Reason (minimum 5 characters)" />
        <DialogFooter><Button variant="outline" onClick={() => setAction(null)} disabled={moderation.isPending}>Cancel</Button><Button variant={action === "suspend" ? "destructive" : "default"} disabled={moderation.isPending || reason.trim().length < 5} onClick={() => moderation.mutate()}>{moderation.isPending && <Loader2 className="size-4 animate-spin" />}Confirm {action}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}

function eligibilityMessage(reason: string, _rightId: string) {
  const messages: Record<string, string> = {
    RIGHT_REVOKED: "Listing cannot be resumed because its Parking Right is revoked.",
    RIGHT_NOT_VERIFIED: "The Parking Right is not verified.",
    RIGHT_CANNOT_LIST: "The Parking Right does not grant effective commercial listing permission.",
    RIGHT_NOT_YET_VALID: "The Parking Right is not valid yet.",
    RIGHT_EXPIRED: "The Parking Right has expired.",
    PROPERTY_INACTIVE: "The Property is inactive.",
    PROPERTY_UNVERIFIED: "The Property is not verified.",
    RESOURCE_INACTIVE: "The parking resource is inactive.",
    RESOURCE_UNIT_INACTIVE: "The listing's fixed parking unit is inactive.",
    PROVIDER_SUSPENDED: "The Provider account is not active.",
    PROVIDER_MEMBERSHIP_INACTIVE: "The Provider membership is inactive or unverified.",
    AVAILABILITY_MISSING: "Current weekly availability has not been configured.",
  };
  return messages[reason] ?? reason.replaceAll("_", " ").toLowerCase();
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 bg-white p-4"><p className="text-[11px] font-bold uppercase text-slate-400">{label}</p><p className="mt-1 break-words text-sm text-slate-800">{value}</p></div>;
}
