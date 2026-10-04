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
import type { PropertyDetailDto, PropertyInput } from "@/lib/api/api-types";
import { buildPropertyUpdate, propertyEditValues, propertyUpdateErrors } from "@/lib/property-edit";
import { getApiErrorMessage, getApiValidationErrors } from "@/lib/api/api-error";
import { queryKeys } from "@/lib/query-keys";
import { PropertyLocationPicker } from "./property-location-picker";

type Values = PropertyInput & { entranceLatitude?: number; entranceLongitude?: number };

export function PropertyEditLiveView({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const client = useQueryClient();
  const [draft, setDraft] = useState<{ original: PropertyDetailDto; values: Values } | null>(null);
  const values = draft?.values ?? null;
  const setValues = (update: (current: Values | null) => Values | null) => setDraft((current) => {
    if (!current) return current;
    const values = update(current.values);
    return values ? { ...current, values } : current;
  });
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const query = useQuery({ queryKey: queryKeys.properties.detail(propertyId), queryFn: () => propertyApi.detail(propertyId) });

  useEffect(() => {
    if (!query.data) return;

    const item = query.data;
    // Keep the original version and unsaved edits across background refreshes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft((current) => current?.original.id === item.id ? current : { original: item, values: propertyEditValues(item) });
  }, [query.data]);

  const update = useMutation({
    mutationFn: () => propertyApi.update(propertyId, buildPropertyUpdate(draft!.original, draft!.values)),
    onSuccess: (property) => {
      setFieldErrors({});
      client.setQueryData(queryKeys.properties.detail(propertyId), property);
      setDraft({ original: property, values: propertyEditValues(property) });
      setConfirming(false);
      setMessage(property.verificationStatus === "PENDING" ? "Property updated and returned to pending verification." : "Property updated successfully.");
      // A refresh failure must not turn a completed save into a failed mutation.
      void client.invalidateQueries({ queryKey: queryKeys.properties.root }).catch(() => undefined);
    },
    onError: (error) => {
      setFieldErrors(getApiValidationErrors(error));
      setConfirming(false);
    },
  });
  if (query.isError && !query.data) return <div className="m-6 rounded-2xl border bg-white p-8 text-center"><p role="alert" className="text-red-700">{getApiErrorMessage(query.error)}</p><Button className="mt-4" variant="outline" onClick={() => query.refetch()}><RefreshCw className="size-4" />Retry</Button></div>;
  if (query.isPending || !values || draft?.original.id !== propertyId) return <div className="py-24 text-center" aria-busy="true"><Loader2 className="mx-auto size-7 animate-spin" /></div>;
  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((current) => current ? { ...current, [key]: value } : current);
    setFieldErrors((current) => { const next = { ...current }; delete next[key]; return next; });
    update.reset();
    setMessage("");
  };
  const hasChanges = draft && Object.keys(buildPropertyUpdate(draft.original, values)).length > 1;

  return <main className="mx-auto max-w-4xl space-y-6 p-6 sm:p-8">
    <div><h1 className="text-3xl font-extrabold">Edit Property</h1><p className="mt-2 text-sm text-muted-foreground">Update public details, operating rules, and the map location used for verification.</p></div>
    {message && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{message}</p>}
    {query.isError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-amber-500 bg-amber-50 p-4 text-sm"><p>The latest property details could not be refreshed. Your draft is preserved.</p><Button type="button" variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw className="size-4" />Retry refresh</Button></div>}
    <form noValidate onSubmit={(event) => {
      event.preventDefault();
      if (!hasChanges || update.isPending) return;
      const errors = propertyUpdateErrors(buildPropertyUpdate(draft!.original, values));
      setFieldErrors(errors);
      if (Object.keys(errors).length) {
        event.currentTarget.querySelector<HTMLElement>(`[name="${Object.keys(errors)[0]}"]`)?.focus();
        return;
      }
      setConfirming(true);
    }} className="grid gap-5 rounded-2xl border bg-white p-6 sm:grid-cols-2">
      <fieldset disabled={update.isPending} className="contents">
      <Field name="name" error={fieldErrors.name} label="Property name" minLength={3} maxLength={120} value={values.name} onChange={(value) => set("name", value)} />
      <Field name="publicArea" error={fieldErrors.publicArea} label="Public area" minLength={2} maxLength={120} value={values.publicArea} onChange={(value) => set("publicArea", value)} />
      <Field name="approximateAddress" error={fieldErrors.approximateAddress} label="Approximate address" minLength={5} maxLength={255} value={values.approximateAddress} onChange={(value) => set("approximateAddress", value)} />
      <Field name="exactAddress" error={fieldErrors.exactAddress} label="Exact private address" minLength={5} maxLength={500} value={values.exactAddress} onChange={(value) => set("exactAddress", value)} />
      <div className="space-y-2 sm:col-span-2"><Label>Property location</Label><PropertyLocationPicker latitude={values.latitude} longitude={values.longitude} onChange={(location) => setValues((current) => current ? { ...current, latitude: location.latitude, longitude: location.longitude, ...(location.approximateAddress ? { approximateAddress: location.approximateAddress } : {}), ...(location.publicArea ? { publicArea: location.publicArea } : {}) } : current)} /></div>
      <Field name="vehicleHeightLimitCm" error={fieldErrors.vehicleHeightLimitCm} label="Vehicle height limit (cm)" type="number" value={String(values.vehicleHeightLimitCm ?? "")} onChange={(value) => set("vehicleHeightLimitCm", value ? Number(value) : undefined)} />
      <Field name="entryCutoffLocalTime" error={fieldErrors.entryCutoffLocalTime} label="Entry cutoff" type="time" value={values.entryCutoffLocalTime ?? ""} onChange={(value) => set("entryCutoffLocalTime", value || undefined)} />
      <TextField name="accessInstructions" error={fieldErrors.accessInstructions} maxLength={1000} label="Access instructions" value={values.accessInstructions ?? ""} onChange={(value) => set("accessInstructions", value || undefined)} />
      <TextField name="generalParkingRules" error={fieldErrors.generalParkingRules} maxLength={2000} label="Parking rules" value={values.generalParkingRules ?? ""} onChange={(value) => set("generalParkingRules", value || undefined)} />
      <TextField name="commonSafetyRules" error={fieldErrors.commonSafetyRules} maxLength={2000} label="Safety rules" value={values.commonSafetyRules ?? ""} onChange={(value) => set("commonSafetyRules", value || undefined)} />
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={values.visitorIdentificationRequired ?? false} onChange={(event) => set("visitorIdentificationRequired", event.target.checked)} />Visitor identification required</label>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={values.isSharedBuilding ?? false} onChange={(event) => set("isSharedBuilding", event.target.checked)} />This Property is part of a shared building</label>
      {update.isError && <p role="alert" className="text-sm font-semibold text-red-700 sm:col-span-2">{getApiErrorMessage(update.error)}</p>}
      <div className="flex flex-wrap justify-end gap-2 sm:col-span-2"><Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button><Button type="submit" className="bg-[#064E3B]" disabled={update.isPending || !hasChanges}><Save className="size-4" />Save changes</Button></div>
      </fieldset>
    </form>
    <AlertDialog open={confirming} onOpenChange={(open) => { if (!open && !update.isPending) setConfirming(false); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Save Property changes?</AlertDialogTitle><AlertDialogDescription>This change may require Property verification again. Critical identity or location changes return a verified Property to pending and inactive.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Review changes</AlertDialogCancel><AlertDialogAction disabled={update.isPending} onClick={() => update.mutate()}>{update.isPending ? <Loader2 className="size-4 animate-spin" /> : "Save changes"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </main>;
}

function Field({ name, error, label, value, onChange, type = "text", minLength, maxLength }: { name: string; error?: string; label: string; value: string; onChange: (value: string) => void; type?: string; minLength?: number; maxLength?: number }) {
  const id = label.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} name={name} type={type} step={type === "number" ? 1 : undefined} min={type === "number" ? 1 : undefined} max={type === "number" ? 1000 : undefined} minLength={minLength} maxLength={maxLength} required={!label.includes("height") && label !== "Entry cutoff"} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} value={value} onChange={(event) => onChange(event.target.value)} />{error && <p id={`${id}-error`} role="alert" className="text-sm text-red-700">{error}</p>}</div>;
}
function TextField({ name, error, maxLength, label, value, onChange }: { name: string; error?: string; maxLength: number; label: string; value: string; onChange: (value: string) => void }) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return <div className="space-y-2 sm:col-span-2"><Label htmlFor={id}>{label}</Label><Textarea id={id} name={name} maxLength={maxLength} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} value={value} onChange={(event) => onChange(event.target.value)} />{error && <p id={`${id}-error`} role="alert" className="text-sm text-red-700">{error}</p>}</div>;
}
