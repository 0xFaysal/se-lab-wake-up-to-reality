"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminMarketplaceApi } from "@/lib/api/admin-marketplace-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatBDTFromPaisa, formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export default function AdminListingDetailPage({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = use(params); const client = useQueryClient(); const [reason, setReason] = useState("");
  const query = useQuery({ queryKey: queryKeys.adminMarketplace.listing(listingId), queryFn: () => adminMarketplaceApi.listing(listingId) });
  const suspend = useMutation({ mutationFn: () => adminMarketplaceApi.suspendListing(listingId, reason), onSuccess: async () => { toast.success("Listing suspended"); await client.invalidateQueries({ queryKey: ["admin", "marketplace", "listings"] }); }, onError: (error) => toast.error(getApiErrorMessage(error)) });
  if (query.isPending) return <Loader2 className="size-6 animate-spin" />;
  if (query.isError) return <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{getApiErrorMessage(query.error)}</p>;
  const listing = query.data;
  return <div className="max-w-3xl space-y-5"><Link href="/admin/marketplace/listings" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft className="size-4" />Listings</Link><div><h1 className="text-3xl font-extrabold">{listing.title}</h1><p className="mt-1 text-sm text-slate-500">{listing.status} · created {formatDateTime(listing.createdAt)}</p></div><section className="grid gap-4 rounded-lg border bg-white p-6 sm:grid-cols-2"><Info label="Provider" value={`${listing.provider.fullName} (${listing.provider.email})`} /><Info label="Property" value={`${listing.parkingSpot.property.name}, ${listing.parkingSpot.property.publicArea}`} /><Info label="Resource" value={listing.parkingSpot.displayName ?? listing.parkingSpot.spotCode ?? listing.parkingSpot.resourceType} /><Info label="Price" value={`${formatBDTFromPaisa(listing.pricePerHourPaisa)}/hour`} /><Info label="Right status" value={listing.parkingRight.status} /><Info label="Membership" value={`${listing.providerMembership.status} / ${listing.providerMembership.verificationStatus}`} /></section>{listing.status !== "ENDED" && listing.status !== "SUSPENDED" && <section className="rounded-lg border bg-white p-5"><h2 className="font-bold">Suspend listing</h2><Input className="mt-3" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Auditable reason (minimum 5 characters)" maxLength={500} /><Button className="mt-3" variant="destructive" disabled={reason.trim().length < 5 || suspend.isPending} onClick={() => suspend.mutate()}>{suspend.isPending && <Loader2 className="size-4 animate-spin" />}Suspend</Button></section>}</div>;
}

function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-1 text-sm text-slate-800">{value}</p></div>; }
