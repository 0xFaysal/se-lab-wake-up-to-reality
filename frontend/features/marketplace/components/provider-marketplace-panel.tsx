"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Download, Edit3, Loader2, Plus, Scale, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, getApiErrorMessage } from "@/lib/api/api-error";
import type { VehicleType } from "@/lib/api/api-types";
import { listingsApi } from "@/lib/api/listings-api";
import type { BulkParkingResourceInput, CreateParkingResourceInput, ParkingResourceDto, ParkingResourceType, ParkingRightChangeInput, ParkingRightClaimInput, ParkingRightDocumentDto, ParkingRightDto, ParkingRightType } from "@/lib/api/marketplace-types";
import { parkingResourcesApi } from "@/lib/api/parking-resources-api";
import { parkingRightsApi } from "@/lib/api/parking-rights-api";
import { formatBDTFromPaisa, formatDateTime, toUtcFromBangladeshLocal } from "@/lib/formatters";
import { listingStatus, parkingRightStatus } from "@/lib/marketplace-status";
import { queryKeys } from "@/lib/query-keys";

const VEHICLES: VehicleType[] = ["MOTORCYCLE", "SEDAN", "SUV", "MICROBUS"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const normalizePreviewSpotCode = (value: string) => value.trim().toUpperCase().replace(/[\s-]+/g, "");

export function ProviderMarketplacePanel({ propertyId }: { propertyId: string }) {
  const client = useQueryClient();
  const resources = useQuery({ queryKey: queryKeys.parkingResources.byProperty(propertyId), queryFn: () => parkingResourcesApi.list(propertyId) });
  const rights = useQuery({ queryKey: queryKeys.parkingRights.all({ propertyId }), queryFn: parkingRightsApi.list });
  const listings = useQuery({ queryKey: queryKeys.listings.all({ propertyId }), queryFn: listingsApi.list });
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [showBulkResourceForm, setShowBulkResourceForm] = useState(false);
  const [rightResource, setRightResource] = useState<ParkingResourceDto | null>(null);
  const [availabilityResource, setAvailabilityResource] = useState<ParkingResourceDto | null>(null);
  const [editResource, setEditResource] = useState<ParkingResourceDto | null>(null);
  const [changeRight, setChangeRight] = useState<ParkingRightDto | null>(null);
  const [deleteResource, setDeleteResource] = useState<ParkingResourceDto | null>(null);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [showBatchClaimForm, setShowBatchClaimForm] = useState(false);

  async function refreshAll() {
    await Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.parkingResources.root }),
      client.invalidateQueries({ queryKey: queryKeys.parkingRights.root }),
      client.invalidateQueries({ queryKey: queryKeys.listings.root }),
      client.invalidateQueries({ queryKey: queryKeys.parkingSearch.root }),
    ]);
  }

  const remove = useMutation({ mutationFn: (id: string) => parkingResourcesApi.remove(id), onSuccess: async () => { setDeleteResource(null); toast.success("Parking resource deleted"); await refreshAll(); }, onError: (error) => toast.error(getApiErrorMessage(error)) });

  if (resources.isPending || rights.isPending || listings.isPending) return <PanelState loading message="Loading parking marketplace" />;
  if (resources.isError || rights.isError || listings.isError) return <PanelState message={getApiErrorMessage(resources.error ?? rights.error ?? listings.error)} retry={() => void Promise.all([resources.refetch(), rights.refetch(), listings.refetch()])} />;

  const propertyResources = resources.data ?? [];
  const resourceIds = new Set(propertyResources.map((item) => item.id));
  const propertyRights = (rights.data ?? []).filter((item) => resourceIds.has(item.parkingSpotId));
  const propertyListings = (listings.data ?? []).filter((item) => resourceIds.has(item.parkingSpotId));

  return <section className="space-y-5 border-t pt-8">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-xl font-extrabold">Parking Resources</h2><p className="mt-1 text-sm text-slate-500">Fixed spaces and shared parking capacity for this Property.</p></div><div className="flex gap-2"><Button variant={showBulkResourceForm ? "outline" : "default"} onClick={() => { setShowBulkResourceForm(false); setShowResourceForm((value) => !value); }}><Plus className="size-4" />Single</Button><Button variant={showBulkResourceForm ? "default" : "outline"} onClick={() => { setShowResourceForm(false); setShowBulkResourceForm((value) => !value); }}><Plus className="size-4" />Bulk fixed spaces</Button></div></div>
    {showResourceForm && <ResourceForm propertyId={propertyId} onDone={async () => { setShowResourceForm(false); await refreshAll(); }} />}
    {showBulkResourceForm && <BulkResourceForm propertyId={propertyId} existingResources={propertyResources} onDone={async (createdIds) => { setShowBulkResourceForm(false); setSelectedResourceIds(createdIds); setShowBatchClaimForm(createdIds.length > 1); await refreshAll(); }} />}
    {selectedResourceIds.length > 1 && <div className="flex flex-wrap items-center justify-between gap-3 border-y border-emerald-200 bg-emerald-50 py-3"><p className="text-sm font-semibold">{selectedResourceIds.length} spaces selected for one Parking Right claim</p><Button size="sm" onClick={() => setShowBatchClaimForm(true)}><Scale className="size-4" />Claim selected rights</Button></div>}
    {showBatchClaimForm && <BulkRightClaimForm propertyId={propertyId} resourceIds={selectedResourceIds} close={() => setShowBatchClaimForm(false)} onDone={async () => { setShowBatchClaimForm(false); setSelectedResourceIds([]); await refreshAll(); }} />}
    {propertyResources.length === 0 ? <PanelState message="No parking resources have been added." /> : <div className="grid gap-4 xl:grid-cols-2">{propertyResources.map((resource) => {
      const linkedRights = propertyRights.filter((right) => right.parkingSpotId === resource.id);
      const linkedListings = propertyListings.filter((listing) => listing.parkingSpotId === resource.id);
      const blocksNewClaim = linkedRights.some((right) => ["PENDING_VERIFICATION", "VERIFIED", "DISPUTED"].includes(right.status));
      const selectable = resource.resourceType === "FIXED_SPACE" && !blocksNewClaim;
      return <article key={resource.id} className="rounded-lg border bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3">{selectable && <Checkbox aria-label={`Select ${resource.displayName ?? resource.spotCode ?? "parking space"}`} checked={selectedResourceIds.includes(resource.id)} onCheckedChange={(checked) => setSelectedResourceIds((current) => checked ? current.includes(resource.id) ? current : [...current, resource.id] : current.filter((id) => id !== resource.id))} />}<div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{resource.displayName ?? "Parking resource"}</h3><Status label={resource.resourceType === "SHARED_POOL" ? "Shared pool" : "Fixed spaces"} className="bg-blue-100 text-blue-800" /><Status label={resource.status} className={resource.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"} /></div><p className="mt-1 text-xs text-slate-500">Capacity {resource.capacity} {resource.floor ? `· Floor ${resource.floor}` : ""} {resource.zone ? `· ${resource.zone}` : ""}</p>{resource.units?.length ? <p className="mt-1 text-xs text-slate-500">Units: {resource.units.slice(0, 8).map((unit) => unit.spotCode).join(", ")}{resource.units.length > 8 ? ` +${resource.units.length - 8} more` : ""}</p> : null}</div></div><Button aria-label="Delete parking resource" title="Delete resource" size="icon" variant="ghost" onClick={() => setDeleteResource(resource)}><Trash2 className="size-4 text-red-600" /></Button></div>
        <div className="mt-4 flex flex-wrap gap-2">{resource.supportedVehicleTypes.map((type) => <span key={type} className="rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold">{type.replaceAll("_", " ")}</span>)}</div>
        <div className="mt-4 border-t pt-4"><p className="text-xs font-bold uppercase text-slate-500">Parking rights</p>{linkedRights.length === 0 ? <p className="mt-2 text-xs text-amber-700">No right claim submitted.</p> : <div className="mt-2 space-y-2">{linkedRights.map((right) => { const dateEffective = new Date(right.validFrom) <= new Date() && (!right.validUntil || new Date(right.validUntil) > new Date()); const effectiveCanList = right.status === "VERIFIED" && dateEffective && right.canList && right.canSetPrice; return <div key={right.id} className="rounded-md bg-slate-50 p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span>{right.rightType.replaceAll("_", " ")} · Qty {right.quantity} · v{right.version}</span><Status {...parkingRightStatus[right.status]} /></div><p className="mt-1 text-xs text-slate-500">Valid {formatDateTime(right.validFrom)}{right.validUntil ? ` to ${formatDateTime(right.validUntil)}` : " with no configured expiry"}</p><p className="mt-1 text-xs text-slate-500">Configured listing permission: {right.canList && right.canSetPrice ? "Yes" : "No"} · Effective now: {effectiveCanList ? "Yes" : "No"}</p>{right.rejectionReason && <p className="mt-1 text-xs text-red-700">{right.rejectionReason}</p>}{["PENDING_VERIFICATION", "VERIFIED"].includes(right.status) && <Button className="mt-2" size="sm" variant="outline" onClick={() => setChangeRight(right)}><Edit3 className="size-4" />{right.status === "PENDING_VERIFICATION" ? "Edit pending claim" : "Request change"}</Button>}</div>; })}</div>}</div>
        <div className="mt-4 border-t pt-4"><p className="text-xs font-bold uppercase text-slate-500">Listings</p>{linkedListings.length === 0 ? <p className="mt-2 text-xs text-slate-500">No listing yet.</p> : <div className="mt-2 space-y-2">{linkedListings.map((listing) => <ListingRow key={listing.id} listing={listing} refresh={refreshAll} />)}</div>}</div>
        <div className="mt-5 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setEditResource(resource)}><Edit3 className="size-4" />Edit</Button><Button size="sm" variant="outline" disabled={blocksNewClaim} onClick={() => setRightResource(resource)}><Scale className="size-4" />{blocksNewClaim ? "Active claim exists" : "Claim right"}</Button><Button size="sm" variant="outline" onClick={() => setAvailabilityResource(resource)}><CalendarClock className="size-4" />Availability</Button></div>
      </article>;
    })}</div>}
    <ListingForm rights={propertyRights} refresh={refreshAll} />
    {editResource && <ResourceEditForm resource={editResource} close={() => setEditResource(null)} refresh={refreshAll} />}
    {rightResource && <RightClaimForm resource={rightResource} close={() => setRightResource(null)} refresh={refreshAll} />}
    {changeRight && <RightChangeForm right={changeRight} close={() => setChangeRight(null)} refresh={refreshAll} />}
    {availabilityResource && <AvailabilityEditor resource={availabilityResource} close={() => setAvailabilityResource(null)} />}
    <AlertDialog open={!!deleteResource} onOpenChange={(open) => { if (!open) setDeleteResource(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete parking resource?</AlertDialogTitle><AlertDialogDescription>Resources with unfinished bookings cannot be deleted. This action removes the resource from future marketplace use.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={remove.isPending} onClick={() => deleteResource && remove.mutate(deleteResource.id)}>{remove.isPending ? <Loader2 className="size-4 animate-spin" /> : "Delete"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </section>;
}

function ResourceEditForm({ resource, close, refresh }: { resource: ParkingResourceDto; close: () => void; refresh: () => Promise<void> }) {
  const [vehicles, setVehicles] = useState<VehicleType[]>(resource.supportedVehicleTypes);
  const mutation = useMutation({ mutationFn: (input: Parameters<typeof parkingResourcesApi.update>[1]) => parkingResourcesApi.update(resource.id, input), onSuccess: async () => { toast.success("Parking resource updated"); close(); await refresh(); }, onError: (error) => toast.error(getApiErrorMessage(error)) });
  return <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-center justify-between"><h3 className="font-bold">Edit {resource.displayName}</h3><Button variant="ghost" onClick={close}>Close</Button></div><form className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); mutation.mutate({ displayName: String(data.get("displayName")), floor: String(data.get("floor") || "") || null, zone: String(data.get("zone") || "") || null, capacity: resource.resourceType === "FIXED_SPACE" ? 1 : Number(data.get("capacity")), status: String(data.get("status")) as ParkingResourceDto["status"], supportedVehicleTypes: vehicles, isCovered: data.get("isCovered") === "on", hasCctv: data.get("hasCctv") === "on", hasGuard: data.get("hasGuard") === "on", maxHeightCm: data.get("maxHeightCm") ? Number(data.get("maxHeightCm")) : null, maxWidthCm: data.get("maxWidthCm") ? Number(data.get("maxWidthCm")) : null, maxLengthCm: data.get("maxLengthCm") ? Number(data.get("maxLengthCm")) : null }); }}>
    <Field label="Display name"><Input name="displayName" defaultValue={resource.displayName ?? ""} minLength={2} maxLength={120} required /></Field><Field label="Floor"><Input name="floor" defaultValue={resource.floor ?? ""} maxLength={40} /></Field><Field label="Zone"><Input name="zone" defaultValue={resource.zone ?? ""} maxLength={60} /></Field>{resource.resourceType === "SHARED_POOL" && <Field label="Capacity"><Input name="capacity" type="number" defaultValue={resource.capacity} min={1} max={1000} /></Field>}<Field label="Status"><select name="status" defaultValue={resource.status} className="h-10 w-full rounded-md border bg-white px-3 text-sm">{["ACTIVE", "BLOCKED", "MAINTENANCE", "INACTIVE"].map((status) => <option key={status}>{status}</option>)}</select></Field><Field label="Max height (cm)"><Input name="maxHeightCm" type="number" min={100} max={1000} defaultValue={resource.maxHeightCm ?? ""} /></Field><Field label="Max width (cm)"><Input name="maxWidthCm" type="number" min={100} max={1000} defaultValue={resource.maxWidthCm ?? ""} /></Field><Field label="Max length (cm)"><Input name="maxLengthCm" type="number" min={100} max={3000} defaultValue={resource.maxLengthCm ?? ""} /></Field>
    <div className="sm:col-span-2 lg:col-span-4"><p className="mb-2 text-xs font-semibold">Compatible vehicles</p>{VEHICLES.map((vehicle) => <label key={vehicle} className="mr-4 inline-flex items-center gap-2 text-xs"><Checkbox checked={vehicles.includes(vehicle)} onCheckedChange={(checked) => setVehicles((current) => checked ? [...current, vehicle] : current.filter((item) => item !== vehicle))} />{vehicle}</label>)}</div><div className="flex flex-wrap gap-4 sm:col-span-2 lg:col-span-4"><label className="flex gap-2 text-xs"><Checkbox name="isCovered" defaultChecked={resource.isCovered} />Covered</label><label className="flex gap-2 text-xs"><Checkbox name="hasCctv" defaultChecked={resource.hasCctv} />CCTV</label><label className="flex gap-2 text-xs"><Checkbox name="hasGuard" defaultChecked={resource.hasGuard} />Guard</label></div><Button type="submit" disabled={mutation.isPending || vehicles.length === 0}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Save changes</Button>
  </form></div>;
}

function ResourceForm({ propertyId, onDone }: { propertyId: string; onDone: () => Promise<void> }) {
  const [type, setType] = useState<ParkingResourceType>("FIXED_SPACE");
  const [vehicles, setVehicles] = useState<VehicleType[]>(["SEDAN"]);
  const mutation = useMutation({ mutationFn: (input: CreateParkingResourceInput) => parkingResourcesApi.create(propertyId, input), onSuccess: async () => { toast.success("Parking resource created"); await onDone(); }, onError: (error) => toast.error(getApiErrorMessage(error)) });
  return <form className="grid gap-4 rounded-lg border bg-slate-50 p-5 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); mutation.mutate({ type, displayName: String(data.get("displayName")), ...(type === "FIXED_SPACE" ? { spotCode: String(data.get("spotCode")) } : {}), floor: String(data.get("floor") || "") || undefined, zone: String(data.get("zone") || "") || undefined, capacity: type === "FIXED_SPACE" ? 1 : Number(data.get("capacity")), supportedVehicleTypes: vehicles, isCovered: data.get("isCovered") === "on", hasCctv: data.get("hasCctv") === "on", hasGuard: data.get("hasGuard") === "on", maxHeightCm: data.get("maxHeightCm") ? Number(data.get("maxHeightCm")) : undefined, maxWidthCm: data.get("maxWidthCm") ? Number(data.get("maxWidthCm")) : undefined, maxLengthCm: data.get("maxLengthCm") ? Number(data.get("maxLengthCm")) : undefined }); }}>
    <Field label="Resource type"><Select value={type} onValueChange={(value) => value && setType(value as ParkingResourceType)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="FIXED_SPACE">Fixed space</SelectItem><SelectItem value="SHARED_POOL">Shared pool</SelectItem></SelectContent></Select></Field>
    <Field label="Display name"><Input name="displayName" minLength={2} maxLength={120} required /></Field>
    {type === "FIXED_SPACE" ? <Field label="Spot code"><Input name="spotCode" maxLength={30} required /></Field> : <Field label="Capacity"><Input name="capacity" type="number" min={1} max={1000} defaultValue={1} required /></Field>}
    <Field label="Floor"><Input name="floor" maxLength={40} /></Field><Field label="Zone"><Input name="zone" maxLength={60} /></Field><Field label="Max height (cm)"><Input name="maxHeightCm" type="number" min={100} max={1000} /></Field><Field label="Max width (cm)"><Input name="maxWidthCm" type="number" min={100} max={1000} /></Field><Field label="Max length (cm)"><Input name="maxLengthCm" type="number" min={100} max={3000} /></Field>
    <div className="sm:col-span-2 lg:col-span-4"><p className="mb-2 text-xs font-semibold">Compatible vehicles</p><div className="flex flex-wrap gap-4">{VEHICLES.map((vehicle) => <label key={vehicle} className="flex items-center gap-2 text-xs"><Checkbox checked={vehicles.includes(vehicle)} onCheckedChange={(checked) => setVehicles((current) => checked ? [...current, vehicle] : current.filter((item) => item !== vehicle))} />{vehicle}</label>)}</div></div>
    <div className="flex flex-wrap gap-4 sm:col-span-2 lg:col-span-4">{[["isCovered", "Covered"], ["hasCctv", "CCTV"], ["hasGuard", "Guard"]].map(([name, label]) => <label key={name} className="flex items-center gap-2 text-xs"><Checkbox name={name} />{label}</label>)}</div>
    <Button type="submit" disabled={mutation.isPending || vehicles.length === 0} className="sm:col-span-2 lg:col-span-1">{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Create resource</Button>
  </form>;
}

type BulkRowError = { index: number; spotCode: string; code: string; message: string };

function BulkResourceForm({ propertyId, existingResources, onDone }: {
  propertyId: string;
  existingResources: ParkingResourceDto[];
  onDone: (createdIds: string[]) => Promise<void>;
}) {
  const [mode, setMode] = useState<"pattern" | "paste" | "range">("pattern");
  const [prefix, setPrefix] = useState("A");
  const [resourceName, setResourceName] = useState("Basement Zone A");
  const [displayPrefix, setDisplayPrefix] = useState("Parking space");
  const [startNumber, setStartNumber] = useState(1);
  const [endNumber, setEndNumber] = useState(10);
  const [separator, setSeparator] = useState("-");
  const [padding, setPadding] = useState(2);
  const [pasteList, setPasteList] = useState("");
  const [rangeStart, setRangeStart] = useState("A-01");
  const [rangeEnd, setRangeEnd] = useState("A-20");
  const [spaces, setSpaces] = useState<Array<{ displayName: string; spotCode: string }>>(() => Array.from({ length: 10 }, (_, index) => ({ spotCode: `A-${String(index + 1).padStart(2, "0")}`, displayName: `Parking space A-${String(index + 1).padStart(2, "0")}` })));
  const [floor, setFloor] = useState("");
  const [zone, setZone] = useState("");
  const [vehicles, setVehicles] = useState<VehicleType[]>(["SEDAN"]);
  const [isCovered, setIsCovered] = useState(false);
  const [hasCctv, setHasCctv] = useState(false);
  const [hasGuard, setHasGuard] = useState(false);
  const [serverErrors, setServerErrors] = useState<BulkRowError[]>([]);
  const normalizeCode = normalizePreviewSpotCode;
  const existingCodes = useMemo(
    () => new Set(existingResources.flatMap((resource) => [
      ...(resource.spotCode ? [normalizePreviewSpotCode(resource.spotCode)] : []),
      ...(resource.units ?? []).map((unit) => normalizePreviewSpotCode(unit.spotCode)),
    ])),
    [existingResources],
  );
  const previewErrors = spaces.flatMap((space, index) => {
    const errors: BulkRowError[] = [];
    const normalized = normalizePreviewSpotCode(space.spotCode);
    if (!space.spotCode.trim()) errors.push({ index, spotCode: space.spotCode, code: "SPOT_CODE_REQUIRED", message: "A spot code is required" });
    if (spaces.some((other, otherIndex) => otherIndex < index && normalizePreviewSpotCode(other.spotCode) === normalized)) errors.push({ index, spotCode: space.spotCode, code: "DUPLICATE_IN_REQUEST", message: "Duplicate spot code after normalization" });
    if (existingCodes.has(normalized)) errors.push({ index, spotCode: space.spotCode, code: "ALREADY_EXISTS", message: "This spot code already exists at the Property" });
    if (space.displayName.trim().length < 2) errors.push({ index, spotCode: space.spotCode, code: "DISPLAY_NAME_INVALID", message: "Display name must contain at least 2 characters" });
    return errors;
  });
  const rowErrors = [...previewErrors, ...serverErrors];
  const invalidRows = new Set(rowErrors.map((error) => error.index));
  const mutation = useMutation({
    mutationFn: (input: BulkParkingResourceInput) => parkingResourcesApi.createBulk(propertyId, input),
    onSuccess: async (result) => {
      toast.success(`${result.createdCount} parking spaces added successfully. Next, claim one Parking Right for the resource.`);
      setServerErrors([]);
      await onDone(result.resources.map((resource) => resource.id));
    },
    onError: (error) => {
      if (error instanceof ApiError && error.details && typeof error.details === "object" && "errors" in error.details) {
        const errors = (error.details as { errors?: unknown }).errors;
        if (Array.isArray(errors)) setServerErrors(errors.filter((item): item is BulkRowError => item !== null && typeof item === "object" && "index" in item && "spotCode" in item && "code" in item && "message" in item));
      }
      toast.error(getApiErrorMessage(error));
    },
  });

  function generatePreview() {
    setServerErrors([]);
    let codes: string[] = [];
    if (mode === "paste") codes = pasteList.split(/\r?\n|,/).map((value) => value.trim()).filter(Boolean);
    if (mode === "pattern") {
      const start = Math.max(0, Math.floor(startNumber)); const end = Math.max(start, Math.floor(endNumber));
      codes = Array.from({ length: Math.min(100, end - start + 1) }, (_, index) => `${prefix.trim().toUpperCase()}${separator}${String(start + index).padStart(Math.min(6, Math.max(1, padding)), "0")}`);
    }
    if (mode === "range") {
      const start = rangeStart.trim().match(/^(.*?)(\d+)$/); const end = rangeEnd.trim().match(/^(.*?)(\d+)$/);
      if (!start || !end || start[1]?.toUpperCase() !== end[1]?.toUpperCase()) { toast.error("Quick range must share one prefix, for example A-01 to A-20"); return; }
      const first = Number(start[2]); const last = Number(end[2]); if (last < first || last - first + 1 > 100) { toast.error("Quick range must contain 1 to 100 spaces"); return; }
      codes = Array.from({ length: last - first + 1 }, (_, index) => `${start[1]}${String(first + index).padStart(start[2]!.length, "0")}`);
    }
    if (!codes.length || codes.length > 100) { toast.error("Generate between 1 and 100 parking spaces"); return; }
    setSpaces(codes.map((spotCode) => ({ spotCode, displayName: `${displayPrefix.trim()} ${spotCode}`.trim() })));
  }

  function submit() {
    setServerErrors([]);
    if (previewErrors.length > 0 || vehicles.length === 0 || spaces.length === 0) return;
    const resource: BulkParkingResourceInput["resource"] = {
      type: "FIXED_SPACE",
      displayName: resourceName.trim(),
      supportedVehicleTypes: vehicles,
      isCovered,
      hasCctv,
      hasGuard,
      ...(floor.trim() ? { floor: floor.trim() } : {}),
      ...(zone.trim() ? { zone: zone.trim() } : {}),
    };
    mutation.mutate({ resource, units: spaces });
  }

  return <section className="border border-emerald-200 bg-emerald-50 p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold">Bulk fixed-space setup</h3><p className="mt-1 text-xs text-emerald-900">All rows are validated and created in one transaction. If any row fails, none are created.</p></div><span className="text-xs font-semibold">{spaces.length} spaces</span></div>
    <div className="mt-4 flex gap-2">{(["pattern", "paste", "range"] as const).map((item) => <Button key={item} size="sm" variant={mode === item ? "default" : "outline"} onClick={() => setMode(item)}>{item === "pattern" ? "Pattern" : item === "paste" ? "Paste list" : "Quick range"}</Button>)}</div>
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Field label="Resource name"><Input value={resourceName} minLength={2} maxLength={120} onChange={(event) => setResourceName(event.target.value)} /></Field><Field label="Unit display-name prefix"><Input value={displayPrefix} minLength={2} maxLength={80} onChange={(event) => setDisplayPrefix(event.target.value)} /></Field>{mode === "pattern" && <><Field label="Spot-code prefix"><Input value={prefix} maxLength={20} onChange={(event) => setPrefix(event.target.value)} placeholder="A" /></Field><Field label="Start"><Input type="number" min={0} max={9999} value={startNumber} onChange={(event) => setStartNumber(Number(event.target.value))} /></Field><Field label="End"><Input type="number" min={0} max={9999} value={endNumber} onChange={(event) => setEndNumber(Number(event.target.value))} /></Field><Field label="Separator"><Input value={separator} maxLength={3} onChange={(event) => setSeparator(event.target.value)} /></Field><Field label="Number padding"><Input type="number" min={1} max={6} value={padding} onChange={(event) => setPadding(Number(event.target.value))} /></Field></>}{mode === "paste" && <div className="sm:col-span-2 lg:col-span-3"><Field label="One spot code per line"><Textarea className="min-h-28 bg-white font-mono text-xs" value={pasteList} onChange={(event) => setPasteList(event.target.value)} placeholder={"A-01\nA-02\nB-01"} /></Field></div>}{mode === "range" && <><Field label="First code"><Input value={rangeStart} onChange={(event) => setRangeStart(event.target.value)} /></Field><Field label="Last code"><Input value={rangeEnd} onChange={(event) => setRangeEnd(event.target.value)} /></Field></>}<Field label="Floor"><Input value={floor} maxLength={40} onChange={(event) => setFloor(event.target.value)} /></Field><Field label="Zone"><Input value={zone} maxLength={60} onChange={(event) => setZone(event.target.value)} /></Field><div className="flex items-end"><Button type="button" variant="outline" onClick={generatePreview}>Generate preview</Button></div></div>
    <div className="mt-4"><p className="mb-2 text-xs font-semibold">Compatible vehicles</p><div className="flex flex-wrap gap-4">{VEHICLES.map((vehicle) => <label key={vehicle} className="flex items-center gap-2 text-xs"><Checkbox checked={vehicles.includes(vehicle)} onCheckedChange={(checked) => setVehicles((current) => checked ? current.includes(vehicle) ? current : [...current, vehicle] : current.filter((item) => item !== vehicle))} />{vehicle}</label>)}</div></div>
    <div className="mt-4 flex flex-wrap gap-4">{[["Covered", isCovered, setIsCovered], ["CCTV", hasCctv, setHasCctv], ["Guard", hasGuard, setHasGuard]].map(([label, checked, setter]) => <label key={String(label)} className="flex items-center gap-2 text-xs"><Checkbox checked={Boolean(checked)} onCheckedChange={(value) => (setter as (next: boolean) => void)(value === true)} />{String(label)}</label>)}</div>
    <div className="mt-5 max-h-80 overflow-auto border border-emerald-200 bg-white"><table className="w-full min-w-[720px] text-left text-xs"><thead className="sticky top-0 bg-slate-50"><tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Spot code</th><th className="px-3 py-2">Normalized</th><th className="px-3 py-2">Display name</th><th className="px-3 py-2">Floor / Zone</th><th className="px-3 py-2">Vehicles</th><th className="px-3 py-2">Validation</th><th className="px-3 py-2"></th></tr></thead><tbody className="divide-y">{spaces.map((space, index) => { const errors = rowErrors.filter((error) => error.index === index); return <tr key={index} className={invalidRows.has(index) ? "bg-red-50" : ""}><td className="px-3 py-2">{index + 1}</td><td className="px-3 py-2"><Input className="h-8 min-w-24 font-mono text-xs" value={space.spotCode} onChange={(event) => setSpaces((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, spotCode: event.target.value } : row))} /></td><td className="px-3 py-2 font-mono">{normalizeCode(space.spotCode)}</td><td className="px-3 py-2"><Input className="h-8 min-w-36 text-xs" value={space.displayName} onChange={(event) => setSpaces((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, displayName: event.target.value } : row))} /></td><td className="px-3 py-2">{floor || "—"} / {zone || "—"}</td><td className="px-3 py-2">{vehicles.join(", ")}</td><td className={`px-3 py-2 ${errors.length ? "text-red-700" : "text-emerald-700"}`}>{errors.map((error) => error.message).join("; ") || "Ready"}</td><td className="px-3 py-2"><Button size="icon" variant="ghost" aria-label="Remove row" onClick={() => setSpaces((current) => current.filter((_row, rowIndex) => rowIndex !== index))}><Trash2 className="size-4" /></Button></td></tr>; })}</tbody></table></div>
    <Button className="mt-4" disabled={mutation.isPending || previewErrors.length > 0 || vehicles.length === 0 || spaces.length === 0} onClick={submit}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Create {spaces.length} spaces</Button>
  </section>;
}

function RightClaimForm({ resource, close, refresh }: { resource: ParkingResourceDto; close: () => void; refresh: () => Promise<void> }) {
  const [type, setType] = useState<ParkingRightType>("OWNERSHIP");
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<"OWNERSHIP_DOCUMENT" | "LEASE_AGREEMENT" | "OWNER_CONSENT" | "AUTHORIZATION_LETTER" | "PARKING_ALLOCATION" | "OTHER">("OWNERSHIP_DOCUMENT");
  const mutation = useMutation({ mutationFn: async (input: ParkingRightClaimInput) => { const right = await parkingRightsApi.claim(resource.id, input); if (files.length) { try { await parkingRightsApi.uploadDocuments({ rightId: right.id }, category, files); } catch (error) { toast.warning(`Claim submitted, but evidence upload failed: ${getApiErrorMessage(error)}`); } } return right; }, onSuccess: async () => { toast.success("Parking-right claim submitted"); close(); await refresh(); }, onError: (error) => toast.error(getApiErrorMessage(error)) });
  const commercial = type !== "USE_ONLY";
  return <div className="rounded-lg border border-blue-200 bg-blue-50 p-5"><div className="flex items-center justify-between"><h3 className="font-bold">Claim right for {resource.displayName}</h3><Button variant="ghost" onClick={close}>Close</Button></div><p className="mt-2 text-xs text-blue-900">Use-only rights cannot create commercial listings. Commercial lease and authorized operation rights still require Admin verification and explicit commercial permissions.</p><form className="mt-4 grid gap-4 sm:grid-cols-3" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const validFrom = String(data.get("validFrom") || ""); const validUntil = String(data.get("validUntil") || ""); mutation.mutate({ rightType: type, quantity: Number(data.get("quantity")), canUse: true, canList: commercial && data.get("canList") === "on", canSetPrice: commercial && data.get("canSetPrice") === "on", canManageBookings: commercial && data.get("canManageBookings") === "on", canDelegateManager: data.get("canDelegateManager") === "on", ...(validFrom ? { validFrom: toUtcFromBangladeshLocal(validFrom) } : {}), ...(validUntil ? { validUntil: toUtcFromBangladeshLocal(validUntil) } : {}) }); }}>
      <Field label="Right type"><Select value={type} onValueChange={(value) => value && setType(value as ParkingRightType)}><SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger><SelectContent>{(["OWNERSHIP", "USE_ONLY", "COMMERCIAL_LEASE", "AUTHORIZED_OPERATION"] as const).map((item) => <SelectItem key={item} value={item}>{item.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select></Field><Field label="Quantity"><Input className="bg-white" name="quantity" type="number" min={1} max={resource.capacity} defaultValue={resource.resourceType === "FIXED_SPACE" ? resource.capacity : 1} readOnly={resource.resourceType === "FIXED_SPACE"} /></Field><Field label="Valid from (optional)"><Input className="bg-white" name="validFrom" type="datetime-local" /></Field><Field label="Valid until (optional)"><Input className="bg-white" name="validUntil" type="datetime-local" /></Field>
      <div className="space-y-2 sm:col-span-3">{[["canList", "Commercial listing"], ["canSetPrice", "Set price"], ["canManageBookings", "Manage bookings"], ["canDelegateManager", "Delegate Manager"]].map(([name, label]) => <label key={name} className="mr-5 inline-flex items-center gap-2 text-xs"><Checkbox name={name} disabled={!commercial && name !== "canDelegateManager"} />{label}</label>)}</div><Field label="Evidence category"><select className="h-10 w-full border bg-white px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value as typeof category)}>{["OWNERSHIP_DOCUMENT", "LEASE_AGREEMENT", "OWNER_CONSENT", "AUTHORIZATION_LETTER", "PARKING_ALLOCATION", "OTHER"].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Optional supporting documents"><Input className="bg-white" type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 5))} /><small className="block font-normal text-slate-500">Optional, but may help Admin verify your Parking Right faster. Maximum 5 files, 10 MB each.</small></Field><div className="flex items-end"><Button type="submit" disabled={mutation.isPending}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Submit claim</Button></div>
    </form></div>;
}

function BulkRightClaimForm({ propertyId, resourceIds, close, onDone }: { propertyId: string; resourceIds: string[]; close: () => void; onDone: () => Promise<void> }) {
  const [type, setType] = useState<ParkingRightType>("OWNERSHIP");
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<"OWNERSHIP_DOCUMENT" | "LEASE_AGREEMENT" | "OWNER_CONSENT" | "AUTHORIZATION_LETTER" | "PARKING_ALLOCATION" | "OTHER">("PARKING_ALLOCATION");
  const mutation = useMutation({
    mutationFn: async (input: ParkingRightClaimInput) => {
      const result = await parkingRightsApi.createBatch(propertyId, { ...input, resourceIds });
      if (files.length) { try { await parkingRightsApi.uploadDocuments({ batchId: result.batch.id }, category, files); } catch (error) { toast.warning(`Batch submitted, but evidence upload failed: ${getApiErrorMessage(error)}`); } }
      return result;
    },
    onSuccess: async () => { toast.success(`${resourceIds.length} Parking Right claims submitted as one batch`); await onDone(); },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  const commercial = type !== "USE_ONLY";
  return <section className="border-y border-blue-200 bg-blue-50 py-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">Claim {resourceIds.length} Parking Rights</h3><p className="mt-1 text-xs text-blue-900">One submission creates an independently auditable claim for each selected space.</p></div><Button variant="ghost" onClick={close}>Close</Button></div><form className="mt-4 grid gap-4 sm:grid-cols-3" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const validFrom = String(data.get("validFrom") || ""); const validUntil = String(data.get("validUntil") || ""); mutation.mutate({ rightType: type, quantity: 1, canUse: true, canList: commercial && data.get("canList") === "on", canSetPrice: commercial && data.get("canSetPrice") === "on", canManageBookings: commercial && data.get("canManageBookings") === "on", canDelegateManager: data.get("canDelegateManager") === "on", ...(validFrom ? { validFrom: toUtcFromBangladeshLocal(validFrom) } : {}), ...(validUntil ? { validUntil: toUtcFromBangladeshLocal(validUntil) } : {}) }); }}><Field label="Right type"><Select value={type} onValueChange={(value) => value && setType(value as ParkingRightType)}><SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger><SelectContent>{(["OWNERSHIP", "USE_ONLY", "COMMERCIAL_LEASE", "AUTHORIZED_OPERATION"] as const).map((item) => <SelectItem key={item} value={item}>{item.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select></Field><Field label="Valid from"><Input className="bg-white" name="validFrom" type="datetime-local" /></Field><Field label="Valid until"><Input className="bg-white" name="validUntil" type="datetime-local" /></Field><div className="space-y-2 sm:col-span-3">{[["canList", "Commercial listing"], ["canSetPrice", "Set price"], ["canManageBookings", "Manage bookings"], ["canDelegateManager", "Delegate Manager"]].map(([name, label]) => <label key={name} className="mr-5 inline-flex items-center gap-2 text-xs"><Checkbox name={name} disabled={!commercial && name !== "canDelegateManager"} />{label}</label>)}</div><Field label="Evidence category"><select className="h-10 w-full border bg-white px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value as typeof category)}>{["OWNERSHIP_DOCUMENT", "LEASE_AGREEMENT", "OWNER_CONSENT", "AUTHORIZATION_LETTER", "PARKING_ALLOCATION", "OTHER"].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Optional evidence"><Input className="bg-white" type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 5))} /><small className="block font-normal text-slate-500">Optional; up to 5 files, 10 MB each.</small></Field><div className="flex items-end"><Button type="submit" disabled={mutation.isPending || resourceIds.length < 2}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Submit batch claim</Button></div></form></section>;
}

function RightChangeForm({ right, close, refresh }: { right: ParkingRightDto; close: () => void; refresh: () => Promise<void> }) {
  const pending = right.status === "PENDING_VERIFICATION";
  const [type, setType] = useState<ParkingRightType>(right.rightType);
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<ParkingRightDocumentDto["category"]>("OWNERSHIP_DOCUMENT");
  const mutation = useMutation({
    mutationFn: async (changes: ParkingRightChangeInput) => {
      let amendmentId: string | undefined;
      if (pending) {
        if (Object.keys(changes).length > 0) {
          await parkingRightsApi.updatePending(right.id, { ...changes, expectedVersion: right.version });
        }
      } else {
        const amendment = await parkingRightsApi.createAmendment(right.id, {
          expectedVersion: right.version,
          proposedChanges: changes,
        });
        amendmentId = amendment.id;
      }

      if (files.length > 0) {
        try {
          if (pending) {
            await parkingRightsApi.uploadDocuments({ rightId: right.id }, category, files);
          } else if (amendmentId) {
            await parkingRightsApi.uploadDocuments({ amendmentId }, category, files);
          }
        } catch (error) {
          toast.warning(`Changes were submitted, but evidence upload failed: ${getApiErrorMessage(error)}`);
        }
      }
    },
    onSuccess: async () => {
      toast.success(pending ? "Pending claim updated" : "Parking Right change request submitted");
      close();
      await refresh();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  const removeDocument = useMutation({
    mutationFn: parkingRightsApi.removeDocument,
    onSuccess: async () => {
      toast.success("Evidence removed");
      close();
      await refresh();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  const commercial = type !== "USE_ONLY";

  async function downloadDocument(documentId: string) {
    try {
      const download = await parkingRightsApi.documentDownload(documentId);
      window.open(download.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = {
      rightType: type,
      quantity: Number(data.get("quantity")),
      canUse: true,
      canList: commercial && data.get("canList") === "on",
      canSetPrice: commercial && data.get("canSetPrice") === "on",
      canManageBookings: commercial && data.get("canManageBookings") === "on",
      canDelegateManager: data.get("canDelegateManager") === "on",
      validFrom: toUtcFromBangladeshLocal(String(data.get("validFrom"))),
      validUntil: data.get("validUntil") ? toUtcFromBangladeshLocal(String(data.get("validUntil"))) : null,
    };
    const changes: ParkingRightChangeInput = {};
    if (next.rightType !== right.rightType) changes.rightType = next.rightType;
    if (next.quantity !== right.quantity) changes.quantity = next.quantity;
    if (next.canUse !== right.canUse) changes.canUse = next.canUse;
    if (next.canList !== right.canList) changes.canList = next.canList;
    if (next.canSetPrice !== right.canSetPrice) changes.canSetPrice = next.canSetPrice;
    if (next.canManageBookings !== right.canManageBookings) changes.canManageBookings = next.canManageBookings;
    if (next.canDelegateManager !== right.canDelegateManager) changes.canDelegateManager = next.canDelegateManager;
    if (new Date(next.validFrom).getTime() !== new Date(right.validFrom).getTime()) changes.validFrom = next.validFrom;
    if ((next.validUntil ? new Date(next.validUntil).getTime() : null) !== (right.validUntil ? new Date(right.validUntil).getTime() : null)) changes.validUntil = next.validUntil;
    if (Object.keys(changes).length === 0 && (!pending || files.length === 0)) {
      toast.error(pending ? "Change a field or add evidence before submitting" : "Change at least one field before submitting");
      return;
    }
    mutation.mutate(changes);
  }

  const documents = pending ? right.documents ?? [] : [];
  const remainingDocumentSlots = Math.max(0, 5 - documents.length);

  return <section className="border border-blue-200 bg-blue-50 p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold">{pending ? "Edit pending Parking Right claim" : "Request a Parking Right change"}</h3><p className="mt-1 text-xs text-blue-900">{pending ? "Saving updates the same claim and increments its version." : "The currently verified Right stays active while Admin reviews this request."}</p></div><Button variant="ghost" onClick={close}>Close</Button></div>
    <form className="mt-4 grid gap-4 sm:grid-cols-3" onSubmit={submit}>
      <Field label="Right type"><Select value={type} onValueChange={(value) => value && setType(value as ParkingRightType)}><SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger><SelectContent>{(["OWNERSHIP", "USE_ONLY", "COMMERCIAL_LEASE", "AUTHORIZED_OPERATION"] as const).map((item) => <SelectItem key={item} value={item}>{item.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select></Field>
      <Field label="Quantity"><Input className="bg-white" name="quantity" type="number" min={1} max={right.parkingSpot?.capacity ?? 1000} defaultValue={right.quantity} required /></Field>
      <Field label="Valid from"><Input className="bg-white" name="validFrom" type="datetime-local" defaultValue={toDhakaLocalInput(right.validFrom)} required /></Field>
      <Field label="Valid until (optional)"><Input className="bg-white" name="validUntil" type="datetime-local" defaultValue={right.validUntil ? toDhakaLocalInput(right.validUntil) : ""} /></Field>
      <div className="space-y-2 sm:col-span-3">{[["canList", "Commercial listing", right.canList], ["canSetPrice", "Set price", right.canSetPrice], ["canManageBookings", "Manage bookings", right.canManageBookings], ["canDelegateManager", "Delegate Manager", right.canDelegateManager]].map(([name, label, checked]) => <label key={String(name)} className="mr-5 inline-flex items-center gap-2 text-xs"><Checkbox name={String(name)} defaultChecked={Boolean(checked)} disabled={!commercial && name !== "canDelegateManager"} />{String(label)}</label>)}</div>
      <Field label="Evidence category"><select className="h-10 w-full border bg-white px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value as ParkingRightDocumentDto["category"])}>{["OWNERSHIP_DOCUMENT", "LEASE_AGREEMENT", "OWNER_CONSENT", "AUTHORIZATION_LETTER", "PARKING_ALLOCATION", "OTHER"].map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></Field>
      <Field label={pending ? "Add evidence" : "Amendment evidence"}><Input className="bg-white" type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" disabled={remainingDocumentSlots === 0} onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, pending ? remainingDocumentSlots : 5))} /><small className="block font-normal text-slate-500">PDF, JPEG, PNG or WebP; maximum 5 files, 10 MB each.</small></Field>
      <div className="flex items-end"><Button type="submit" disabled={mutation.isPending}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}{pending ? "Save claim changes" : "Submit change request"}</Button></div>
      {documents.length > 0 && <div className="sm:col-span-3"><p className="mb-2 text-xs font-bold uppercase text-slate-600">Current evidence</p><div className="space-y-2">{documents.map((document) => <div key={document.id} className="flex flex-wrap items-center justify-between gap-2 border bg-white p-3 text-xs"><div><p className="font-semibold">{document.originalName}</p><p className="text-slate-500">{document.category.replaceAll("_", " ")} · {(document.sizeBytes / 1024 / 1024).toFixed(2)} MB</p></div><div className="flex gap-1"><Button type="button" size="icon" variant="ghost" title="Download evidence" aria-label={`Download ${document.originalName}`} onClick={() => void downloadDocument(document.id)}><Download className="size-4" /></Button><Button type="button" size="icon" variant="ghost" title="Remove evidence" aria-label={`Remove ${document.originalName}`} disabled={removeDocument.isPending} onClick={() => removeDocument.mutate(document.id)}><Trash2 className="size-4 text-red-600" /></Button></div></div>)}</div></div>}
    </form>
  </section>;
}

function ListingForm({ rights, refresh }: { rights: Array<import("@/lib/api/marketplace-types").ParkingRightDto>; refresh: () => Promise<void> }) {
  const eligible = rights.filter((right) => right.status === "VERIFIED" && right.canList && right.canSetPrice);
  const [open, setOpen] = useState(false); const [vehicles, setVehicles] = useState<VehicleType[]>(["SEDAN"]);
  const [selectedRightId, setSelectedRightId] = useState("");
  const selectedRight = eligible.find((right) => right.id === selectedRightId) ?? eligible[0];
  const mutation = useMutation({ mutationFn: listingsApi.create, onSuccess: async () => { toast.success("Draft listing created"); setOpen(false); await refresh(); }, onError: (error) => toast.error(getApiErrorMessage(error)) });
  return <div className="border-t pt-5"><div className="flex items-center justify-between"><div><h3 className="font-bold">Commercial listings</h3><p className="text-xs text-slate-500">{eligible.length} verified right(s) can create listings.</p></div><Button variant="outline" disabled={eligible.length === 0} onClick={() => setOpen((value) => !value)}><Plus className="size-4" />New listing</Button></div>{open && <form className="mt-4 grid gap-4 rounded-lg border bg-white p-5 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const unitId = String(data.get("unitId") || ""); mutation.mutate({ parkingRightId: String(data.get("rightId")), ...(unitId ? { parkingResourceUnitId: unitId } : {}), title: String(data.get("title")), description: String(data.get("description") || "") || undefined, pricePerHourPaisa: String(Math.round(Number(data.get("hourlyRate")) * 100)), minDurationMinutes: Number(data.get("minimum")), maxDurationMinutes: Number(data.get("maximum")), securityDepositPaisa: String(Math.round(Number(data.get("deposit")) * 100)), allowedVehicleTypes: vehicles }); }}>
      <Field label="Verified right"><select name="rightId" required value={selectedRight?.id ?? ""} onChange={(event) => setSelectedRightId(event.target.value)} className="h-10 w-full rounded-md border bg-white px-3 text-sm">{eligible.map((right) => <option key={right.id} value={right.id}>{right.parkingSpot?.displayName ?? right.rightType} · Qty {right.quantity}</option>)}</select></Field>{selectedRight?.parkingSpot?.resourceType === "FIXED_SPACE" && <Field label="Listing scope"><select name="unitId" className="h-10 w-full rounded-md border bg-white px-3 text-sm"><option value="">Entire resource (recommended)</option>{selectedRight.parkingSpot.units?.map((unit) => <option key={unit.id} value={unit.id}>{unit.spotCode}{unit.displayName ? ` · ${unit.displayName}` : ""}</option>)}</select></Field>}<Field label="Title"><Input name="title" minLength={3} maxLength={150} required /></Field><Field label="Price per hour (BDT)"><Input name="hourlyRate" type="number" min="0.01" step="0.01" required /></Field><Field label="Deposit (BDT)"><Input name="deposit" type="number" min="0" step="0.01" defaultValue="0" required /></Field><Field label="Minimum minutes"><Input name="minimum" type="number" min={15} max={1440} defaultValue={60} required /></Field><Field label="Maximum minutes"><Input name="maximum" type="number" min={15} max={10080} defaultValue={720} required /></Field><Field label="Description"><Textarea name="description" maxLength={3000} /></Field>
      <div><p className="mb-2 text-xs font-semibold">Allowed vehicles</p>{VEHICLES.map((vehicle) => <label key={vehicle} className="mr-3 inline-flex items-center gap-1 text-xs"><Checkbox checked={vehicles.includes(vehicle)} onCheckedChange={(checked) => setVehicles((current) => checked ? [...current, vehicle] : current.filter((item) => item !== vehicle))} />{vehicle}</label>)}</div><Button type="submit" disabled={mutation.isPending || vehicles.length === 0}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Create draft</Button>
    </form>}</div>;
}

function ListingRow({ listing, refresh }: { listing: import("@/lib/api/marketplace-types").ParkingListingDto; refresh: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleType[]>(listing.allowedVehicleTypes);
  const statusMutation = useMutation({ mutationFn: () => listing.status === "ACTIVE" ? listingsApi.pause(listing.id) : listingsApi.activate(listing.id), onSuccess: async () => { toast.success(listing.status === "ACTIVE" ? "Listing paused" : "Listing activated"); await refresh(); }, onError: (error) => toast.error(getApiErrorMessage(error)) });
  const updateMutation = useMutation({ mutationFn: (input: Parameters<typeof listingsApi.update>[1]) => listingsApi.update(listing.id, input), onSuccess: async () => { toast.success("Listing updated"); setEditing(false); await refresh(); }, onError: (error) => toast.error(getApiErrorMessage(error)) });
  const endMutation = useMutation({ mutationFn: () => listingsApi.end(listing.id), onSuccess: async () => { toast.success("Listing ended"); setConfirmEnd(false); await refresh(); }, onError: (error) => toast.error(getApiErrorMessage(error)) });

  return <div className="space-y-3 rounded-md border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold">{listing.title}</p><p className="text-xs text-slate-500">{formatBDTFromPaisa(listing.pricePerHourPaisa)}/hour</p></div><div className="flex flex-wrap items-center gap-2"><Status {...listingStatus[listing.status]} />{["ACTIVE", "DRAFT", "PAUSED"].includes(listing.status) && <Button size="sm" variant="outline" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate()}>{listing.status === "ACTIVE" ? "Pause" : "Activate"}</Button>}{["DRAFT", "PAUSED"].includes(listing.status) && <Button size="icon" variant="ghost" title="Edit listing" aria-label="Edit listing" onClick={() => setEditing((value) => !value)}><Edit3 className="size-4" /></Button>}{listing.status !== "ENDED" && <Button size="icon" variant="ghost" title="End listing" aria-label="End listing" onClick={() => setConfirmEnd(true)}><Trash2 className="size-4 text-red-600" /></Button>}</div></div>
    {editing && <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); updateMutation.mutate({ title: String(data.get("title")), description: String(data.get("description") || "") || undefined, pricePerHourPaisa: String(Math.round(Number(data.get("hourlyRate")) * 100)), minDurationMinutes: Number(data.get("minimum")), maxDurationMinutes: Number(data.get("maximum")), securityDepositPaisa: String(Math.round(Number(data.get("deposit")) * 100)), allowedVehicleTypes: vehicles }); }}><Field label="Title"><Input name="title" defaultValue={listing.title} minLength={3} maxLength={150} required /></Field><Field label="Price per hour (BDT)"><Input name="hourlyRate" type="number" min="0.01" step="0.01" defaultValue={Number(listing.pricePerHourPaisa) / 100} required /></Field><Field label="Deposit (BDT)"><Input name="deposit" type="number" min="0" step="0.01" defaultValue={Number(listing.securityDepositPaisa) / 100} required /></Field><Field label="Minimum minutes"><Input name="minimum" type="number" min={15} max={1440} defaultValue={listing.minDurationMinutes} required /></Field><Field label="Maximum minutes"><Input name="maximum" type="number" min={15} max={10080} defaultValue={listing.maxDurationMinutes} required /></Field><Field label="Description"><Textarea name="description" defaultValue={listing.description ?? ""} maxLength={3000} /></Field><div className="sm:col-span-2"><p className="mb-2 text-xs font-semibold">Allowed vehicles</p>{VEHICLES.map((vehicle) => <label key={vehicle} className="mr-3 inline-flex items-center gap-1 text-xs"><Checkbox checked={vehicles.includes(vehicle)} onCheckedChange={(checked) => setVehicles((current) => checked ? [...current, vehicle] : current.filter((item) => item !== vehicle))} />{vehicle}</label>)}</div><Button type="submit" disabled={updateMutation.isPending || vehicles.length === 0}>{updateMutation.isPending && <Loader2 className="size-4 animate-spin" />}Save listing</Button></form>}
    <AlertDialog open={confirmEnd} onOpenChange={setConfirmEnd}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>End this listing?</AlertDialogTitle><AlertDialogDescription>The listing will stop accepting new quotes and cannot be reactivated.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={endMutation.isPending} onClick={() => endMutation.mutate()}>{endMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "End listing"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

function AvailabilityEditor({ resource, close }: { resource: ParkingResourceDto; close: () => void }) {
  const query = useQuery({ queryKey: queryKeys.availability.byResource(resource.id), queryFn: () => parkingResourcesApi.availability(resource.id) });
  if (query.isPending) return <PanelState loading message="Loading availability" />;
  if (query.isError) return <PanelState message={getApiErrorMessage(query.error)} retry={() => void query.refetch()} />;
  return <AvailabilityEditorForm key={[...query.data.rules, ...query.data.exceptions].map((item) => item.id).join("|")} resource={resource} close={close} rules={query.data.rules} exceptions={query.data.exceptions} />;
}

function AvailabilityEditorForm({ resource, close, rules, exceptions }: { resource: ParkingResourceDto; close: () => void; rules: import("@/lib/api/marketplace-types").AvailabilityRuleDto[]; exceptions: import("@/lib/api/marketplace-types").AvailabilityExceptionDto[] }) {
  const client = useQueryClient();
  const initial = useMemo(() => DAYS.map((_, dayOfWeek) => {
    const dayRules = rules.filter((item) => item.dayOfWeek === dayOfWeek);
    return {
      enabled: dayRules.length > 0,
      ranges: dayRules.length > 0
        ? dayRules.map((rule) => ({
            start: rule.startLocalTime.slice(11, 16),
            end: rule.endLocalTime.slice(11, 16),
          }))
        : [{ start: "08:00", end: "22:00" }],
    };
  }), [rules]);
  const [draft, setDraft] = useState(initial);
  const save = useMutation({
    mutationFn: () => {
      const validFrom = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
      return parkingResourcesApi.replaceAvailability(
        resource.id,
        draft.flatMap((day, dayOfWeek) =>
          day.enabled
            ? day.ranges.map((range) => ({
                dayOfWeek,
                startLocalTime: range.start,
                endLocalTime: range.end,
                validFrom,
              }))
            : [],
        ),
      );
    },
    onSuccess: async () => {
      toast.success("Availability saved");
      await client.invalidateQueries({ queryKey: queryKeys.availability.byResource(resource.id) });
      await client.invalidateQueries({ queryKey: queryKeys.parkingSearch.root });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  const addException = useMutation({ mutationFn: (input: Parameters<typeof parkingResourcesApi.addException>[1]) => parkingResourcesApi.addException(resource.id, input), onSuccess: async () => { toast.success("Availability exception added"); await client.invalidateQueries({ queryKey: queryKeys.availability.byResource(resource.id) }); await client.invalidateQueries({ queryKey: queryKeys.parkingSearch.root }); }, onError: (error) => toast.error(getApiErrorMessage(error)) });
  return <div className="rounded-lg border bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-bold">Weekly availability · {resource.displayName}</h3><p className="text-xs text-slate-500">Bangladesh time (Asia/Dhaka)</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setDraft((current) => current.map((day, index) => index >= 1 && index <= 5 ? { enabled: current[1]!.enabled, ranges: current[1]!.ranges.map((range) => ({ ...range })) } : day))}>Copy Monday to weekdays</Button><Button variant="ghost" onClick={close}>Close</Button></div></div><div className="mt-4 space-y-3">{draft.map((day, dayIndex) => <div key={DAYS[dayIndex]} className="border-b pb-3 sm:grid sm:grid-cols-[8rem_1fr] sm:gap-3"><label className="flex h-10 items-center gap-2 text-xs font-semibold"><Checkbox checked={day.enabled} onCheckedChange={(checked) => setDraft((current) => current.map((entry, index) => index === dayIndex ? { ...entry, enabled: checked === true } : entry))} />{DAYS[dayIndex]}</label><div className="space-y-2">{day.ranges.map((range, rangeIndex) => <div key={rangeIndex} className="grid grid-cols-[1fr_1fr_auto] gap-2"><Input aria-label={`${DAYS[dayIndex]} range ${rangeIndex + 1} start`} type="time" value={range.start} disabled={!day.enabled} onChange={(event) => setDraft((current) => current.map((entry, index) => index === dayIndex ? { ...entry, ranges: entry.ranges.map((currentRange, currentIndex) => currentIndex === rangeIndex ? { ...currentRange, start: event.target.value } : currentRange) } : entry))} /><Input aria-label={`${DAYS[dayIndex]} range ${rangeIndex + 1} end`} type="time" value={range.end} disabled={!day.enabled} onChange={(event) => setDraft((current) => current.map((entry, index) => index === dayIndex ? { ...entry, ranges: entry.ranges.map((currentRange, currentIndex) => currentIndex === rangeIndex ? { ...currentRange, end: event.target.value } : currentRange) } : entry))} /><Button type="button" size="sm" variant="ghost" disabled={day.ranges.length === 1} onClick={() => setDraft((current) => current.map((entry, index) => index === dayIndex ? { ...entry, ranges: entry.ranges.filter((_, currentIndex) => currentIndex !== rangeIndex) } : entry))}>Remove</Button></div>)}{day.enabled && day.ranges.length < 2 && <Button type="button" size="sm" variant="outline" onClick={() => setDraft((current) => current.map((entry, index) => index === dayIndex ? { ...entry, ranges: [...entry.ranges, { start: "18:00", end: "22:00" }] } : entry))}>Add second range</Button>}</div></div>)}</div><Button className="mt-4" disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending && <Loader2 className="size-4 animate-spin" />}Save availability</Button><div className="mt-6 border-t pt-5"><h4 className="font-semibold">Date-specific exception</h4><form className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); addException.mutate({ startsAt: toUtcFromBangladeshLocal(String(data.get("startsAt"))), endsAt: toUtcFromBangladeshLocal(String(data.get("endsAt"))), exceptionType: String(data.get("exceptionType")) as "BLOCKED" | "SPECIAL_AVAILABLE", reason: String(data.get("reason") || "") || undefined }, { onSuccess: () => form.reset() }); }}><Field label="Starts"><Input name="startsAt" type="datetime-local" required /></Field><Field label="Ends"><Input name="endsAt" type="datetime-local" required /></Field><Field label="Type"><select name="exceptionType" className="h-10 w-full rounded-md border bg-white px-3 text-sm"><option value="BLOCKED">Blocked</option><option value="SPECIAL_AVAILABLE">Special available</option></select></Field><Field label="Reason"><Input name="reason" maxLength={255} /></Field><Button type="submit" variant="outline" disabled={addException.isPending}>{addException.isPending && <Loader2 className="size-4 animate-spin" />}Add exception</Button></form>{exceptions.length > 0 && <div className="mt-4 space-y-2">{exceptions.map((item) => <AvailabilityExceptionRow key={item.id} resourceId={resource.id} item={item} />)}</div>}</div></div>;
}

function AvailabilityExceptionRow({ resourceId, item }: { resourceId: string; item: import("@/lib/api/marketplace-types").AvailabilityExceptionDto }) {
  const client = useQueryClient(); const [editing, setEditing] = useState(false);
  const [startsAt, setStartsAt] = useState(toDhakaLocalInput(item.startsAt)); const [endsAt, setEndsAt] = useState(toDhakaLocalInput(item.endsAt));
  const [exceptionType, setExceptionType] = useState(item.exceptionType); const [reason, setReason] = useState(item.reason ?? "");
  const refresh = async () => { await client.invalidateQueries({ queryKey: queryKeys.availability.byResource(resourceId) }); await client.invalidateQueries({ queryKey: queryKeys.parkingSearch.root }); };
  const update = useMutation({ mutationFn: () => parkingResourcesApi.updateException(item.id, { startsAt: toUtcFromBangladeshLocal(startsAt), endsAt: toUtcFromBangladeshLocal(endsAt), exceptionType, reason: reason.trim() || null }), onSuccess: async () => { toast.success("Availability exception updated"); setEditing(false); await refresh(); }, onError: (error) => toast.error(getApiErrorMessage(error)) });
  const remove = useMutation({ mutationFn: () => parkingResourcesApi.removeException(item.id), onSuccess: async () => { toast.success("Availability exception deleted"); await refresh(); }, onError: (error) => toast.error(getApiErrorMessage(error)) });
  if (editing) return <div className="grid gap-2 rounded-md bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-4"><Input aria-label="Exception starts" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /><Input aria-label="Exception ends" type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /><select aria-label="Exception type" value={exceptionType} onChange={(event) => setExceptionType(event.target.value as typeof exceptionType)} className="h-10 rounded-md border bg-white px-3 text-sm"><option value="BLOCKED">Blocked</option><option value="SPECIAL_AVAILABLE">Special available</option></select><Input aria-label="Exception reason" value={reason} maxLength={255} onChange={(event) => setReason(event.target.value)} /><div className="flex gap-2 sm:col-span-2 lg:col-span-4"><Button size="sm" disabled={update.isPending || !startsAt || !endsAt} onClick={() => update.mutate()}>{update.isPending && <Loader2 className="size-4 animate-spin" />}Save</Button><Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button></div></div>;
  return <div className="flex items-start justify-between gap-3 rounded-md bg-slate-50 p-3 text-xs"><div><strong>{item.exceptionType.replaceAll("_", " ")}</strong><span className="ml-2 text-slate-600">{formatDateTime(item.startsAt)} to {formatDateTime(item.endsAt)}</span>{item.reason && <p className="mt-1 text-slate-500">{item.reason}</p>}</div><div className="flex gap-1"><Button size="icon" variant="ghost" title="Edit exception" onClick={() => setEditing(true)}><Edit3 className="size-4" /></Button><Button size="icon" variant="ghost" title="Delete exception" disabled={remove.isPending} onClick={() => remove.mutate()}>{remove.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}</Button></div></div>;
}

function toDhakaLocalInput(value: string) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value)).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-1.5 text-xs font-semibold"><span>{label}</span>{children}</label>; }
function Status({ label, className }: { label: string; className: string }) { return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${className}`}>{label}</span>; }
function PanelState({ message, loading, retry }: { message: string; loading?: boolean; retry?: () => void }) { return <div className="rounded-lg border bg-white p-8 text-center text-sm text-slate-600">{loading && <Loader2 className="mx-auto mb-2 size-5 animate-spin" />}<p>{message}</p>{retry && <Button className="mt-3" variant="outline" onClick={retry}>Retry</Button>}</div>; }
