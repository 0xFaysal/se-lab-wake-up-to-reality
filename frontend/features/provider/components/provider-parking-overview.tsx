"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, CircleParking, ListChecks, Plus } from "lucide-react";
import { ProviderPage, ProviderPageHeader, PageEmptyState, PageErrorState, PageSkeleton } from "@/components/provider/provider-page";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { listingsApi } from "@/lib/api/listings-api";
import { parkingResourcesApi } from "@/lib/api/parking-resources-api";
import { propertyApi } from "@/lib/api/property-api";
import { formatBDTFromPaisa } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

type Mode = "resources" | "listings" | "availability";

const copy: Record<Mode, { title: string; description: string }> = {
  resources: { title: "Parking resources", description: "Manage fixed parking spaces and shared parking pools inside your verified Properties." },
  listings: { title: "Listings", description: "Review pricing and marketplace status for your commercial parking offers." },
  availability: { title: "Availability", description: "Open a Property workspace to manage weekly schedules and date-specific exceptions." },
};

export function ProviderParkingOverview({ mode }: { mode: Mode }) {
  const properties = useQuery({ queryKey: queryKeys.properties.all(), queryFn: propertyApi.list });
  const listings = useQuery({ queryKey: queryKeys.listings.all(), queryFn: listingsApi.list, enabled: mode === "listings" });

  if (properties.isPending || (mode === "listings" && listings.isPending)) return <ProviderPage><PageSkeleton label={`Loading ${copy[mode].title.toLowerCase()}`} /></ProviderPage>;
  if (properties.isError || listings.isError) return <ProviderPage><PageErrorState message={getApiErrorMessage(properties.error ?? listings.error)} retry={() => { void properties.refetch(); if (mode === "listings") void listings.refetch(); }} /></ProviderPage>;

  const items = properties.data ?? [];
  return (
    <ProviderPage>
      <ProviderPageHeader
        title={copy[mode].title}
        description={copy[mode].description}
        breadcrumbs={[{ label: "Parking" }, { label: copy[mode].title }]}
        actions={<Link href="/provider/properties"><Button variant="outline">Property workspaces</Button></Link>}
      />

      {items.length === 0 ? (
        <PageEmptyState title="Add a Property first" description="Parking resources, rights, listings and availability are managed inside a Property." action={{ label: "Add your first Property", href: "/provider/properties/new" }} />
      ) : mode === "listings" ? (
        listings.data?.length ? <div className="divide-y overflow-hidden rounded-lg border bg-white">{listings.data.map((listing) => {
          const property = items.find((item) => item.id === listing.parkingSpot?.propertyId);
          return <Link key={listing.id} href={`/provider/properties/${listing.parkingSpot?.propertyId ?? property?.id ?? ""}`} className="grid gap-3 p-5 hover:bg-slate-50 sm:grid-cols-[1fr_auto]"><div><div className="flex flex-wrap items-center gap-2"><strong>{listing.title}</strong><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold">{listing.status}</span></div><p className="mt-1 text-sm text-slate-600">{property?.name ?? listing.parkingSpot?.displayName ?? "Parking resource"}</p><p className="mt-1 text-xs text-slate-500">{listing.allowedVehicleTypes.join(", ")} · {listing.minDurationMinutes}-{listing.maxDurationMinutes} minutes</p></div><strong className="text-sm">{formatBDTFromPaisa(listing.pricePerHourPaisa)}/hour</strong></Link>;
        })}</div> : <PageEmptyState title="No listings yet" description="Create a verified commercial parking right, then publish your first listing from its Property workspace." action={{ label: "View Properties", href: "/provider/properties" }} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">{items.map((property) => <PropertyParkingSummary key={property.id} property={property} mode={mode} />)}</div>
      )}
    </ProviderPage>
  );
}

function PropertyParkingSummary({ property, mode }: { property: Awaited<ReturnType<typeof propertyApi.list>>[number]; mode: Exclude<Mode, "listings"> }) {
  const resources = useQuery({ queryKey: queryKeys.parkingResources.byProperty(property.id), queryFn: () => parkingResourcesApi.list(property.id), enabled: property.verificationStatus === "VERIFIED" });
  const Icon = mode === "resources" ? CircleParking : CalendarClock;
  return <article className="rounded-lg border bg-white p-5"><div className="flex items-start justify-between gap-3"><span className="flex size-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-800"><Icon className="size-5" /></span><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold">{property.verificationStatus}</span></div><h2 className="mt-4 font-bold text-slate-950">{property.name}</h2><p className="mt-1 text-sm text-slate-600">{property.publicArea}</p>{property.verificationStatus !== "VERIFIED" ? <p className="mt-4 text-sm text-amber-700">Admin verification is required before parking operations can be configured.</p> : resources.isPending ? <p className="mt-4 text-sm text-slate-500">Loading resources...</p> : resources.isError ? <p className="mt-4 text-sm text-red-700">{getApiErrorMessage(resources.error)}</p> : <div className="mt-4 flex items-center gap-2 text-sm"><strong>{resources.data.length}</strong><span className="text-slate-500">{mode === "resources" ? "parking resources" : "resources available for scheduling"}</span></div>}<Link href={`/provider/properties/${property.id}#parking-workspace`} className="mt-5 inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-semibold hover:bg-slate-50">{mode === "resources" ? <><Plus className="size-4" />Manage resources</> : <><ListChecks className="size-4" />Manage availability</>}</Link></article>;
}
