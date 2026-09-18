"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { managerApi } from "@/lib/api/manager-api";
import { parkingResourcesApi } from "@/lib/api/parking-resources-api";
import { queryKeys } from "@/lib/query-keys";

export default function ManagerPropertyPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const delegations = useQuery({
    queryKey: queryKeys.managerDelegations.manager,
    queryFn: managerApi.listForManager,
  });
  const delegation = delegations.data?.find(
    (item) => item.property.id === propertyId && item.status === "ACTIVE",
  );
  const canViewResources = delegation?.permissions.includes("RESOURCE_VIEW") ?? false;
  const resources = useQuery({
    queryKey: queryKeys.parkingResources.byProperty(propertyId),
    queryFn: () => parkingResourcesApi.list(propertyId),
    enabled: Boolean(delegation && canViewResources),
  });

  if (delegations.isPending) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-[#064E3B]" /></div>;
  }

  if (!delegation) {
    return <div className="space-y-4"><h1 className="text-2xl font-extrabold">Property access unavailable</h1><p className="text-sm text-slate-600">No active delegation grants access to this Property.</p><Link href="/manager/properties"><Button variant="outline">Back to delegated Properties</Button></Link></div>;
  }

  const wholeProperty = delegation.resourceIds.length === 0;
  return (
    <div className="space-y-6">
      <Link href="/manager/properties" className="inline-flex items-center gap-2 text-sm font-semibold text-[#064E3B]"><ArrowLeft className="size-4" />Delegated Properties</Link>
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-700"><ShieldCheck className="size-4" />Active delegated scope</div>
        <h1 className="mt-2 text-3xl font-extrabold">{delegation.property.name}</h1>
        <p className="mt-1 text-sm text-slate-500">{delegation.property.publicArea} · Provider {delegation.provider?.fullName ?? "account"}</p>
      </div>
      <section className="border-y bg-white py-5">
        <h2 className="text-lg font-bold">Granted permissions</h2>
        <div className="mt-3 flex flex-wrap gap-2">{delegation.permissions.map((permission) => <span key={permission} className="rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold">{permission.replaceAll("_", " ")}</span>)}</div>
        <p className="mt-3 text-xs text-slate-500">Scope: {wholeProperty ? "Whole Property, including current and future resources" : `${delegation.resourceIds.length} selected parking resource(s)`}</p>
      </section>
      <section>
        <div className="flex items-center gap-2"><Building2 className="size-5 text-[#064E3B]" /><h2 className="text-xl font-bold">Parking resources</h2></div>
        {!canViewResources ? <p className="mt-3 text-sm text-slate-600">This delegation does not include permission to view parking resources.</p> : resources.isPending ? <Loader2 className="mt-4 size-5 animate-spin" /> : resources.isError ? <p className="mt-3 text-sm text-red-700">Parking resources could not be loaded for this scope.</p> : <div className="mt-4 grid gap-3 sm:grid-cols-2">{resources.data?.map((resource) => <article key={resource.id} className="rounded-lg border bg-white p-4"><strong>{resource.displayName || resource.spotCode || "Parking resource"}</strong><p className="mt-1 text-xs text-slate-500">{resource.resourceType.replaceAll("_", " ")} · Capacity {resource.capacity} · {resource.status}</p></article>)}{resources.data?.length === 0 && <p className="text-sm text-slate-500">No parking resources are available in this delegated scope.</p>}</div>}
      </section>
    </div>
  );
}
