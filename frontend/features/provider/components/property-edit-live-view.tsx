"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, Save } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { propertyApi } from "@/lib/api/property-api";
import type { PropertyInput } from "@/lib/api/api-types";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { queryKeys } from "@/lib/query-keys";
import { PropertyLocationPicker } from "./property-location-picker";

type Values = PropertyInput & { entranceLatitude?: number; entranceLongitude?: number };

export function PropertyEditLiveView({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const client = useQueryClient();
  const [values, setValues] = useState<Values | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");
  const query = useQuery({ queryKey: queryKeys.properties.detail(propertyId), queryFn: () => propertyApi.detail(propertyId) });

  useEffect(() => {
    if (!query.data) return;

    const item = query.data;
    // The local editable draft is reset only when a fresh Property record is loaded.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues({ name: item.name, publicArea: item.publicArea, approximateAddress: item.approximateAddress, exactAddress: item.exactAddress, latitude: item.latitude, longitude: item.longitude, ...(item.entranceLatitude !== null ? { entranceLatitude: item.entranceLatitude } : {}), ...(item.entranceLongitude !== null ? { entranceLongitude: item.entranceLongitude } : {}), ...(item.accessInstructions ? { accessInstructions: item.accessInstructions } : {}), visitorIdentificationRequired: item.visitorIdentificationRequired, ...(item.vehicleHeightLimitCm ? { vehicleHeightLimitCm: item.vehicleHeightLimitCm } : {}), ...(item.entryCutoffLocalTime ? { entryCutoffLocalTime: item.entryCutoffLocalTime } : {}), ...(item.generalParkingRules ? { generalParkingRules: item.generalParkingRules } : {}), ...(item.commonSafetyRules ? { commonSafetyRules: item.commonSafetyRules } : {}) });
  }, [query.data]);

  const update = useMutation({
    mutationFn: () => propertyApi.update(propertyId, { ...values!, version: query.data!.version }),
    onSuccess: async (property) => {
      client.setQueryData(queryKeys.properties.detail(propertyId), property);
      await client.invalidateQueries({ queryKey: queryKeys.properties.root });
      setConfirming(false);
      setMessage(property.verificationStatus === "PENDING" ? "Property updated and returned to pending verification." : "Property updated successfully.");
    },
  });
  if (query.isError) return <div className="m-6 rounded-2xl border bg-white p-8 text-center"><p role="alert" className="text-red-700">{getApiErrorMessage(query.error)}</p><Button className="mt-4" variant="outline" onClick={() => query.refetch()}><RefreshCw className="size-4" />Retry</Button></div>;
  if (query.isPending || !values) return <div className="py-24 text-center" aria-busy="true"><Loader2 className="mx-auto size-7 animate-spin" /></div>;
  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((current) => current ? { ...current, [key]: value } : current);

  return <main className="mx-auto max-w-4xl space-y-6 p-6 sm:p-8">
    <div><h1 className="text-3xl font-extrabold">Edit Property</h1><p className="mt-2 text-sm text-muted-foreground">Update public details, operating rules, and the map location used for verification.</p></div>
    {message && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{message}</p>}
    <form onSubmit={(event) => { event.preventDefault(); setConfirming(true); }} className="grid gap-5 rounded-2xl border bg-white p-6 sm:grid-cols-2">
      <Field label="Property name" value={values.name} onChange={(value) => set("name", value)} />
      <Field label="Public area" value={values.publicArea} onChange={(value) => set("publicArea", value)} />
      <Field label="Approximate address" value={values.approximateAddress} onChange={(value) => set("approximateAddress", value)} />
      <Field label="Exact private address" value={values.exactAddress} onChange={(value) => set("exactAddress", value)} />
      <div className="space-y-2 sm:col-span-2"><Label>Property location</Label><PropertyLocationPicker latitude={values.latitude} longitude={values.longitude} onChange={(location) => setValues((current) => current ? { ...current, latitude: location.latitude, longitude: location.longitude, ...(location.approximateAddress ? { approximateAddress: location.approximateAddress } : {}), ...(location.publicArea ? { publicArea: location.publicArea } : {}) } : current)} /></div>
      <Field label="Vehicle height limit (cm)" type="number" value={String(values.vehicleHeightLimitCm ?? "")} onChange={(value) => set("vehicleHeightLimitCm", value ? Number(value) : undefined)} />
      <Field label="Entry cutoff" type="time" value={values.entryCutoffLocalTime ?? ""} onChange={(value) => set("entryCutoffLocalTime", value || undefined)} />
      <TextField label="Access instructions" value={values.accessInstructions ?? ""} onChange={(value) => set("accessInstructions", value || undefined)} />
      <TextField label="Parking rules" value={values.generalParkingRules ?? ""} onChange={(value) => set("generalParkingRules", value || undefined)} />
      <TextField label="Safety rules" value={values.commonSafetyRules ?? ""} onChange={(value) => set("commonSafetyRules", value || undefined)} />
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={values.visitorIdentificationRequired ?? false} onChange={(event) => set("visitorIdentificationRequired", event.target.checked)} />Visitor identification required</label>
      {update.isError && <p role="alert" className="text-sm font-semibold text-red-700 sm:col-span-2">{getApiErrorMessage(update.error)}</p>}
      <div className="flex flex-wrap justify-end gap-2 sm:col-span-2"><Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button><Button type="submit" className="bg-[#064E3B]" disabled={update.isPending}><Save className="size-4" />Save changes</Button></div>
    </form>
    <AlertDialog open={confirming} onOpenChange={(open) => { if (!open && !update.isPending) setConfirming(false); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Save Property changes?</AlertDialogTitle><AlertDialogDescription>This change may require Property verification again. Critical identity or location changes return a verified Property to pending and inactive.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Review changes</AlertDialogCancel><AlertDialogAction disabled={update.isPending} onClick={() => update.mutate()}>{update.isPending ? <Loader2 className="size-4 animate-spin" /> : "Save changes"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </main>;
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { const id = label.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-"); return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type={type} step={type === "number" ? "any" : undefined} required={!label.includes("height") && label !== "Entry cutoff"} value={value} onChange={(event) => onChange(event.target.value)} /></div>; }
function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { const id = label.toLowerCase().replaceAll(" ", "-"); return <div className="space-y-2 sm:col-span-2"><Label htmlFor={id}>{label}</Label><Textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} /></div>; }
