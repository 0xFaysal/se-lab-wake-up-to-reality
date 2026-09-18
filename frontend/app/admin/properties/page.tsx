"use client";

import Link from "next/link";
import { type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { AdminEmptyState, AdminPageHeader, AdminStatus } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminOperationsApi } from "@/lib/api/admin-operations-api";
import { getApiErrorMessage } from "@/lib/api/api-error";

export default function AdminPropertiesPage() {
  const router = useRouter();
  const params = useSearchParams();
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const search = params.get("search") || undefined;
  const verificationStatus = params.get("verificationStatus") || undefined;
  const status = params.get("status") || undefined;
  const query = useQuery({ queryKey: ["admin", "properties", { page, search, verificationStatus, status }], queryFn: () => adminOperationsApi.properties({ page, limit: 20, search, verificationStatus, status }) });
  function update(values: Record<string, string>) { const next = new URLSearchParams(params.toString()); Object.entries(values).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key)); router.replace(`/admin/properties?${next.toString()}`); }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); update({ search: String(new FormData(event.currentTarget).get("search") ?? "").trim(), page: "1" }); }
  return <div className="space-y-6"><AdminPageHeader eyebrow="Operations" title="Properties" description="Verification, governance, operational status and risk oversight." action={<Link href="/admin/properties/pending"><Button variant="outline">Pending review queue</Button></Link>} />
    <form onSubmit={submit} className="grid gap-2 lg:grid-cols-[1fr_220px_220px_auto]"><div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-slate-400" /><Input name="search" defaultValue={search} className="pl-9" placeholder="Search name, area or address" /></div><select className="h-10 border bg-white px-3 text-sm" value={verificationStatus ?? ""} onChange={(event) => update({ verificationStatus: event.target.value, page: "1" })}><option value="">All verification states</option>{["DRAFT", "PENDING", "VERIFIED", "REJECTED", "SUSPENDED"].map((value) => <option key={value}>{value}</option>)}</select><select className="h-10 border bg-white px-3 text-sm" value={status ?? ""} onChange={(event) => update({ status: event.target.value, page: "1" })}><option value="">All operating states</option>{["ACTIVE", "TEMPORARILY_CLOSED", "INACTIVE"].map((value) => <option key={value}>{value}</option>)}</select><Button type="submit">Search</Button></form>
    {query.isPending ? <div className="h-64 animate-pulse bg-slate-200" /> : query.isError ? <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-800"><p>{getApiErrorMessage(query.error)}</p><Button className="mt-3" variant="outline" onClick={() => query.refetch()}>Retry</Button></div> : query.data.properties.length === 0 ? <AdminEmptyState title="No Properties match these filters" description="Try a broader verification or operating-state filter." /> : <div className="overflow-x-auto border border-slate-200 bg-white"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase text-slate-500"><tr><th className="px-4 py-3">Property</th><th className="px-4 py-3">Creator</th><th className="px-4 py-3">Providers</th><th className="px-4 py-3">Resources</th><th className="px-4 py-3">Verification</th><th className="px-4 py-3">Operations</th></tr></thead><tbody className="divide-y divide-slate-100">{query.data.properties.map((property) => <tr key={property.id} className="hover:bg-slate-50"><td className="px-4 py-3"><Link href={`/admin/properties/${property.id}`} className="font-bold text-emerald-800 hover:underline">{property.name}</Link><p className="text-xs text-slate-500">{property.publicArea} · {property.approximateAddress}</p></td><td className="px-4 py-3 text-xs">{property.createdBy.fullName}<br /><span className="text-slate-400">{property.createdBy.email}</span></td><td className="px-4 py-3">{property._count.providerMemberships}</td><td className="px-4 py-3">{property._count.parkingSpots}</td><td className="px-4 py-3"><AdminStatus value={property.verificationStatus} /></td><td className="px-4 py-3"><AdminStatus value={property.status} /></td></tr>)}</tbody></table></div>}
    {query.data && query.data.pagination.totalPages > 1 && <div className="flex items-center justify-between text-xs text-slate-500"><span>{query.data.pagination.total.toLocaleString("en-BD")} Properties</span><div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}><ChevronLeft className="size-4" />Previous</Button><span>Page {page} of {query.data.pagination.totalPages}</span><Button size="sm" variant="outline" disabled={page >= query.data.pagination.totalPages} onClick={() => update({ page: String(page + 1) })}>Next<ChevronRight className="size-4" /></Button></div></div>}
  </div>;
}
