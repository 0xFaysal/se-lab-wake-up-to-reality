"use client";

import { type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import { AdminEmptyState, AdminPageHeader, AdminStatus } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminMarketplaceApi } from "@/lib/api/admin-marketplace-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatBDTFromPaisa, formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

const STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "SUSPENDED", "ENDED"] as const;

export default function AdminListingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const search = searchParams.get("search")?.trim() || undefined;
  const status = searchParams.get("status") || undefined;
  const filters = { page, limit: 20, search, status };
  const query = useQuery({
    queryKey: queryKeys.adminMarketplace.listings(filters),
    queryFn: () => adminMarketplaceApi.listings(filters),
  });

  function updateUrl(values: { page?: number; search?: string; status?: string }) {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(values).forEach(([key, value]) => {
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, String(value));
    });
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateUrl({ page: 1, search: String(form.get("search") ?? "").trim() });
  }

  const pagination = query.data?.pagination;
  return <div className="space-y-6">
    <AdminPageHeader
      eyebrow="Operations"
      title="Marketplace listings"
      description="Inspect live and historical listing state across Providers, Properties and parking resources."
      action={<Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw className={`size-4 ${query.isFetching ? "animate-spin" : ""}`} />Refresh</Button>}
    />
    <section className="grid gap-2 border border-slate-200 bg-white p-4 md:grid-cols-[minmax(0,1fr)_220px]">
      <form onSubmit={submitSearch} className="flex min-w-0 gap-2">
        <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" /><Input name="search" defaultValue={search} className="pl-9" placeholder="Listing, Provider, email, Property or spot code" /></div>
        <Button type="submit">Search</Button>
      </form>
      <select aria-label="Listing status" className="h-10 border bg-white px-3 text-sm" value={status ?? ""} onChange={(event) => updateUrl({ page: 1, status: event.target.value })}>
        <option value="">All listing statuses</option>
        {STATUSES.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
      </select>
    </section>

    {query.isPending ? <div className="h-64 animate-pulse bg-slate-200" /> : query.isError ? <div role="alert" className="border border-red-200 bg-red-50 p-5 text-sm text-red-800"><strong className="block">Unable to load listings</strong><span>{getApiErrorMessage(query.error)}</span><Button variant="outline" size="sm" className="mt-3" onClick={() => query.refetch()}>Retry</Button></div> : query.data.listings.length === 0 ? <AdminEmptyState title="No listings match these filters" description="Try a different status or search term. New Provider listings will appear here." /> : <>
      <div className="overflow-x-auto border border-slate-200 bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase text-slate-500"><tr><th className="px-4 py-3">Listing</th><th className="px-4 py-3">Property / Resource</th><th className="px-4 py-3">Provider</th><th className="px-4 py-3">Rate</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Status</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{query.data.listings.map((listing) => <tr key={listing.id} className="hover:bg-slate-50">
            <td className="px-4 py-3"><Link href={`/admin/marketplace/listings/${listing.id}`} className="font-bold text-emerald-800 hover:underline">{listing.title}</Link><p className="mt-1 font-mono text-[10px] text-slate-400">{listing.id}</p></td>
            <td className="px-4 py-3"><strong className="block text-xs">{listing.parkingSpot.property.name}</strong><span className="text-xs text-slate-500">{listing.parkingSpot.displayName ?? listing.parkingSpot.spotCode ?? listing.parkingSpot.resourceType}</span></td>
            <td className="px-4 py-3"><span className="block text-xs font-semibold">{listing.provider.fullName}</span><span className="text-xs text-slate-500">{listing.provider.email}</span></td>
            <td className="px-4 py-3 text-xs font-semibold">{formatBDTFromPaisa(listing.pricePerHourPaisa)}/hr</td>
            <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(listing.createdAt)}</td>
            <td className="px-4 py-3"><AdminStatus value={listing.status} /></td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="flex flex-col justify-between gap-3 text-xs text-slate-500 sm:flex-row sm:items-center">
        <span>{pagination?.total.toLocaleString("en-BD")} listings · Page {pagination?.page} of {pagination?.totalPages || 1}</span>
        <div className="flex gap-2"><Button variant="outline" size="sm" disabled={!pagination || pagination.page <= 1} onClick={() => updateUrl({ page: page - 1 })}><ChevronLeft className="size-4" />Previous</Button><Button variant="outline" size="sm" disabled={!pagination || pagination.page >= pagination.totalPages} onClick={() => updateUrl({ page: page + 1 })}>Next<ChevronRight className="size-4" /></Button></div>
      </div>
    </>}
  </div>;
}
