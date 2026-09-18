"use client";

import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MapPin, RefreshCw, Search, Warehouse } from "lucide-react";
import { MobileEmptyState } from "@/components/driver/mobile-empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { driverDiscoveryApi } from "@/lib/api/driver-discovery-api";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

function FavoritesSkeleton() {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading favorite parking">{Array.from({ length: 3 }, (_, index) => <div key={index} className="animate-pulse overflow-hidden rounded-md border bg-white"><div className="aspect-[16/9] bg-slate-200" /><div className="space-y-3 p-4"><div className="h-5 w-2/3 rounded bg-slate-200" /><div className="h-4 w-1/2 rounded bg-slate-100" /><div className="h-10 rounded bg-slate-100" /></div></div>)}</div>;
}

export default function DriverFavoritesPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.driverDiscovery.favorites, queryFn: driverDiscoveryApi.favorites });
  const remove = useMutation({ mutationFn: driverDiscoveryApi.removeFavorite, onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.driverDiscovery.favorites }) });

  return <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-6 sm:py-7">
    <header><h1 className="text-2xl font-extrabold text-slate-950">Favorite parking</h1><p className="mt-1 text-sm leading-6 text-slate-600">Your saved, verified parking properties in one place.</p></header>
    {query.isPending ? <FavoritesSkeleton /> : query.isError ? <div className="rounded-md border border-rose-200 bg-white p-6 text-center"><p className="text-sm font-semibold text-rose-700">{getApiErrorMessage(query.error)}</p><Button type="button" variant="outline" className="mt-4" onClick={() => query.refetch()}><RefreshCw className="size-4" />Try again</Button></div> : query.data.length === 0 ? <MobileEmptyState icon={Heart} title="No favorite parking yet" description="Save places from parking search and they will stay within easy reach here." primaryAction={{ label: "Search parking", href: "/driver/parking", icon: Search }} /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {query.data.map(({ property }) => {
        const params = new URLSearchParams({ location: property.publicArea, latitude: String(property.latitude), longitude: String(property.longitude) });
        return <article key={property.id} className="group overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md">
          <div className="relative aspect-[16/9] bg-slate-100">{property.coverImageUrl ? <Image src={property.coverImageUrl} alt={property.name} fill unoptimized sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" /> : <div className="grid h-full place-items-center bg-slate-100 text-slate-400"><Warehouse className="size-9" /></div>}<button type="button" disabled={remove.isPending && remove.variables === property.id} onClick={() => remove.mutate(property.id)} aria-label={`Remove ${property.name} from favorites`} className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-white/95 text-rose-600 shadow-sm backdrop-blur"><Heart className="size-5 fill-current" /></button></div>
          <div className="p-4"><h2 className="truncate text-base font-extrabold text-slate-950">{property.name}</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600"><MapPin className="size-4 shrink-0 text-emerald-700" /><span className="truncate">{property.publicArea}</span></p><p className="mt-2 line-clamp-1 text-xs text-slate-500">{property.approximateAddress}</p><Link href={`/driver/parking?${params}`} className={cn(buttonVariants({ size: "sm" }), "mt-4 w-full bg-emerald-800 hover:bg-emerald-900")}>Check live availability</Link></div>
        </article>;
      })}
    </div>}
  </div>;
}
