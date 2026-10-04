"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ProviderPage, ProviderPageHeader, PageErrorState, PageSkeleton, PageEmptyState } from "@/components/provider/provider-page";
import { propertyApi } from "@/lib/api/property-api";
import { queryKeys } from "@/lib/query-keys";
import { getApiErrorMessage } from "@/lib/api/api-error";
export default function OwnerApprovalsPage() {
  const query=useQuery({queryKey:queryKeys.properties.all(),queryFn:propertyApi.list});
  const pending=query.data?.filter(p=>p.verificationStatus!=="VERIFIED") ?? [];
  return <ProviderPage><ProviderPageHeader title="Approvals" description="Property verification and parking authority requests. Approval decisions remain with the administrator." breadcrumbs={[{label:"Updates & support"},{label:"Approvals"}]} />{query.isPending ? <PageSkeleton label="Loading verification status" /> : query.isError ? <PageErrorState message={getApiErrorMessage(query.error)} retry={()=>void query.refetch()} /> : pending.length===0 ? <PageEmptyState title="Properties verified" description="Review parking rights and amendments in each property's workspace." action={{label:"View properties",href:"/provider/properties"}} /> : <div className="divide-y border-y bg-white">{pending.map(p=><Link key={p.id} href={`/provider/properties/${p.id}`} className="flex flex-wrap items-center justify-between gap-3 p-5 hover:bg-slate-50"><div><strong>{p.name}</strong><p className="mt-1 text-sm text-slate-500">{p.rejectionReason ?? p.publicArea}</p></div><span className="rounded-md bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-950">{p.verificationStatus.replaceAll("_"," ")}</span></Link>)}</div>}<Link href="/provider/parking" className="inline-flex min-h-10 items-center text-sm font-semibold text-emerald-800">Review parking rights</Link></ProviderPage>;
}
