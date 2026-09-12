"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, Building2, Loader2, RefreshCw } from "lucide-react";
import { adminApi } from "@/lib/api/admin-api";
import { queryKeys } from "@/lib/query-keys";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { Button } from "@/components/ui/button";

export default function PendingPropertiesPage() {
  const [page, setPage] = useState(1); const filters = { page, limit: 20 };
  const query = useQuery({ queryKey: queryKeys.adminProperties.pending(filters), queryFn: () => adminApi.pendingProperties(page, 20) });
  return <div className="space-y-6"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-700">Verification queue</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">Pending properties</h1><p className="mt-2 text-sm text-muted-foreground">Review provider-submitted property identity, private access information and supporting images.</p></div>
    {query.isPending && <State icon={<Loader2 className="size-6 animate-spin" />} title="Loading verification queue" />}
    {query.isError && <State icon={<AlertCircle className="size-6" />} title={getApiErrorMessage(query.error)} action={<Button variant="outline" onClick={() => query.refetch()}><RefreshCw className="size-4" />Retry</Button>} />}
    {query.data?.properties.length === 0 && <State icon={<Building2 className="size-6" />} title="No properties are waiting for review" />}
    {!!query.data?.properties.length && <><div className="overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="divide-y">{query.data.properties.map((property) => <Link key={property.id} href={`/admin/properties/${property.id}`} className="flex items-center justify-between gap-4 p-5 transition hover:bg-slate-50"><div><div className="flex items-center gap-2"><h2 className="font-bold">{property.name}</h2><span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">PENDING</span></div><p className="mt-1 text-sm text-muted-foreground">{property.approximateAddress}</p><p className="mt-1 text-xs text-muted-foreground">Submitted by {property.creator.fullName} · {property.imageCount} image(s)</p></div><ArrowRight className="size-5 text-slate-400" /></Link>)}</div></div><div className="flex items-center justify-between"><Button variant="outline" disabled={page <= 1 || query.isFetching} onClick={() => setPage((value) => value - 1)}>Previous</Button><span className="text-xs text-muted-foreground">Page {query.data.pagination.page} of {Math.max(1, query.data.pagination.totalPages)}</span><Button variant="outline" disabled={page >= query.data.pagination.totalPages || query.isFetching} onClick={() => setPage((value) => value + 1)}>Next</Button></div></>}
  </div>;
}

function State({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) { return <div className="rounded-2xl border bg-white p-10 text-center"><div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">{icon}</div><p className="mt-3 text-sm font-semibold">{title}</p>{action && <div className="mt-4">{action}</div>}</div>; }
