"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { adminMarketplaceApi } from "@/lib/api/admin-marketplace-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatBDTFromPaisa, formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export default function AdminListingsPage() {
  const query = useQuery({ queryKey: queryKeys.adminMarketplace.listings(), queryFn: () => adminMarketplaceApi.listings() });
  if (query.isPending) return <Loader2 className="size-6 animate-spin" />;
  if (query.isError) return <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{getApiErrorMessage(query.error)}</p>;
  return <div className="space-y-6"><div><h1 className="text-3xl font-extrabold">Marketplace listings</h1><p className="mt-1 text-sm text-slate-500">Review live and historical listing state across providers.</p></div><div className="divide-y overflow-hidden rounded-lg border bg-white">{query.data.listings.map((listing) => <Link key={listing.id} href={`/admin/marketplace/listings/${listing.id}`} className="flex items-start justify-between gap-4 p-4 hover:bg-slate-50"><div><strong>{listing.title}</strong><p className="mt-1 text-xs text-slate-500">{listing.parkingSpot.property.name} · {listing.provider.fullName} · {formatDateTime(listing.createdAt)}</p></div><div className="text-right"><strong>{formatBDTFromPaisa(listing.pricePerHourPaisa)}/hr</strong><p className="mt-1 text-xs font-bold">{listing.status}</p></div></Link>)}{query.data.listings.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No listings found.</p>}</div></div>;
}
