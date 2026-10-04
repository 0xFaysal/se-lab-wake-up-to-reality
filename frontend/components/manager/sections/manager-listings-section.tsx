"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  DollarSign,
  Edit2,
  Loader2,
  PauseCircle,
  PlayCircle,
  Plus,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listingsApi } from "@/lib/api/listings-api";
import { parkingRightsApi } from "@/lib/api/parking-rights-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { queryKeys } from "@/lib/query-keys";
import { parseBDTToPaisa } from "@/lib/payout-amount";
import { listingOvertimeSettings } from "@/lib/listing-overtime";
import { listingDetailsError, listingDetailsPatch } from "@/lib/listing-details";
import { listingPayload } from "@/lib/listing-payload";
import { listingsInPropertyScope, managerListingControls } from "@/lib/manager-listing-scope";
import type { ParkingListingDto, OvertimeBillingMode } from "@/lib/api/marketplace-types";
import type { VehicleType } from "@/lib/api/api-types";

const VEHICLE_OPTIONS: VehicleType[] = [
  "SEDAN",
  "SUV",
  "MICROBUS",
  "MOTORCYCLE",
];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  PAUSED: "bg-amber-100 text-amber-800",
  DRAFT: "bg-slate-100 text-slate-600",
  SUSPENDED: "bg-red-100 text-red-700",
  ENDED: "bg-slate-100 text-slate-400",
};

function paisaToTaka(paisa: string | number): string {
  const value = BigInt(paisa);
  return `${value / BigInt(100)}.${(value % BigInt(100)).toString().padStart(2, "0")}`;
}

function takaToPaisa(taka: string | number): string {
  const paisa = parseBDTToPaisa(String(taka));
  if (paisa === null || paisa <= BigInt(0)) throw new Error("Enter a positive BDT rate with no more than two decimal places.");
  return paisa.toString();
}

// ---------------------------------------------------------
// Edit Price & Overtime Form (Satisfies Prompt Section 14 & 15)
// ---------------------------------------------------------
function EditPriceForm({
  listing,
  onClose,
}: {
  listing: ParkingListingDto;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [hourlyTaka, setHourlyTaka] = useState(paisaToTaka(listing.pricePerHourPaisa));
  const [mode, setMode] = useState<OvertimeBillingMode>(
    listing.overtimeBillingMode ?? "MULTIPLIER",
  );
  const [multiplier, setMultiplier] = useState(
    String((listing.overtimeMultiplierBps ?? 15000) / 10000),
  );
  const [fixedRateTaka, setFixedRateTaka] = useState(
    listing.overtimeRatePerHourPaisa ? paisaToTaka(listing.overtimeRatePerHourPaisa) : "150",
  );
  const gracePeriod = "5";

  const pricingPatch = () => ({
    pricePerHourPaisa: takaToPaisa(hourlyTaka),
    overtimeBillingMode: mode,
    ...listingOvertimeSettings(mode, multiplier, mode === "FIXED_PER_HOUR" ? takaToPaisa(fixedRateTaka) : null, gracePeriod),
  });
  let pricingError: string | null = null;
  try { pricingPatch(); } catch (error) { pricingError = error instanceof Error ? error.message : "Enter valid pricing settings."; }

  const updateMutation = useMutation({
    mutationFn: () => listingsApi.update(listing.id, pricingPatch()),
    onSuccess: () => {
      toast.success("Pricing and overtime settings updated");
      void client.invalidateQueries({ queryKey: queryKeys.listings.root });
      onClose();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
        <div className="flex items-center gap-2">
          <Tag className="size-4 text-emerald-800" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
            Edit Listing Pricing &amp; Overtime
          </h4>
        </div>
        <span className="text-[11px] text-emerald-700 font-medium">Affects future quotes only</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`hourly-${listing.id}`} className="text-xs font-semibold text-slate-700">Hourly Price (৳ / hour)</label>
          <Input
            id={`hourly-${listing.id}`}
            type="number"
            min="0.01"
            step="0.01"
            value={hourlyTaka}
            onChange={(e) => setHourlyTaka(e.target.value)}
            className="mt-1 h-9 bg-white"
          />
        </div>

        <div>
          <label htmlFor={`grace-${listing.id}`} className="text-xs font-semibold text-slate-700">Overtime Grace Period (Minutes)</label>
          <Input
            id={`grace-${listing.id}`}
            type="number"
            value={gracePeriod}
            readOnly
            className="mt-1 h-9 bg-white"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700">Overtime Mode</label>
          <Select value={mode} onValueChange={(v) => v && setMode(v as OvertimeBillingMode)}>
            <SelectTrigger className="mt-1 h-9 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MULTIPLIER">Multiplier (e.g. 1.5× base rate)</SelectItem>
              <SelectItem value="FIXED_PER_HOUR">Fixed Rate (Specific hourly overtime ৳)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          {mode === "MULTIPLIER" ? (
            <div>
              <label htmlFor={`multiplier-${listing.id}`} className="text-xs font-semibold text-slate-700">Overtime Multiplier</label>
              <Input
                id={`multiplier-${listing.id}`}
                type="number"
                min="1"
                max="5"
                step="0.0001"
                value={multiplier}
                onChange={(e) => setMultiplier(e.target.value)}
                placeholder="1.5"
                className="mt-1 h-9 bg-white"
              />
            </div>
          ) : (
            <div>
              <label htmlFor={`fixed-rate-${listing.id}`} className="text-xs font-semibold text-slate-700">Overtime Rate (৳ / hour)</label>
              <Input
                id={`fixed-rate-${listing.id}`}
                type="number"
                min="1"
                max="100000"
                step="0.01"
                value={fixedRateTaka}
                onChange={(e) => setFixedRateTaka(e.target.value)}
                placeholder="150"
                className="mt-1 h-9 bg-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* Live Preview (Section 15 requirement) */}
      <div className="rounded-lg border border-emerald-300 bg-white p-3 text-xs space-y-1">
        <p className="font-bold text-slate-800">Pricing Preview:</p>
        <div className="flex flex-wrap gap-x-6 text-slate-600">
          <span>
            Normal: <strong>৳{hourlyTaka || "0"}/hour</strong>
          </span>
          <span>
            Overtime:{" "}
            <strong>
              {mode === "MULTIPLIER"
                ? `${multiplier}× (৳${(Number(hourlyTaka || 0) * Number(multiplier || 1)).toFixed(0)}/hr)`
                : `৳${fixedRateTaka}/hr`}{" "}
              after {gracePeriod}-minute free exit; includes initial grace, less 2 checkout minutes
            </strong>
          </span>
        </div>
      </div>

      {pricingError && <p role="alert" className="text-sm text-red-700">{pricingError}</p>}
      <div className="flex items-center justify-end gap-2 pt-1">
        <Button size="sm" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={Boolean(pricingError) || updateMutation.isPending}
          onClick={() => updateMutation.mutate()}
          className="bg-[#064E3B] text-white hover:bg-[#064E3B]/90"
        >
          {updateMutation.isPending && <Loader2 className="size-3.5 animate-spin mr-1" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// Edit Listing Details Form
// ---------------------------------------------------------
function EditDetailsForm({
  listing,
  onClose,
}: {
  listing: ParkingListingDto;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description ?? "");
  const [minDuration, setMinDuration] = useState(String(listing.minDurationMinutes ?? 60));
  const [maxDuration, setMaxDuration] = useState(String(listing.maxDurationMinutes ?? 1440));
  const [vehicles, setVehicles] = useState<VehicleType[]>(listing.allowedVehicleTypes ?? ["SEDAN"]);
  const details = { title, description, minimum: minDuration, maximum: maxDuration, vehicles };
  const detailsError = listingDetailsError(details);

  const updateMutation = useMutation({
    mutationFn: () =>
      listingsApi.update(listing.id, listingDetailsPatch(details)),
    onSuccess: () => {
      toast.success("Listing updated successfully");
      void client.invalidateQueries({ queryKey: queryKeys.listings.root });
      onClose();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Listing Settings</DialogTitle>
          <DialogDescription>
            Update title, description, and vehicle compatibility.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!detailsError && !updateMutation.isPending) updateMutation.mutate();
          }}
          className="space-y-3 py-2"
        >
          <div>
            <label htmlFor={`title-${listing.id}`} className="text-xs font-semibold text-slate-700">Listing Title</label>
            <Input
              id={`title-${listing.id}`}
              minLength={3}
              maxLength={150}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor={`description-${listing.id}`} className="text-xs font-semibold text-slate-700">Description (Optional)</label>
            <Input
              id={`description-${listing.id}`}
              maxLength={3000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`minimum-${listing.id}`} className="text-xs font-semibold text-slate-700">Min Duration (Mins)</label>
              <Input
                id={`minimum-${listing.id}`}
                type="number"
                min="15"
                max="1440"
                required
                value={minDuration}
                onChange={(e) => setMinDuration(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor={`maximum-${listing.id}`} className="text-xs font-semibold text-slate-700">Max Duration (Mins)</label>
              <Input
                id={`maximum-${listing.id}`}
                type="number"
                min="15"
                max="10080"
                required
                value={maxDuration}
                onChange={(e) => setMaxDuration(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">
              Compatible Vehicle Types
            </label>
            <div className="flex flex-wrap gap-3">
              {VEHICLE_OPTIONS.map((v) => (
                <label key={v} className="flex items-center gap-1.5 text-xs">
                  <Checkbox
                    checked={vehicles.includes(v)}
                    onCheckedChange={(checked) =>
                      setVehicles((curr) =>
                        checked ? [...curr, v] : curr.filter((item) => item !== v),
                      )
                    }
                  />
                  {v}
                </label>
              ))}
            </div>
          </div>

          {detailsError && <p role="alert" className="text-sm text-red-700">{detailsError}</p>}
          <DialogFooter className="pt-3">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={Boolean(detailsError) || updateMutation.isPending}
              className="bg-[#064E3B] text-white hover:bg-[#064E3B]/90"
            >
              {updateMutation.isPending && <Loader2 className="size-4 animate-spin mr-1" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------
// Single Listing Card
// ---------------------------------------------------------
function ListingCard({
  listing,
  canManage,
  canPrice,
}: {
  listing: ParkingListingDto;
  canManage: boolean;
  canPrice: boolean;
}) {
  const client = useQueryClient();
  const [editingPrice, setEditingPrice] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"activate" | "pause" | null>(null);

  const mutateStatus = useMutation({
    mutationFn: (action: "activate" | "pause") =>
      action === "activate"
        ? listingsApi.activate(listing.id)
        : listingsApi.pause(listing.id),
    onSuccess: (_, action) => {
      toast.success(action === "activate" ? "Listing activated" : "Listing paused");
      void client.invalidateQueries({ queryKey: queryKeys.listings.root });
      setConfirmAction(null);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err));
      setConfirmAction(null);
    },
  });

  const controls = managerListingControls(listing.status, canManage, canPrice);
  const statusColor = STATUS_COLORS[listing.status] ?? "bg-slate-100 text-slate-600";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm">{listing.title}</h3>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor}`}>
              {listing.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            ৳{paisaToTaka(listing.pricePerHourPaisa)}/hr
            {listing.overtimeMultiplierBps && (
              <span> · Overtime: {listing.overtimeMultiplierBps / 10000}×</span>
            )}
            {" · "}
            {listing.allowedVehicleTypes.join(", ")}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {controls.editDetails && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => setEditingDetails(true)}
            >
              <Edit2 className="size-3 mr-1" />
              Edit
            </Button>
          )}

          {controls.editPrice && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              onClick={() => setEditingPrice((v) => !v)}
            >
              <DollarSign className="size-3 mr-1" />
              Price
            </Button>
          )}

          {controls.pause && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
              onClick={() => setConfirmAction("pause")}
            >
              <PauseCircle className="size-3 mr-1" />
              Pause
            </Button>
          )}

          {controls.activate && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              onClick={() => setConfirmAction("activate")}
            >
              <PlayCircle className="size-3 mr-1" />
              Activate
            </Button>
          )}
        </div>
      </div>

      {editingPrice && (
        <EditPriceForm listing={listing} onClose={() => setEditingPrice(false)} />
      )}

      {editingDetails && (
        <EditDetailsForm listing={listing} onClose={() => setEditingDetails(false)} />
      )}

      {/* Confirm Action Dialog */}
      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "activate" ? "Activate" : "Pause"} this listing?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "activate"
                ? `"${listing.title}" will become visible in driver searches and accept live bookings.`
                : `"${listing.title}" will stop accepting new bookings. Confirmed bookings will still be honored.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={mutateStatus.isPending}
              onClick={() => confirmAction && mutateStatus.mutate(confirmAction)}
              className={
                confirmAction === "activate"
                  ? "bg-emerald-700 hover:bg-emerald-800"
                  : "bg-amber-600 hover:bg-amber-700"
              }
            >
              {mutateStatus.isPending && <Loader2 className="size-4 animate-spin mr-1" />}
              {confirmAction === "activate" ? "Activate Listing" : "Pause Listing"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------------------------------------------------------
// Main ManagerListingsSection with Create Listing Dialog
// ---------------------------------------------------------
export function ManagerListingsSection({
  propertyId,
  resourceIds,
  canManage,
  canPrice,
}: {
  propertyId: string;
  resourceIds: string[];
  canManage: boolean;
  canPrice: boolean;
}) {
  const client = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Creation form states
  const [selectedRightId, setSelectedRightId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hourlyTaka, setHourlyTaka] = useState("100");
  const [overtimeMode, setOvertimeMode] = useState<OvertimeBillingMode>("MULTIPLIER");
  const [overtimeMultiplier, setOvertimeMultiplier] = useState("1.5");
  const [overtimeFixedTaka, setOvertimeFixedTaka] = useState("150");
  const gracePeriodMinutes = "5";
  const [minDurationMinutes, setMinDurationMinutes] = useState("60");
  const [maxDurationMinutes, setMaxDurationMinutes] = useState("1440");
  const [vehicles, setVehicles] = useState<VehicleType[]>(["SEDAN", "SUV"]);

  // Queries
  const listingsQuery = useQuery({
    queryKey: queryKeys.listings.all({ propertyId }),
    queryFn: listingsApi.list,
  });

  const rightsQuery = useQuery({
    queryKey: queryKeys.parkingRights.all(),
    queryFn: parkingRightsApi.list,
    enabled: createDialogOpen,
  });

  // Filter verified rights for this property in delegated scope
  const eligibleRights = useMemo(() => {
    return (rightsQuery.data ?? []).filter((r) => {
      if (r.status !== "VERIFIED") return false;
      if (!r.canList) return false;
      if (r.parkingSpot?.propertyId !== propertyId) return false;
      if (resourceIds.length > 0 && !resourceIds.includes(r.parkingSpotId)) return false;
      return true;
    });
  }, [rightsQuery.data, propertyId, resourceIds]);

  const createPayload = () => {
    if (!eligibleRights.some((right) => right.id === selectedRightId)) {
      throw new Error("Choose an eligible parking right in your assigned scope.");
    }
    const data = new FormData();
    for (const [name, value] of Object.entries({
      title, description, hourlyRate: hourlyTaka, deposit: "0",
      minimum: minDurationMinutes, maximum: maxDurationMinutes,
      overtimeMultiplier, overtimeRate: overtimeFixedTaka, overtimeGrace: gracePeriodMinutes,
    })) data.set(name, value);
    return { parkingRightId: selectedRightId, ...listingPayload(data, overtimeMode, vehicles) };
  };
  let createError: string | null = null;
  try { createPayload(); } catch (error) {
    createError = error instanceof Error ? error.message : "Review the listing settings.";
  }

  const createMutation = useMutation({
    mutationFn: () => listingsApi.create(createPayload()),
    onSuccess: () => {
      toast.success("Listing created on behalf of Provider");
      void client.invalidateQueries({ queryKey: queryKeys.listings.root });
      setCreateDialogOpen(false);
      setTitle("");
      setDescription("");
      setSelectedRightId("");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  if (listingsQuery.isPending) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="size-4 animate-spin" />
        Loading listings…
      </div>
    );
  }

  if (listingsQuery.isError) {
    return <p className="text-sm text-red-700">{getApiErrorMessage(listingsQuery.error)}</p>;
  }

  const listings = listingsInPropertyScope(listingsQuery.data ?? [], propertyId, resourceIds);

  return (
    <div className="space-y-4">
      {/* Header with CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <CheckCircle2 className="size-3.5 text-emerald-600" />
          {listings.length} listing{listings.length !== 1 ? "s" : ""} in scope
          {canManage && " · You can create, edit, activate, and pause listings"}
          {canPrice && " · You can adjust pricing and overtime"}
        </div>
        {canManage && (
          <Button
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
            className="h-8 gap-1.5 bg-[#064E3B] text-xs font-semibold text-white hover:bg-[#064E3B]/90"
          >
            <Plus className="size-3.5" />
            Create Listing
          </Button>
        )}
      </div>

      {listings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center">
          <Tag className="mx-auto size-8 text-slate-300" />
          <p className="mt-2 text-sm font-semibold text-slate-700">No listings yet</p>
          <p className="mt-1 text-xs text-slate-500">
            {canManage
              ? "Click 'Create Listing' to publish an active parking listing against verified rights."
              : "No listings are currently published in your delegated scope."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              canManage={canManage}
              canPrice={canPrice}
            />
          ))}
        </div>
      )}

      {/* Create Listing Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Parking Listing</DialogTitle>
            <DialogDescription>
              Publish a commercial listing on behalf of the Provider against a verified Parking Right.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label htmlFor="manager-create-right" className="text-xs font-semibold text-slate-700">
                Select Verified Parking Resource / Right
              </label>
              {rightsQuery.isPending ? (
                <div className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
                  <Loader2 className="size-3 animate-spin" /> Loading verified rights…
                </div>
              ) : eligibleRights.length === 0 ? (
                <div className="mt-1 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
                  <ShieldCheck className="size-4 inline mr-1 text-amber-700" />
                  No verified parking rights found in your scope. The Provider must verify ownership
                  rights before a listing can be published.
                </div>
              ) : (
                <Select value={selectedRightId} onValueChange={(v) => v && setSelectedRightId(v)}>
                  <SelectTrigger id="manager-create-right" className="mt-1">
                    <SelectValue placeholder="Choose a verified parking space…">
                      {(v: string) => {
                        const right = eligibleRights.find((r) => r.id === v);
                        return right
                          ? `${right.parkingSpot?.displayName || right.parkingSpot?.spotCode || "Spot"} (${right.rightType})`
                          : "Choose a verified parking space…";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleRights.map((right) => (
                      <SelectItem key={right.id} value={right.id}>
                        {right.parkingSpot?.displayName || right.parkingSpot?.spotCode || "Spot"} (
                        {right.rightType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <label htmlFor="manager-create-title" className="text-xs font-semibold text-slate-700">Listing Title</label>
              <Input
                minLength={3}
                maxLength={150}
                id="manager-create-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Daytime Parking - Secure Basement Slot"
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="manager-create-description" className="text-xs font-semibold text-slate-700">Description (Optional)</label>
              <Input
                maxLength={3000}
                id="manager-create-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Easy elevator access, 24/7 security guard"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="manager-create-hourly" className="text-xs font-semibold text-slate-700">Hourly Price (৳ / hr)</label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  id="manager-create-hourly"
                  value={hourlyTaka}
                  onChange={(e) => setHourlyTaka(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="manager-create-grace" className="text-xs font-semibold text-slate-700">Grace Period (Minutes)</label>
                <Input
                  type="number"
                  id="manager-create-grace"
                  value={gracePeriodMinutes}
                  readOnly
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="manager-create-mode" className="text-xs font-semibold text-slate-700">Overtime Mode</label>
                <Select
                  value={overtimeMode}
                  onValueChange={(v) => v && setOvertimeMode(v as OvertimeBillingMode)}
                >
                  <SelectTrigger id="manager-create-mode" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MULTIPLIER">Multiplier (e.g. 1.5×)</SelectItem>
                    <SelectItem value="FIXED_PER_HOUR">Fixed Hourly Overtime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                {overtimeMode === "MULTIPLIER" ? (
                  <div>
                    <label htmlFor="manager-create-multiplier" className="text-xs font-semibold text-slate-700">Multiplier</label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      step="0.0001"
                      id="manager-create-multiplier"
                      value={overtimeMultiplier}
                      onChange={(e) => setOvertimeMultiplier(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                ) : (
                  <div>
                    <label htmlFor="manager-create-fixed" className="text-xs font-semibold text-slate-700">Overtime Rate (৳/hr)</label>
                    <Input
                      type="number"
                      min="1"
                      max="100000"
                      step="0.01"
                      id="manager-create-fixed"
                      value={overtimeFixedTaka}
                      onChange={(e) => setOvertimeFixedTaka(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Live Preview */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-xs">
              <span className="font-semibold text-emerald-950">Pricing Preview:</span>{" "}
              Normal: ৳{hourlyTaka}/hr · Overtime:{" "}
              {overtimeMode === "MULTIPLIER"
                ? `${overtimeMultiplier}×`
                : `৳${overtimeFixedTaka}/hr`}{" "}
              after {gracePeriodMinutes}-min free exit; includes initial grace, less 2 checkout minutes.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="manager-create-minimum" className="text-xs font-semibold text-slate-700">Min Duration (Minutes)</label>
                <Input
                  type="number"
                  min="15"
                  max="1440"
                  id="manager-create-minimum"
                  value={minDurationMinutes}
                  onChange={(e) => setMinDurationMinutes(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="manager-create-maximum" className="text-xs font-semibold text-slate-700">Max Duration (Minutes)</label>
                <Input
                  type="number"
                  min="15"
                  max="10080"
                  id="manager-create-maximum"
                  value={maxDurationMinutes}
                  onChange={(e) => setMaxDurationMinutes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Compatible Vehicle Types
              </label>
              <div className="flex flex-wrap gap-3">
                {VEHICLE_OPTIONS.map((v) => (
                  <label key={v} className="flex items-center gap-1.5 text-xs">
                    <Checkbox
                      checked={vehicles.includes(v)}
                      onCheckedChange={(checked) =>
                        setVehicles((curr) =>
                          checked ? [...curr, v] : curr.filter((item) => item !== v),
                        )
                      }
                    />
                    {v}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {createError && <p role="alert" className="text-sm text-red-700">{createError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                Boolean(createError) ||
                createMutation.isPending
              }
              onClick={() => { if (!createError && !createMutation.isPending) createMutation.mutate(); }}
              className="bg-[#064E3B] text-white hover:bg-[#064E3B]/90"
            >
              {createMutation.isPending && <Loader2 className="size-4 animate-spin mr-1" />}
              Create Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
