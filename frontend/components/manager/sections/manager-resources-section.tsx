"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Building2,
  Edit2,
  Layers,
  Loader2,
  Plus,
  Shield,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { parkingResourcesApi } from "@/lib/api/parking-resources-api";
import { queryKeys } from "@/lib/query-keys";
import type { ParkingResourceDto, ParkingResourceType } from "@/lib/api/marketplace-types";
import type { VehicleType } from "@/lib/api/api-types";

const VEHICLE_OPTIONS: VehicleType[] = ["SEDAN", "SUV", "MICROBUS", "MOTORCYCLE"];

interface ManagerResourcesSectionProps {
  propertyId: string;
  resources: ParkingResourceDto[];
  canManage: boolean;
  canListingManage?: boolean;
  onCreateListingForResource?: (resource: ParkingResourceDto) => void;
}

export function ManagerResourcesSection({
  propertyId,
  resources,
  canManage,
  canListingManage,
  onCreateListingForResource,
}: ManagerResourcesSectionProps) {
  const client = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ParkingResourceDto | null>(null);

  // Form states for creation
  const [mode, setMode] = useState<"SINGLE" | "BULK">("SINGLE");
  const [resourceType, setResourceType] = useState<ParkingResourceType>("FIXED_SPACE");
  const [displayName, setDisplayName] = useState("");
  const [spotCode, setSpotCode] = useState("");
  const [capacity, setCapacity] = useState(1);
  const [floor, setFloor] = useState("");
  const [zone, setZone] = useState("");
  const [vehicles, setVehicles] = useState<VehicleType[]>(["SEDAN", "SUV"]);
  const [isCovered, setIsCovered] = useState(false);
  const [hasCctv, setHasCctv] = useState(false);
  const [hasGuard, setHasGuard] = useState(false);

  // Bulk generation parameters
  const [bulkPrefix, setBulkPrefix] = useState("A");
  const [bulkStart, setBulkStart] = useState(1);
  const [bulkEnd, setBulkEnd] = useState(10);
  const [bulkSeparator, setBulkSeparator] = useState("-");

  const resetForm = () => {
    setDisplayName("");
    setSpotCode("");
    setCapacity(1);
    setFloor("");
    setZone("");
    setVehicles(["SEDAN", "SUV"]);
    setIsCovered(false);
    setHasCctv(false);
    setHasGuard(false);
  };

  const createSingle = useMutation({
    mutationFn: () =>
      parkingResourcesApi.create(propertyId, {
        type: resourceType,
        displayName: displayName.trim(),
        spotCode: resourceType === "FIXED_SPACE" ? spotCode.trim() : undefined,
        capacity: resourceType === "FIXED_SPACE" ? 1 : Number(capacity),
        floor: floor.trim() || undefined,
        zone: zone.trim() || undefined,
        supportedVehicleTypes: vehicles,
        isCovered,
        hasCctv,
        hasGuard,
      }),
    onSuccess: () => {
      toast.success("Parking resource created on behalf of Provider");
      void client.invalidateQueries({
        queryKey: queryKeys.parkingResources.byProperty(propertyId),
      });
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const createBulk = useMutation({
    mutationFn: () => {
      const start = Math.max(1, bulkStart);
      const end = Math.max(start, bulkEnd);
      const spaces = Array.from({ length: end - start + 1 }, (_, i) => {
        const num = String(start + i).padStart(2, "0");
        const code = `${bulkPrefix.trim().toUpperCase()}${bulkSeparator}${num}`;
        return {
          spotCode: code,
          displayName: `${displayName.trim() || "Space"} ${code}`,
        };
      });

      return parkingResourcesApi.createBulk(propertyId, {
        resource: {
          type: "FIXED_SPACE",
          displayName: displayName.trim() || `${bulkPrefix} Wing`,
          floor: floor.trim() || undefined,
          zone: zone.trim() || undefined,
          supportedVehicleTypes: vehicles,
          isCovered,
          hasCctv,
          hasGuard,
        },
        units: spaces,
      });
    },
    onSuccess: (res) => {
      toast.success(`${res.createdCount} fixed parking units created on behalf of Provider`);
      void client.invalidateQueries({
        queryKey: queryKeys.parkingResources.byProperty(propertyId),
      });
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: (input: {
      resourceId: string;
      displayName: string;
      floor?: string | null;
      zone?: string | null;
      status: ParkingResourceDto["status"];
    }) =>
      parkingResourcesApi.update(input.resourceId, {
        displayName: input.displayName,
        floor: input.floor,
        zone: input.zone,
        status: input.status,
      }),
    onSuccess: (result) => {
      if (result.warning) toast.warning(result.warning, { description: result.affectedBookings?.map((item) => item.bookingCode).join(", "), duration: 12000 });
      else toast.success("Parking resource updated");
      void client.invalidateQueries({
        queryKey: queryKeys.parkingResources.byProperty(propertyId),
      });
      setEditingResource(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <div className="space-y-4">
      {/* Header with CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <p className="text-xs text-slate-500">
            {resources.length} parking resource{resources.length !== 1 ? "s" : ""} available
            {canManage && " · You can create and configure resources on behalf of the Provider"}
          </p>
        </div>
        {canManage && (
          <Button
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
            className="h-8 gap-1.5 bg-[#064E3B] text-xs font-semibold text-white hover:bg-[#064E3B]/90"
          >
            <Plus className="size-3.5" />
            Add Parking Resource
          </Button>
        )}
      </div>

      {/* Resource Grid */}
      {resources.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center">
          <Layers className="mx-auto size-8 text-slate-300" />
          <p className="mt-2 text-sm font-semibold text-slate-700">No parking resources yet</p>
          <p className="mt-1 text-xs text-slate-500">
            {canManage
              ? "Use the button above to add fixed spaces or shared pools for this property."
              : "No resources are currently allocated or configured."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {resource.displayName || resource.spotCode || "Resource"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {resource.resourceType === "FIXED_SPACE" ? "Fixed Space" : "Shared Pool"}
                      {resource.floor && ` · Floor ${resource.floor}`}
                      {resource.zone && ` · Zone ${resource.zone}`}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      resource.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {resource.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                  <div className="flex justify-between">
                    <span>Capacity:</span>
                    <strong className="text-slate-900">{resource.capacity} vehicles</strong>
                  </div>
                  {resource.units && resource.units.length > 0 && (
                    <div className="flex justify-between">
                      <span>Units created:</span>
                      <strong className="text-slate-900">{resource.units.length} spots</strong>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {resource.isCovered && (
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700">
                        <Building2 className="size-3" /> Covered
                      </span>
                    )}
                    {resource.hasCctv && (
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700">
                        <Video className="size-3" /> CCTV
                      </span>
                    )}
                    {resource.hasGuard && (
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700">
                        <Shield className="size-3" /> Guard
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                {canManage && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setEditingResource(resource)}
                  >
                    <Edit2 className="size-3 mr-1" />
                    Edit
                  </Button>
                )}
                {canListingManage && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    onClick={() =>
                      onCreateListingForResource
                        ? onCreateListingForResource(resource)
                        : toast.info("Navigate to Listings & Pricing to create a listing")
                    }
                  >
                    <Plus className="size-3 mr-1" />
                    Create Listing
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Resource Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Parking Resource</DialogTitle>
            <DialogDescription>
              Create inventory on behalf of the Provider for this Property.
            </DialogDescription>
          </DialogHeader>

          {/* Legal Boundary Notice */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="size-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <strong>Legal Notice:</strong> Resources created belong to the Provider.
              Parking Right verification is required before this Resource can be listed.
            </div>
          </div>

          <div className="space-y-4 py-2">
            <div className="flex gap-4 border-b border-slate-200 pb-3">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="resourceMode"
                  checked={mode === "SINGLE"}
                  onChange={() => setMode("SINGLE")}
                />
                Single Resource
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="resourceMode"
                  checked={mode === "BULK"}
                  onChange={() => {
                    setMode("BULK");
                    setResourceType("FIXED_SPACE");
                  }}
                />
                Bulk Fixed Spaces (e.g. A-01 to A-10)
              </label>
            </div>

            {mode === "SINGLE" && (
              <div>
                <label className="text-xs font-medium text-slate-700">Type</label>
                <Select
                  value={resourceType}
                  onValueChange={(v) => setResourceType(v as ParkingResourceType)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED_SPACE">Fixed Space (Single numbered bay)</SelectItem>
                    <SelectItem value="SHARED_POOL">Shared Pool (Open pool capacity)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-700">
                {mode === "BULK" ? "Group / Zone Name" : "Display Name"}
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={mode === "BULK" ? "e.g. Basement Zone A" : "e.g. Spot A-01 or Zone A Pool"}
                className="mt-1"
              />
            </div>

            {mode === "SINGLE" && resourceType === "FIXED_SPACE" && (
              <div>
                <label className="text-xs font-medium text-slate-700">Spot Code</label>
                <Input
                  value={spotCode}
                  onChange={(e) => setSpotCode(e.target.value)}
                  placeholder="e.g. A-01"
                  className="mt-1"
                />
              </div>
            )}

            {mode === "SINGLE" && resourceType === "SHARED_POOL" && (
              <div>
                <label className="text-xs font-medium text-slate-700">Capacity (Vehicles)</label>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            )}

            {mode === "BULK" && (
              <div className="grid grid-cols-4 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div>
                  <label className="text-[11px] text-slate-500">Prefix</label>
                  <Input
                    value={bulkPrefix}
                    onChange={(e) => setBulkPrefix(e.target.value)}
                    className="mt-1 h-8 text-xs uppercase"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500">Separator</label>
                  <Input
                    value={bulkSeparator}
                    onChange={(e) => setBulkSeparator(e.target.value)}
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500">Start #</label>
                  <Input
                    type="number"
                    min={1}
                    value={bulkStart}
                    onChange={(e) => setBulkStart(Number(e.target.value))}
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500">End #</label>
                  <Input
                    type="number"
                    min={bulkStart}
                    max={bulkStart + 99}
                    value={bulkEnd}
                    onChange={(e) => setBulkEnd(Number(e.target.value))}
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <div className="col-span-4 mt-1 text-[11px] text-slate-500">
                  Preview:{" "}
                  <strong>
                    {bulkPrefix.toUpperCase()}
                    {bulkSeparator}
                    {String(bulkStart).padStart(2, "0")}
                  </strong>{" "}
                  to{" "}
                  <strong>
                    {bulkPrefix.toUpperCase()}
                    {bulkSeparator}
                    {String(bulkEnd).padStart(2, "0")}
                  </strong>{" "}
                  ({Math.max(0, bulkEnd - bulkStart + 1)} spaces)
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Floor (Optional)</label>
                <Input
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="e.g. Basement 1"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Zone (Optional)</label>
                <Input
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  placeholder="e.g. Zone B"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 mb-1.5 block">
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

            <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 text-xs">
                <Checkbox
                  checked={isCovered}
                  onCheckedChange={(c) => setIsCovered(Boolean(c))}
                />
                Covered Parking
              </label>
              <label className="flex items-center gap-2 text-xs">
                <Checkbox
                  checked={hasCctv}
                  onCheckedChange={(c) => setHasCctv(Boolean(c))}
                />
                CCTV Monitored
              </label>
              <label className="flex items-center gap-2 text-xs">
                <Checkbox
                  checked={hasGuard}
                  onCheckedChange={(c) => setHasGuard(Boolean(c))}
                />
                Guard on Duty
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                !displayName.trim() ||
                (mode === "SINGLE" && resourceType === "FIXED_SPACE" && !spotCode.trim()) ||
                vehicles.length === 0 ||
                createSingle.isPending ||
                createBulk.isPending
              }
              onClick={() => {
                if (mode === "SINGLE") createSingle.mutate();
                else createBulk.mutate();
              }}
              className="bg-[#064E3B] text-white hover:bg-[#064E3B]/90"
            >
              {(createSingle.isPending || createBulk.isPending) && (
                <Loader2 className="size-4 animate-spin mr-1" />
              )}
              Create Resource
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Resource Dialog */}
      {editingResource && (
        <Dialog open={Boolean(editingResource)} onOpenChange={() => setEditingResource(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Resource</DialogTitle>
              <DialogDescription>
                Update operational details for {editingResource.displayName || editingResource.spotCode}.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                updateMutation.mutate({
                  resourceId: editingResource.id,
                  displayName: String(form.get("displayName")),
                  floor: String(form.get("floor") || "") || null,
                  zone: String(form.get("zone") || "") || null,
                  status: String(form.get("status")) as ParkingResourceDto["status"],
                });
              }}
              className="space-y-3 py-2"
            >
              <div>
                <label className="text-xs font-medium text-slate-700">Display Name</label>
                <Input
                  name="displayName"
                  defaultValue={editingResource.displayName ?? ""}
                  required
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Floor</label>
                  <Input
                    name="floor"
                    defaultValue={editingResource.floor ?? ""}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Zone</label>
                  <Input
                    name="zone"
                    defaultValue={editingResource.zone ?? ""}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Status</label>
                <select
                  name="status"
                  defaultValue={editingResource.status}
                  className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="BLOCKED">BLOCKED</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <DialogFooter className="pt-3">
                <Button variant="outline" type="button" onClick={() => setEditingResource(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-[#064E3B] text-white hover:bg-[#064E3B]/90"
                >
                  {updateMutation.isPending && <Loader2 className="size-4 animate-spin mr-1" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
