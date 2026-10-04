"use client";

import { useEffect, useId, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit3, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listingsApi } from "@/lib/api/listings-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import type { ParkingListingDto } from "@/lib/api/marketplace-types";
import { listingRatePatch } from "@/lib/listing-rate";
import { paisaToBDTInput } from "@/lib/listing-payload";
import { queryKeys } from "@/lib/query-keys";
import { useUnsavedNavigation } from "@/hooks/use-unsaved-navigation";

export function ListingRateEditor({ listing, refresh, onDirtyChange }: {
  listing: ParkingListingDto;
  refresh: () => Promise<void>;
  onDirtyChange?: (id: string, dirty: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [rate, setRate] = useState("");
  const [error, setError] = useState("");
  const inputId = useId();
  const dirty = editing && rate !== paisaToBDTInput(listing.pricePerHourPaisa);
  const navigation = useUnsavedNavigation(!onDirtyChange && dirty);
  useEffect(() => {
    onDirtyChange?.(listing.id, dirty);
    return () => onDirtyChange?.(listing.id, false);
  }, [dirty, listing.id, onDirtyChange]);
  const client = useQueryClient();
  const save = useMutation({
    mutationFn: (patch: ReturnType<typeof listingRatePatch>) => listingsApi.update(listing.id, patch),
    onSuccess: async () => {
      setEditing(false);
      toast.success("Hourly rate saved");
      await client.invalidateQueries({ queryKey: queryKeys.parkingSearch.root });
      await refresh();
    },
    onError: (failure) => setError(getApiErrorMessage(failure)),
  });
  if (!["ACTIVE", "DRAFT", "PAUSED"].includes(listing.status)) return null;
  if (!editing) return <Button type="button" size="sm" variant="outline" onClick={() => {
    setRate(paisaToBDTInput(listing.pricePerHourPaisa));
    setError("");
    setEditing(true);
  }}><Edit3 className="size-4" />Edit rate</Button>;
  return <><form data-independent-rate className="w-full space-y-3 border-l-2 border-emerald-700 pl-4" noValidate onSubmit={(event) => {
    event.preventDefault();
    setError("");
    try { save.mutate(listingRatePatch(rate)); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Review the hourly rate."); }
  }}>
    <label className="block text-sm font-medium" htmlFor={inputId}>Hourly rate (BDT)</label>
    <div className="flex flex-wrap items-center gap-2">
      <Input id={inputId} className="w-full sm:w-40" inputMode="decimal" autoFocus value={rate} disabled={save.isPending} aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined} onChange={(event) => setRate(event.target.value)} />
      <Button type="submit" size="sm" disabled={save.isPending} aria-busy={save.isPending}>{save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Save rate</Button>
      <Button type="button" size="sm" variant="ghost" disabled={save.isPending} onClick={() => setEditing(false)}>Cancel</Button>
    </div>
    {error && <p id={`${inputId}-error`} role="alert" className="text-sm text-red-700">{error}</p>}
  </form>{navigation.guard}</>;
}
