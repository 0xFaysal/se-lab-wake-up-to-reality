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
  return (Number(paisa) / 100).toFixed(2);
}

function takaToPaisa(taka: string | number): string {
  return String(Math.round(Number(taka) * 100));
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
    listing.overtimeMultiplierBps ? (listing.overtimeMultiplierBps / 10000).toFixed(1) : "1.5",
  );
  const [fixedRateTaka, setFixedRateTaka] = useState(
    listing.overtimeRatePerHourPaisa ? paisaToTaka(listing.overtimeRatePerHourPaisa) : "150",
  );
  const [gracePeriod, setGracePeriod] = useState(
    String(listing.overtimeGracePeriodMinutes ?? 15),
  );

  const updateMutation = useMutation({
    mutationFn: () =>
      listingsApi.update(listing.id, {
        pricePerHourPaisa: takaToPaisa(hourlyTaka),
        overtimeBillingMode: mode,
        overtimeMultiplierBps:
          mode === "MULTIPLIER" ? Math.round(parseFloat(multiplier) * 10000) : null,
        overtimeRatePerHourPaisa:
          mode === "FIXED_PER_HOUR" ? takaToPaisa(fixedRateTaka) : null,
        overtimeGracePeriodMinutes: Number(gracePeriod) || 15,
      }),
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
          <label className="text-xs font-semibold text-slate-700">Hourly Price (৳ / hour)</label>
          <Input
            type="number"
            min="1"
            step="1"
            value={hourlyTaka}
            onChange={(e) => setHourlyTaka(e.target.value)}
            className="mt-1 h-9 bg-white"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700">Overtime Grace Period (Minutes)</label>
          <Input
            type="number"
            min="0"
            max="120"
            value={gracePeriod}
            onChange={(e) => setGracePeriod(e.target.value)}
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
              <label className="text-xs font-semibold text-slate-700">Overtime Multiplier</label>
              <Input
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={multiplier}
                onChange={(e) => setMultiplier(e.target.value)}
                placeholder="1.5"
                className="mt-1 h-9 bg-white"
              />
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-slate-700">Overtime Rate (৳ / hour)</label>
              <Input
                type="number"
                min="1"
                step="1"
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
              after {gracePeriod}-minute grace
            </strong>
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button size="sm" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={!hourlyTaka || updateMutation.isPending}
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

  const updateMutation = useMutation({
    mutationFn: () =>
      listingsApi.update(listing.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        minDurationMinutes: Number(minDuration) || 60,
        maxDurationMinutes: Number(maxDuration) || 1440,
        allowedVehicleTypes: vehicles,
      }),
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
            updateMutation.mutate();
          }}
          className="space-y-3 py-2"
        >
          <div>
            <label className="text-xs font-semibold text-slate-700">Listing Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Description (Optional)</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Min Duration (Mins)</label>
              <Input
                type="number"
                min="15"
                value={minDuration}
                onChange={(e) => setMinDuration(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Max Duration (Mins)</label>
              <Input
                type="number"
                min="30"
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

          <DialogFooter className="pt-3">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || vehicles.length === 0 || updateMutation.isPending}
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
  resourceIds,
}: {
  listing: ParkingListingDto;
  canManage: boolean;
  canPrice: boolean;
  resourceIds: string[];
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

  const inScope =
    resourceIds.length === 0 ||
    (listing.parkingSpotId ? resourceIds.includes(listing.parkingSpotId) : true);

  if (!inScope) return null;

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
              <span> · Overtime: {(listing.overtimeMultiplierBps / 10000).toFixed(1)}×</span>
            )}
            {" · "}
            {listing.allowedVehicleTypes.join(", ")}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {canManage && (
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

          {canPrice && (
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

          {canManage && listing.status === "ACTIVE" && (
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

          {canManage && listing.status === "PAUSED" && (
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
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(15);
  const [minDurationMinutes, setMinDurationMinutes] = useState(60);
  const [maxDurationMinutes, setMaxDurationMinutes] = useState(1440);
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

  const createMutation = useMutation({
    mutationFn: () =>
      listingsApi.create({
        parkingRightId: selectedRightId,
        title: title.trim(),
        description: description.trim() || undefined,
        pricePerHourPaisa: takaToPaisa(hourlyTaka),
        securityDepositPaisa: "0",
        minDurationMinutes,
        maxDurationMinutes,
        allowedVehicleTypes: vehicles,
        overtimeBillingMode: overtimeMode,
        overtimeMultiplierBps:
          overtimeMode === "MULTIPLIER"
            ? Math.round(parseFloat(overtimeMultiplier) * 10000)
            : null,
        overtimeRatePerHourPaisa:
          overtimeMode === "FIXED_PER_HOUR" ? takaToPaisa(overtimeFixedTaka) : null,
        overtimeGracePeriodMinutes: gracePeriodMinutes,
      }),
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

  const listings = (listingsQuery.data ?? []).filter(
    (l) => resourceIds.length === 0 || resourceIds.includes(l.parkingSpotId),
  );

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
              resourceIds={resourceIds}
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
              <label className="text-xs font-semibold text-slate-700">
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
                  <SelectTrigger className="mt-1">
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
              <label className="text-xs font-semibold text-slate-700">Listing Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Daytime Parking - Secure Basement Slot"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Description (Optional)</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Easy elevator access, 24/7 security guard"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Hourly Price (৳ / hr)</label>
                <Input
                  type="number"
                  min="1"
                  value={hourlyTaka}
                  onChange={(e) => setHourlyTaka(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Grace Period (Minutes)</label>
                <Input
                  type="number"
                  min="0"
                  max="120"
                  value={gracePeriodMinutes}
                  onChange={(e) => setGracePeriodMinutes(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Overtime Mode</label>
                <Select
                  value={overtimeMode}
                  onValueChange={(v) => v && setOvertimeMode(v as OvertimeBillingMode)}
                >
                  <SelectTrigger className="mt-1">
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
                    <label className="text-xs font-semibold text-slate-700">Multiplier</label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      value={overtimeMultiplier}
                      onChange={(e) => setOvertimeMultiplier(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Overtime Rate (৳/hr)</label>
                    <Input
                      type="number"
                      min="1"
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
              after {gracePeriodMinutes}-min grace.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Min Duration (Minutes)</label>
                <Input
                  type="number"
                  min="15"
                  value={minDurationMinutes}
                  onChange={(e) => setMinDurationMinutes(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Max Duration (Minutes)</label>
                <Input
                  type="number"
                  min="30"
                  value={maxDurationMinutes}
                  onChange={(e) => setMaxDurationMinutes(Number(e.target.value))}
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                !selectedRightId ||
                !title.trim() ||
                !hourlyTaka ||
                vehicles.length === 0 ||
                createMutation.isPending
              }
              onClick={() => createMutation.mutate()}
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
