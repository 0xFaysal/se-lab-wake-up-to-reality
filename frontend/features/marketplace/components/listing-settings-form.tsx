"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { ParkingListingDto } from "@/lib/api/marketplace-types";
import type { VehicleType } from "@/lib/api/api-types";
import { listingsApi } from "@/lib/api/listings-api";
import { listingPayload, paisaToBDTInput } from "@/lib/listing-payload";
import { listingRatePatch } from "@/lib/listing-rate";
import { ApiError, getApiErrorMessage } from "@/lib/api/api-error";
import { useUnsavedNavigation } from "@/hooks/use-unsaved-navigation";

const names: Record<VehicleType, string> = { SEDAN: "Sedan", SUV: "SUV", MOTORCYCLE: "Motorcycle", MICROBUS: "Microbus" };

export function ListingSettingsForm({ listing, supported, close, refresh }: {
  listing: ParkingListingDto; supported: VehicleType[]; close: () => void; refresh: () => Promise<void>;
}) {
  const [vehicles, setVehicles] = useState(listing.allowedVehicleTypes);
  const [mode, setMode] = useState(listing.overtimeBillingMode);
  const [separate, setSeparate] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [expectedUpdatedAt] = useState(listing.updatedAt);
  const navigation = useUnsavedNavigation(dirty);
  const save = useMutation({
    mutationFn: (data: FormData) => {
      const { overtimeGracePeriodMinutes: _grace, ...settings } = listingPayload(data, mode, vehicles);
      // Editing unrelated terms must not migrate a legacy grace policy.
      void _grace;
      const consent = { discloseLocationBeforePayment: data.get("discloseLocationBeforePayment") === "on" };
      return separate ? listingsApi.updateVehicleRates(listing.id, {
        expectedUpdatedAt, settings: { ...settings, ...consent },
        rates: vehicles.map((vehicleType) => ({ vehicleType, ...listingRatePatch(String(data.get(`rate-${vehicleType}`) ?? "")) })),
      }) : listingsApi.update(listing.id, { ...settings, ...consent, expectedUpdatedAt });
    },
    onSuccess: async () => { setDirty(false); toast.success("Booking settings saved"); close(); await refresh(); },
    onError: (failure) => setError(failure instanceof ApiError ? getApiErrorMessage(failure) : failure instanceof Error ? failure.message : getApiErrorMessage(failure)),
  });
  function markDirty() { setDirty(true); }
  const field = (label: string, input: React.ReactNode) => <label className="space-y-1.5 text-sm"><span className="block font-medium">{label}</span>{input}</label>;
  return <><form className="space-y-5 border-t pt-4" noValidate onChangeCapture={markDirty} onSubmit={(event) => { event.preventDefault(); setError(""); save.mutate(new FormData(event.currentTarget)); }}>
    <fieldset disabled={save.isPending} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {field("Offer name", <Input name="title" defaultValue={listing.title} />)}
        {field("Refundable deposit (BDT)", <Input name="deposit" inputMode="decimal" defaultValue={paisaToBDTInput(listing.securityDepositPaisa)} />)}
        {field("Minimum stay (minutes)", <Input name="minimum" type="number" defaultValue={listing.minDurationMinutes} />)}
        {field("Maximum stay (minutes)", <Input name="maximum" type="number" defaultValue={listing.maxDurationMinutes} />)}
      </div>
      {field("Description", <Textarea name="description" defaultValue={listing.description ?? ""} maxLength={3000} />)}
      <div><p className="mb-3 text-sm font-medium">Accepted vehicles</p><div className="flex flex-wrap gap-4">{supported.map((type) => <label key={type} className="flex items-center gap-2 text-sm"><Checkbox checked={vehicles.includes(type)} onCheckedChange={(checked) => { markDirty(); setVehicles((current) => checked ? [...current, type] : current.filter((value) => value !== type)); }} />{names[type]}</label>)}</div></div>
      <label className="flex items-center gap-2 text-sm"><Checkbox checked={separate} onCheckedChange={(checked) => { markDirty(); setSeparate(Boolean(checked)); }} />Separate hourly rate for each vehicle</label>
      <div className="grid gap-4 sm:grid-cols-2">
        {separate ? <><input type="hidden" name="hourlyRate" value={paisaToBDTInput(listing.pricePerHourPaisa)} />{vehicles.map((type) => <div key={type}>{field(`${names[type]} (BDT/hour)`, <Input name={`rate-${type}`} inputMode="decimal" defaultValue={paisaToBDTInput(listing.pricePerHourPaisa)} />)}</div>)}</> : field("Hourly rate (BDT)", <Input name="hourlyRate" inputMode="decimal" defaultValue={paisaToBDTInput(listing.pricePerHourPaisa)} />)}
        {field("Overtime pricing", <select className="h-10 w-full rounded-md border bg-white px-3" value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}><option value="MULTIPLIER">Hourly rate multiplier</option><option value="FIXED_PER_HOUR">Fixed hourly overtime rate</option></select>)}
        {mode === "MULTIPLIER" ? field("Overtime multiplier", <Input key="multiplier" name="overtimeMultiplier" inputMode="decimal" defaultValue={(listing.overtimeMultiplierBps ?? 15000) / 10000} />) : field("Overtime rate (BDT/hour)", <Input key="fixed" name="overtimeRate" inputMode="decimal" defaultValue={paisaToBDTInput(listing.overtimeRatePerHourPaisa ?? "0")} />)}
      </div>
      <input type="hidden" name="overtimeGrace" value="5" />
      <label className="flex items-start gap-3 border-t pt-4 text-sm"><Checkbox name="discloseLocationBeforePayment" defaultChecked={listing.discloseLocationBeforePayment ?? false} /><span>Allow verified Drivers to see the actual parking location before booking.<span className="mt-1 block text-xs text-slate-500">Public visitors still see an approximate area. Private access instructions and entry credentials stay restricted to confirmed bookings.</span></span></label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-2"><Button type="submit" disabled={!vehicles.length} aria-busy={save.isPending}>{save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Save booking settings</Button><Button type="button" variant="ghost" onClick={() => navigation.confirmLeave(close)}>Cancel</Button></div>
    </fieldset>
  </form>{navigation.guard}</>;
}
