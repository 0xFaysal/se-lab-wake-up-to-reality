"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, MapPin, Plus, Search } from "lucide-react";
import {
  PageEmptyState,
  PageErrorState,
  PageSkeleton,
  ProviderPage,
  ProviderPageHeader,
} from "@/components/owner/provider-page";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { useProperties } from "@/hooks/use-properties";

export function OwnerPropertiesLiveView() {
  const { query } = useProperties();
  const [search, setSearch] = useState("");
  const properties = useMemo(
    () => (query.data ?? []).filter((item) =>
      `${item.name} ${item.publicArea} ${item.approximateAddress}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    ),
    [query.data, search],
  );

  return (
    <ProviderPage>
      <ProviderPageHeader
        title="My Properties"
        description="Manage verification, parking inventory, and operations for each Property."
        breadcrumbs={[{ label: "Properties" }]}
        actions={
          <Link href="/owner/properties/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-[#064E3B] px-4 text-sm font-semibold text-white">
            <Plus className="size-4" />Add Property
          </Link>
        }
      />
      {query.isPending ? (
        <PageSkeleton label="Loading Properties" />
      ) : query.isError ? (
        <PageErrorState message={getApiErrorMessage(query.error)} retry={() => void query.refetch()} />
      ) : (query.data?.length ?? 0) === 0 ? (
        <PageEmptyState
          title="Add your first Property"
          description="A Property is the verified location that contains your parking resources, staff, and listings."
          action={{ label: "Add Property", href: "/owner/properties/new" }}
        />
      ) : (
        <>
          <label className="relative block max-w-xl">
            <span className="sr-only">Search Properties</span>
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search Properties"
              className="h-11 w-full rounded-md border bg-white pl-10 pr-4 text-sm outline-none focus:border-emerald-700"
            />
          </label>
          {properties.length === 0 ? (
            <PageEmptyState title="No matching Properties" description="Try a different Property name, area, or address." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {properties.map((property) => (
                <Link key={property.id} href={`/owner/properties/${property.id}`} className="border bg-white p-5 transition hover:border-emerald-700">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-10 items-center justify-center bg-emerald-50 text-emerald-800"><Building2 className="size-5" /></span>
                    <div className="flex flex-wrap justify-end gap-1">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold">{property.status.replaceAll("_", " ")}</span>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${property.verificationStatus === "VERIFIED" ? "bg-emerald-100 text-emerald-800" : property.verificationStatus === "REJECTED" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"}`}>{property.verificationStatus}</span>
                    </div>
                  </div>
                  <h2 className="mt-4 font-bold text-slate-950">{property.name}</h2>
                  <p className="mt-2 flex gap-2 text-xs leading-5 text-slate-600"><MapPin className="mt-0.5 size-4 shrink-0" />{property.approximateAddress}</p>
                  {property.rejectionReason && <p className="mt-3 bg-red-50 p-2 text-xs text-red-700">{property.rejectionReason}</p>}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </ProviderPage>
  );
}
