"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { driverDiscoveryApi } from "@/lib/api/driver-discovery-api";
import { queryKeys } from "@/lib/query-keys";

export default function DriverFavoritesPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.driverDiscovery.favorites, queryFn: driverDiscoveryApi.favorites });
  const remove = useMutation({ mutationFn: driverDiscoveryApi.removeFavorite, onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.driverDiscovery.favorites }) });
  return <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6"><header><h1 className="text-2xl font-extrabold">Favorite parking</h1><p className="mt-1 text-sm text-muted-foreground">Quickly return to verified properties you trust.</p></header>{query.isPending ? <p className="text-sm text-muted-foreground">Loading favorites...</p> : query.data?.length === 0 ? <div className="border bg-white p-10 text-center"><Heart className="mx-auto size-7 text-slate-400" /><h2 className="mt-3 font-bold">No favorites yet</h2><p className="mt-1 text-sm text-muted-foreground">Use the heart button in parking search to save a property.</p><Link href="/driver/parking"><Button className="mt-4">Find parking</Button></Link></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{query.data?.map(({ property }) => <article key={property.id} className="overflow-hidden border bg-white">{property.coverImageUrl && <div className="h-36 bg-slate-100 bg-cover bg-center" style={{ backgroundImage: `url(${property.coverImageUrl})` }} />}<div className="p-4"><h2 className="font-bold">{property.name}</h2><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{property.publicArea}</p><div className="mt-4 flex gap-2"><Link href={`/driver/parking?location=${encodeURIComponent(property.publicArea)}&latitude=${property.latitude}&longitude=${property.longitude}`} className="flex-1 rounded-md bg-emerald-800 px-3 py-2 text-center text-xs font-bold text-white">Check availability</Link><Button type="button" size="icon" variant="outline" onClick={() => remove.mutate(property.id)} aria-label="Remove favorite"><Trash2 className="size-4" /></Button></div></div></article>)}</div>}</div>;
}
