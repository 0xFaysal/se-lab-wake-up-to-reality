"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, Circle, Clock3, Download, Edit3, Eye, Loader2, LockKeyhole, Plus, Scale, ShieldCheck, Trash2 } from "lucide-react";
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
import { listingPayload } from "@/lib/listing-payload";
import { availabilityTimeInput } from "@/lib/availability-time";
import { ListingSettingsForm } from "./listing-settings-form";
import { WorkspaceModal } from "./workspace-modal";
import { useUnsavedNavigation } from "@/hooks/use-unsaved-navigation";
import { DocumentViewerModal, type DocumentViewerTarget } from "@/components/common/document-viewer-modal";

const VEHICLES: VehicleType[] = ["MOTORCYCLE", "SEDAN", "SUV", "MICROBUS"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const normalizePreviewSpotCode = (value: string) => value.trim().toUpperCase().replace(/[\s-]+/g, "");
const formatEvidenceCategory = (category: string) => (category === "OWNER_CONSENT" ? "Provider Consent" : category.replaceAll("_", " "));

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
  const [changeRight, setChangeRight] = useState<{ right: ParkingRightDto; presetCommercial?: boolean } | null>(null);
  const [deleteResource, setDeleteResource] = useState<ParkingResourceDto | null>(null);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [showBatchClaimForm, setShowBatchClaimForm] = useState(false);
  const [renderedAt, setRenderedAt] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setRenderedAt(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

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
{propertyResources.length === 0 && <MarketplaceReadiness resources={propertyResources} rights={propertyRights} listings={propertyListings} renderedAt={renderedAt} onAddResource={() => setShowResourceForm(true)} onClaimRight={(resource) => setRightResource(resource)} onEnableListing={(right) => setChangeRight({ right, presetCommercial: true })} />}
    {showResourceForm && <WorkspaceModal title="Add parking space" description="Space details and compatible vehicles" close={() => setShowResourceForm(false)}><ResourceForm propertyId={propertyId} onDone={async (resource) => { setShowResourceForm(false); setRightResource(resource); await refreshAll(); }} /></WorkspaceModal>}
    {showBulkResourceForm && <WorkspaceModal title="Add fixed spaces" description="Spot codes, capacity and amenities" close={() => setShowBulkResourceForm(false)}><BulkResourceForm propertyId={propertyId} existingResources={propertyResources} onDone={async (createdIds) => { setShowBulkResourceForm(false); setSelectedResourceIds(createdIds); setShowBatchClaimForm(createdIds.length > 1); await refreshAll(); }} /></WorkspaceModal>}
    {selectedResourceIds.length > 1 && <div className="flex flex-wrap items-center justify-between gap-3 border-y border-emerald-200 bg-emerald-50 py-3"><p className="text-sm font-semibold">{selectedResourceIds.length} spaces selected for one Parking Right claim</p><Button size="sm" onClick={() => setShowBatchClaimForm(true)}><Scale className="size-4" />Claim selected rights</Button></div>}
    {showBatchClaimForm && <WorkspaceModal title="Confirm operating authority" description="Authority for selected spaces" close={() => setShowBatchClaimForm(false)}><BulkRightClaimForm propertyId={propertyId} resourceIds={selectedResourceIds} close={() => setShowBatchClaimForm(false)} onDone={async () => { setShowBatchClaimForm(false); setSelectedResourceIds([]); await refreshAll(); }} /></WorkspaceModal>}
    {propertyResources.length === 0 ? <PanelState message="No parking resources have been added." /> : <div className="grid gap-4">{propertyResources.map((resource) => {
      const linkedRights = propertyRights.filter((right) => right.parkingSpotId === resource.id);
      const linkedListings = propertyListings.filter((listing) => listing.parkingSpotId === resource.id);
      const missingVehicles = resource.supportedVehicleTypes.filter((type) => !linkedListings.some((listing) => ["ACTIVE", "DRAFT", "PAUSED"].includes(listing.status) && listing.allowedVehicleTypes.includes(type)));
      const blocksNewClaim = linkedRights.some((right) => ["PENDING_VERIFICATION", "VERIFIED", "DISPUTED"].includes(right.status));
      const claimButtonLabel = linkedRights.some((right) => right.status === "VERIFIED") ? "Right verified" : linkedRights.some((right) => right.status === "PENDING_VERIFICATION") ? "Review in progress" : linkedRights.some((right) => right.status === "DISPUTED") ? "Right disputed" : "Claim right";
      const selectable = resource.resourceType === "FIXED_SPACE" && !blocksNewClaim;
      return <article key={resource.id} className="border-y bg-white py-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3">{selectable && <Checkbox aria-label={`Select ${resource.displayName ?? resource.spotCode ?? "parking space"}`} checked={selectedResourceIds.includes(resource.id)} onCheckedChange={(checked) => setSelectedResourceIds((current) => checked ? current.includes(resource.id) ? current : [...current, resource.id] : current.filter((id) => id !== resource.id))} />}<div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="break-words text-lg font-semibold">{resource.displayName ?? "Parking resource"}</h3><Status label={resource.resourceType === "SHARED_POOL" ? "Shared pool" : "Fixed spaces"} className="bg-blue-100 text-blue-800" /><Status label={resource.status === "ACTIVE" ? "Active" : resource.status.replaceAll("_", " ").toLowerCase()} className={resource.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"} /></div><p className="mt-2 text-sm text-slate-600">{resource.capacity} spaces {resource.floor ? `· ${resource.floor}` : ""} {resource.zone ? `· ${resource.zone}` : ""}</p>{resource.units?.length ? <details className="mt-2 text-xs text-slate-500"><summary className="cursor-pointer">View {resource.units.length} spot codes</summary><p className="mt-2 break-words leading-6">{resource.units.map((unit) => unit.spotCode).join(", ")}</p></details> : null}</div></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setEditResource(resource)}><Edit3 className="size-4" />Edit spaces</Button><Button size="sm" variant="outline" onClick={() => setAvailabilityResource(resource)}><CalendarClock className="size-4" />Opening hours</Button><Button aria-label="Delete parking resource" title="Delete resource" size="icon" variant="ghost" onClick={() => setDeleteResource(resource)}><Trash2 className="size-4 text-red-600" /></Button></div></div>
        <div className="mt-4 flex flex-wrap gap-2">{resource.supportedVehicleTypes.map((type) => <span key={type} className="rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold">{type.replaceAll("_", " ")}</span>)}</div>
        <div className="mt-5 grid gap-6 border-t pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <section className="min-w-0"><h4 className="mb-3 text-sm font-semibold">Operating authority</h4>{linkedRights.length === 0 ? <p className="text-sm text-amber-700">No right claim submitted.</p> : <div className="space-y-4">{linkedRights.map((right) => { const commercialDisabled = right.status === "VERIFIED" && right.rightType !== "USE_ONLY" && (!right.canList || !right.canSetPrice); return <div key={right.id} className="border-l-2 border-emerald-200 pl-3 text-sm"><div className="flex flex-wrap items-center gap-2"><span className="font-medium">{right.rightType.replaceAll("_", " ").toLowerCase()}</span><Status {...parkingRightStatus[right.status]} /></div><p className="mt-2 text-xs text-slate-600">{right.quantity} spaces · {getRightDateStatus(right, renderedAt)}</p><p className="mt-1 text-xs leading-5 text-slate-500">From {formatDateTime(right.validFrom)}{right.validUntil ? ` until ${formatDateTime(right.validUntil)}` : " · No expiry"}</p><p className="mt-1 text-xs text-slate-600">Commercial listing: {right.canList && right.canSetPrice ? "Enabled" : "Not requested"}</p>{right.rejectionReason && <p className="mt-2 text-xs text-red-700">{right.rejectionReason}</p>}{commercialDisabled ? <Button className="mt-3" size="sm" onClick={() => setChangeRight({ right, presetCommercial: true })}><LockKeyhole className="size-4" />Enable listing</Button> : ["PENDING_VERIFICATION", "VERIFIED"].includes(right.status) && <Button className="mt-3" size="sm" variant="outline" onClick={() => setChangeRight({ right })}><Edit3 className="size-4" />{right.status === "PENDING_VERIFICATION" ? "Edit pending claim" : "Request change"}</Button>}</div>; })}</div>}{!blocksNewClaim && <Button className="mt-3" size="sm" variant="outline" onClick={() => setRightResource(resource)}><Scale className="size-4" />{claimButtonLabel}</Button>}</section>
<section className="min-w-0 border-t pt-4 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0"><h4 className="text-sm font-semibold">Offers & rates</h4>{linkedListings.length === 0 ? <p className="mt-3 text-sm text-slate-500">No listing yet.</p> : <div>{linkedListings.map((listing) => <ListingRow key={listing.id} listing={listing} supportedVehicles={resource.supportedVehicleTypes.filter((type) => listing.allowedVehicleTypes.includes(type) || !linkedListings.some((other) => other.id !== listing.id && ["ACTIVE", "PAUSED", "DRAFT"].includes(other.status) && (other.parkingResourceUnitId === null || listing.parkingResourceUnitId === null || other.parkingResourceUnitId === listing.parkingResourceUnitId) && other.allowedVehicleTypes.includes(type)))} refresh={refreshAll} />)}</div>}{missingVehicles.length > 0 && <ListingForm vehiclesAvailable={missingVehicles} rights={linkedRights} renderedAt={renderedAt} refresh={refreshAll} onEnableListing={(right) => setChangeRight({ right, presetCommercial: true })} />}</section>
        </div>
      </article>;
    })}</div>}
    {editResource && <WorkspaceModal title="Edit parking spaces" description={editResource.displayName ?? "Space details"} close={() => setEditResource(null)}><ResourceEditForm resource={editResource} close={() => setEditResource(null)} refresh={refreshAll} /></WorkspaceModal>}
    {rightResource && <WorkspaceModal title="Confirm operating authority" description={rightResource.displayName ?? "Parking authority"} close={() => setRightResource(null)}><RightClaimForm resource={rightResource} close={() => setRightResource(null)} refresh={refreshAll} /></WorkspaceModal>}
    {changeRight && <WorkspaceModal title="Change operating authority" description="Review current details and propose changes" close={() => setChangeRight(null)}><RightChangeForm right={changeRight.right} presetCommercial={changeRight.presetCommercial} close={() => setChangeRight(null)} refresh={refreshAll} /></WorkspaceModal>}
    {availabilityResource && <WorkspaceModal title="Opening hours" description={availabilityResource.displayName ?? "Weekly availability"} close={() => setAvailabilityResource(null)}><AvailabilityEditor resource={availabilityResource} close={() => setAvailabilityResource(null)} /></WorkspaceModal>}
    <AlertDialog open={!!deleteResource} onOpenChange={(open) => { if (!open) setDeleteResource(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete parking resource?</AlertDialogTitle><AlertDialogDescription>Resources with unfinished bookings cannot be deleted. This action removes the resource from future marketplace use.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={remove.isPending} onClick={() => deleteResource && remove.mutate(deleteResource.id)}>{remove.isPending ? <Loader2 className="size-4 animate-spin" /> : "Delete"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </section>;
}

function isRightEffectiveAt(right: ParkingRightDto, now: number) {
  return new Date(right.validFrom).getTime() <= now && (!right.validUntil || new Date(right.validUntil).getTime() > now);
}

function getRightDateStatus(right: ParkingRightDto, now: number) {
  if (new Date(right.validFrom).getTime() > now) return "Starts later";
  if (right.validUntil && new Date(right.validUntil).getTime() <= now) return "Expired";
  return "Active now";
}

function MarketplaceReadiness({ resources, rights, listings, renderedAt, onAddResource, onClaimRight, onEnableListing }: {
  resources: ParkingResourceDto[];
  rights: ParkingRightDto[];
  listings: Array<import("@/lib/api/marketplace-types").ParkingListingDto>;
  renderedAt: number;
  onAddResource: () => void;
  onClaimRight: (resource: ParkingResourceDto) => void;
  onEnableListing: (right: ParkingRightDto) => void;
}) {
  const verifiedRight = rights.find((right) => right.status === "VERIFIED");
  const pendingRight = rights.find((right) => right.status === "PENDING_VERIFICATION");
  const eligibleRight = rights.find((right) => right.status === "VERIFIED" && right.canList && right.canSetPrice && isRightEffectiveAt(right, renderedAt));
  const permissionBlocked = rights.find((right) => right.status === "VERIFIED" && right.rightType !== "USE_ONLY" && (!right.canList || !right.canSetPrice));
  const hasLiveListing = listings.some((listing) => listing.status === "ACTIVE");
  const steps = [
    { label: "Parking added", detail: resources.length > 0 ? `${resources.length} resource${resources.length === 1 ? "" : "s"}` : "Add a parking resource", complete: resources.length > 0 },
    { label: "Right confirmed", detail: verifiedRight ? "Authority verified" : pendingRight ? "Admin review in progress" : "Submit proof of authority", complete: Boolean(verifiedRight), pending: Boolean(pendingRight) },
    { label: "Listing access", detail: eligibleRight ? "Ready to publish" : permissionBlocked ? "Permission required" : "Available after verification", complete: Boolean(eligibleRight) },
    { label: "Visible to drivers", detail: hasLiveListing ? "Listing is live" : listings.length > 0 ? "Activate your draft" : "Create and activate a listing", complete: hasLiveListing },
  ];
  const firstIncomplete = steps.findIndex((step) => !step.complete);

  return <section aria-labelledby="marketplace-readiness-title" className="border-y bg-slate-50 px-4 py-4 sm:px-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-emerald-700" /><h3 id="marketplace-readiness-title" className="font-bold">Ready to accept bookings</h3></div><p className="mt-1 text-xs text-slate-600">A clear, secure path from verified property to a live parking offer.</p></div><span className="text-xs font-semibold text-slate-600">{steps.filter((step) => step.complete).length} of {steps.length} complete</span></div>
    <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{steps.map((step, index) => { const current = index === firstIncomplete; const Icon = step.complete ? CheckCircle2 : step.pending || current ? Clock3 : Circle; return <li key={step.label} className="flex min-w-0 items-start gap-2 border-l-2 border-slate-200 pl-3"><Icon className={`mt-0.5 size-4 shrink-0 ${step.complete ? "text-emerald-700" : current ? "text-amber-600" : "text-slate-400"}`} /><div className="min-w-0"><p className="text-xs font-bold">{step.label}</p><p className="mt-0.5 text-xs text-slate-500">{step.detail}</p></div></li>; })}</ol>
    {!resources.length ? <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-sm">Start by adding the parking area or spaces you control.</p><Button size="sm" onClick={onAddResource}><Plus className="size-4" />Add parking</Button></div> : !verifiedRight && !pendingRight ? <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-sm">Confirm your authority for this parking resource. Only verified providers can publish it.</p><Button size="sm" onClick={() => onClaimRight(resources[0]!)}><Scale className="size-4" />Confirm parking right</Button></div> : permissionBlocked ? <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-amber-200 pt-4"><div><p className="text-sm font-semibold">Your right is verified, but commercial permissions were not requested.</p><p className="mt-1 text-xs text-slate-600">Request one secure amendment to enable listing, pricing, and booking management. Your current verified right stays active during review.</p></div><Button size="sm" onClick={() => onEnableListing(permissionBlocked)}><LockKeyhole className="size-4" />Enable listing</Button></div> : null}
  </section>;
}

function ResourceEditForm({ resource, close, refresh }: { resource: ParkingResourceDto; close: () => void; refresh: () => Promise<void> }) {
  const [vehicles, setVehicles] = useState<VehicleType[]>(resource.supportedVehicleTypes);
  const mutation = useMutation({ mutationFn: (input: Parameters<typeof parkingResourcesApi.update>[1]) => parkingResourcesApi.update(resource.id, input), onSuccess: async (result) => { if (result.warning) toast.warning(result.warning, { description: result.affectedBookings?.map((item) => item.bookingCode).join(", "), duration: 12000 }); else toast.success("Parking resource updated"); close(); await refresh(); }, onError: (error) => toast.error(getApiErrorMessage(error)) });
  return <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-center justify-between"><h3 className="font-bold">Edit {resource.displayName}</h3><Button variant="ghost" onClick={close}>Close</Button></div><form className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); mutation.mutate({ displayName: String(data.get("displayName")), floor: String(data.get("floor") || "") || null, zone: String(data.get("zone") || "") || null, capacity: resource.resourceType === "FIXED_SPACE" ? 1 : Number(data.get("capacity")), status: String(data.get("status")) as ParkingResourceDto["status"], supportedVehicleTypes: vehicles, isCovered: data.get("isCovered") === "on", hasCctv: data.get("hasCctv") === "on", hasGuard: data.get("hasGuard") === "on", maxHeightCm: data.get("maxHeightCm") ? Number(data.get("maxHeightCm")) : null, maxWidthCm: data.get("maxWidthCm") ? Number(data.get("maxWidthCm")) : null, maxLengthCm: data.get("maxLengthCm") ? Number(data.get("maxLengthCm")) : null }); }}>
    <Field label="Display name"><Input name="displayName" defaultValue={resource.displayName ?? ""} minLength={2} maxLength={120} required /></Field><Field label="Floor"><Input name="floor" defaultValue={resource.floor ?? ""} maxLength={40} /></Field><Field label="Zone"><Input name="zone" defaultValue={resource.zone ?? ""} maxLength={60} /></Field>{resource.resourceType === "SHARED_POOL" && <Field label="Capacity"><Input name="capacity" type="number" defaultValue={resource.capacity} min={1} max={1000} /></Field>}<Field label="Status"><select name="status" defaultValue={resource.status} className="h-10 w-full rounded-md border bg-white px-3 text-sm">{["ACTIVE", "BLOCKED", "MAINTENANCE", "INACTIVE"].map((status) => <option key={status}>{status}</option>)}</select></Field><Field label="Max height (cm)"><Input name="maxHeightCm" type="number" min={100} max={1000} defaultValue={resource.maxHeightCm ?? ""} /></Field><Field label="Max width (cm)"><Input name="maxWidthCm" type="number" min={100} max={1000} defaultValue={resource.maxWidthCm ?? ""} /></Field><Field label="Max length (cm)"><Input name="maxLengthCm" type="number" min={100} max={3000} defaultValue={resource.maxLengthCm ?? ""} /></Field>
    <div className="sm:col-span-2 lg:col-span-4"><p className="mb-2 text-xs font-semibold">Compatible vehicles</p>{VEHICLES.map((vehicle) => <label key={vehicle} className="mr-4 inline-flex items-center gap-2 text-xs"><Checkbox checked={vehicles.includes(vehicle)} onCheckedChange={(checked) => setVehicles((current) => checked ? [...current, vehicle] : current.filter((item) => item !== vehicle))} />{vehicle}</label>)}</div><div className="flex flex-wrap gap-4 sm:col-span-2 lg:col-span-4"><label className="flex gap-2 text-xs"><Checkbox name="isCovered" defaultChecked={resource.isCovered} />Covered</label><label className="flex gap-2 text-xs"><Checkbox name="hasCctv" defaultChecked={resource.hasCctv} />CCTV</label><label className="flex gap-2 text-xs"><Checkbox name="hasGuard" defaultChecked={resource.hasGuard} />Guard</label></div><Button type="submit" disabled={mutation.isPending || vehicles.length === 0}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Save changes</Button>
  </form></div>;
}

function ResourceForm({ propertyId, onDone }: { propertyId: string; onDone: (resource: ParkingResourceDto) => Promise<void> }) {
  const [type, setType] = useState<ParkingResourceType>("FIXED_SPACE");
  const [vehicles, setVehicles] = useState<VehicleType[]>(["SEDAN"]);
  const mutation = useMutation({ mutationFn: (input: CreateParkingResourceInput) => parkingResourcesApi.create(propertyId, input), onSuccess: async (resource) => { toast.success("Parking resource created. Confirm your right to continue."); await onDone(resource); }, onError: (error) => toast.error(getApiErrorMessage(error)) });
  return <form className="grid gap-4 rounded-lg border border-emerald-200 bg-emerald-50/50 p-5 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); mutation.mutate({ type, displayName: String(data.get("displayName")), ...(type === "FIXED_SPACE" ? { spotCode: String(data.get("spotCode")) } : {}), floor: String(data.get("floor") || "") || undefined, zone: String(data.get("zone") || "") || undefined, capacity: type === "FIXED_SPACE" ? 1 : Number(data.get("capacity")), supportedVehicleTypes: vehicles, isCovered: data.get("isCovered") === "on", hasCctv: data.get("hasCctv") === "on", hasGuard: data.get("hasGuard") === "on", maxHeightCm: data.get("maxHeightCm") ? Number(data.get("maxHeightCm")) : undefined, maxWidthCm: data.get("maxWidthCm") ? Number(data.get("maxWidthCm")) : undefined, maxLengthCm: data.get("maxLengthCm") ? Number(data.get("maxLengthCm")) : undefined }); }}><div className="sm:col-span-2 lg:col-span-4"><p className="text-xs font-bold uppercase text-emerald-800">Parking inventory</p><h3 className="mt-1 text-lg font-bold">Add one parking resource</h3><p className="mt-1 text-sm text-slate-600">Create the reservable space or shared capacity. You will confirm your authority immediately after this step.</p></div>
    <Field label="Resource type"><Select value={type} onValueChange={(value) => value && setType(value as ParkingResourceType)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="FIXED_SPACE">Fixed space</SelectItem><SelectItem value="SHARED_POOL">Shared pool</SelectItem></SelectContent></Select></Field>
    <Field label="Display name"><Input name="displayName" minLength={2} maxLength={120} required /></Field>
    {type === "FIXED_SPACE" ? <Field label="Spot code"><Input name="spotCode" maxLength={30} required /></Field> : <Field label="Capacity"><Input name="capacity" type="number" min={1} max={1000} defaultValue={1} required /></Field>}
    <Field label="Floor"><Input name="floor" maxLength={40} /></Field><Field label="Zone"><Input name="zone" maxLength={60} /></Field><Field label="Max height (cm)"><Input name="maxHeightCm" type="number" min={100} max={1000} /></Field><Field label="Max width (cm)"><Input name="maxWidthCm" type="number" min={100} max={1000} /></Field><Field label="Max length (cm)"><Input name="maxLengthCm" type="number" min={100} max={3000} /></Field>
    <div className="sm:col-span-2 lg:col-span-4"><p className="mb-2 text-xs font-semibold">Compatible vehicles</p><div className="flex flex-wrap gap-4">{VEHICLES.map((vehicle) => <label key={vehicle} className="flex items-center gap-2 text-xs"><Checkbox checked={vehicles.includes(vehicle)} onCheckedChange={(checked) => setVehicles((current) => checked ? [...current, vehicle] : current.filter((item) => item !== vehicle))} />{vehicle}</label>)}</div></div>
    <div className="flex flex-wrap gap-4 sm:col-span-2 lg:col-span-4">{[["isCovered", "Covered"], ["hasCctv", "CCTV"], ["hasGuard", "Guard"]].map(([name, label]) => <label key={name} className="flex items-center gap-2 text-xs"><Checkbox name={name} />{label}</label>)}</div>
    <Button type="submit" disabled={mutation.isPending || vehicles.length === 0} className="sm:col-span-2 lg:col-span-1">{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Add parking and continue</Button>
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
  return <div className="rounded-lg border border-blue-200 bg-blue-50 p-5"><div className="flex items-center justify-between"><h3 className="font-bold">Confirm authority for {resource.displayName}</h3><Button variant="ghost" onClick={close}>Close</Button></div><p className="mt-2 text-xs text-blue-900">Choose how you are authorized to operate this parking. Commercial permissions are bundled into this verification request so approval unlocks the complete listing workflow.</p><form className="mt-4 grid gap-4 sm:grid-cols-3" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const validFrom = String(data.get("validFrom") || ""); const validUntil = String(data.get("validUntil") || ""); mutation.mutate({ rightType: type, quantity: Number(data.get("quantity")), canUse: true, canList: commercial && data.get("canList") === "on", canSetPrice: commercial && data.get("canSetPrice") === "on", canManageBookings: commercial && data.get("canManageBookings") === "on", canDelegateManager: data.get("canDelegateManager") === "on", ...(validFrom ? { validFrom: toUtcFromBangladeshLocal(validFrom) } : {}), ...(validUntil ? { validUntil: toUtcFromBangladeshLocal(validUntil) } : {}) }); }}>
      <Field label="Right type"><Select value={type} onValueChange={(value) => value && setType(value as ParkingRightType)}><SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger><SelectContent>{(["OWNERSHIP", "USE_ONLY", "COMMERCIAL_LEASE", "AUTHORIZED_OPERATION"] as const).map((item) => <SelectItem key={item} value={item}>{item.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select></Field><Field label="Quantity"><Input className="bg-white" name="quantity" type="number" min={1} max={resource.capacity} defaultValue={resource.resourceType === "FIXED_SPACE" ? resource.capacity : 1} readOnly={resource.resourceType === "FIXED_SPACE"} /></Field><Field label="Valid from (optional)"><Input className="bg-white" name="validFrom" type="datetime-local" /></Field><Field label="Valid until (optional)"><Input className="bg-white" name="validUntil" type="datetime-local" /></Field>
      <div className="space-y-2 sm:col-span-3"><p className="text-xs font-semibold">Commercial use</p><p className="text-xs text-blue-900">Listing, pricing, and booking permissions are selected so this verified right can be published without another setup round.</p>{[["canList", "Publish listings"], ["canSetPrice", "Set pricing"], ["canManageBookings", "Manage bookings"], ["canDelegateManager", "Delegate Manager"]].map(([name, label]) => <label key={name} className="mr-5 inline-flex items-center gap-2 text-xs"><Checkbox name={name} defaultChecked={commercial && name !== "canDelegateManager"} disabled={!commercial && name !== "canDelegateManager"} />{label}</label>)}</div><Field label="Evidence category"><select className="h-10 w-full border bg-white px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value as typeof category)}>{["OWNERSHIP_DOCUMENT", "LEASE_AGREEMENT", "OWNER_CONSENT", "AUTHORIZATION_LETTER", "PARKING_ALLOCATION", "OTHER"].map((item) => <option key={item} value={item}>{formatEvidenceCategory(item)}</option>)}</select></Field><Field label="Optional supporting documents"><Input className="bg-white" type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 5))} /><small className="block font-normal text-slate-500">Optional, but may help Admin verify your Parking Right faster. Maximum 5 files, 10 MB each.</small></Field><div className="flex items-end"><Button type="submit" disabled={mutation.isPending}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Send for verification</Button></div>
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
  return <section className="border-y border-blue-200 bg-blue-50 py-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">Claim {resourceIds.length} Parking Rights</h3><p className="mt-1 text-xs text-blue-900">One submission creates an independently auditable claim for each selected space. Commercial permissions are preselected for a smooth path to publishing.</p></div><Button variant="ghost" onClick={close}>Close</Button></div><form className="mt-4 grid gap-4 sm:grid-cols-3" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const validFrom = String(data.get("validFrom") || ""); const validUntil = String(data.get("validUntil") || ""); mutation.mutate({ rightType: type, quantity: 1, canUse: true, canList: commercial && data.get("canList") === "on", canSetPrice: commercial && data.get("canSetPrice") === "on", canManageBookings: commercial && data.get("canManageBookings") === "on", canDelegateManager: data.get("canDelegateManager") === "on", ...(validFrom ? { validFrom: toUtcFromBangladeshLocal(validFrom) } : {}), ...(validUntil ? { validUntil: toUtcFromBangladeshLocal(validUntil) } : {}) }); }}><Field label="Right type"><Select value={type} onValueChange={(value) => value && setType(value as ParkingRightType)}><SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger><SelectContent>{(["OWNERSHIP", "USE_ONLY", "COMMERCIAL_LEASE", "AUTHORIZED_OPERATION"] as const).map((item) => <SelectItem key={item} value={item}>{item.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select></Field><Field label="Valid from"><Input className="bg-white" name="validFrom" type="datetime-local" /></Field><Field label="Valid until"><Input className="bg-white" name="validUntil" type="datetime-local" /></Field><div className="space-y-2 sm:col-span-3">{[["canList", "Publish listings"], ["canSetPrice", "Set pricing"], ["canManageBookings", "Manage bookings"], ["canDelegateManager", "Delegate Manager"]].map(([name, label]) => <label key={name} className="mr-5 inline-flex items-center gap-2 text-xs"><Checkbox name={name} defaultChecked={commercial && name !== "canDelegateManager"} disabled={!commercial && name !== "canDelegateManager"} />{label}</label>)}</div><Field label="Evidence category"><select className="h-10 w-full border bg-white px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value as typeof category)}>{["OWNERSHIP_DOCUMENT", "LEASE_AGREEMENT", "OWNER_CONSENT", "AUTHORIZATION_LETTER", "PARKING_ALLOCATION", "OTHER"].map((item) => <option key={item} value={item}>{formatEvidenceCategory(item)}</option>)}</select></Field><Field label="Optional evidence"><Input className="bg-white" type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 5))} /><small className="block font-normal text-slate-500">Optional; up to 5 files, 10 MB each.</small></Field><div className="flex items-end"><Button type="submit" disabled={mutation.isPending || resourceIds.length < 2}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Submit batch claim</Button></div></form></section>;
}

function RightChangeForm({ right, presetCommercial = false, close, refresh }: { right: ParkingRightDto; presetCommercial?: boolean; close: () => void; refresh: () => Promise<void> }) {
  const pending = right.status === "PENDING_VERIFICATION";
  const [type, setType] = useState<ParkingRightType>(right.rightType);
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<ParkingRightDocumentDto["category"]>("OWNERSHIP_DOCUMENT");
  const [selectedDoc, setSelectedDoc] = useState<DocumentViewerTarget | null>(null);
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


  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = {
      rightType: type,
      quantity: Number(data.get("quantity")),
      canUse: right.canUse,
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
    if (String(data.get("validFrom")) !== toDhakaLocalInput(right.validFrom)) changes.validFrom = next.validFrom;
    if (String(data.get("validUntil") || "") !== (right.validUntil ? toDhakaLocalInput(right.validUntil) : "")) changes.validUntil = next.validUntil;
    if (Object.keys(changes).length === 0 && (!pending || files.length === 0)) {
      toast.error(pending ? "Change a field or add evidence before submitting" : "Change at least one field before submitting");
      return;
    }
    mutation.mutate(changes);
  }

  const documents = right.documents ?? [];
  const remainingDocumentSlots = pending ? Math.max(0, 5 - documents.length) : 5;

  return <section className="border border-blue-200 bg-blue-50 p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold">{presetCommercial ? "Enable commercial listing" : pending ? "Edit pending Parking Right claim" : "Request a Parking Right change"}</h3><p className="mt-1 text-xs text-blue-900">{presetCommercial ? "Listing, pricing, and booking permissions are ready below. Your verified right remains active while Admin reviews this secure amendment." : pending ? "Saving updates the same claim and increments its version." : "The currently verified Right stays active while Admin reviews this request."}</p></div><Button variant="ghost" onClick={close}>Close</Button></div>
    <div className="mt-4 border-y py-3 text-sm"><p className="font-semibold">Current authority · Version {right.version}</p><p className="mt-1 text-slate-600">{right.rightType.replaceAll("_", " ")} · {right.quantity} spaces · {right.status.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-slate-500">{formatDateTime(right.validFrom)} to {right.validUntil ? formatDateTime(right.validUntil) : "No expiry"}</p><p className="mt-2 text-xs text-slate-600">{[["Use spaces", right.canUse], ["Publish listings", right.canList], ["Set pricing", right.canSetPrice], ["Manage bookings", right.canManageBookings], ["Delegate manager", right.canDelegateManager]].map(([label, enabled]) => `${label}: ${enabled ? "Yes" : "No"}`).join(" · ")}</p></div>
    <form className="mt-4 grid gap-4 sm:grid-cols-3" onSubmit={submit}>
      <Field label="Right type"><Select value={type} onValueChange={(value) => value && setType(value as ParkingRightType)}><SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger><SelectContent>{(["OWNERSHIP", "USE_ONLY", "COMMERCIAL_LEASE", "AUTHORIZED_OPERATION"] as const).map((item) => <SelectItem key={item} value={item}>{item.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select></Field>
      <Field label="Quantity"><Input className="bg-white" name="quantity" type="number" min={1} max={right.parkingSpot?.capacity ?? 1000} defaultValue={right.quantity} required /></Field>
      <Field label="Valid from"><Input className="bg-white" name="validFrom" type="datetime-local" defaultValue={toDhakaLocalInput(right.validFrom)} required /></Field>
      <Field label="Valid until (optional)"><Input className="bg-white" name="validUntil" type="datetime-local" defaultValue={right.validUntil ? toDhakaLocalInput(right.validUntil) : ""} /></Field>
      <div className="space-y-2 sm:col-span-3">{[["canList", "Publish listings", presetCommercial || right.canList], ["canSetPrice", "Set pricing", presetCommercial || right.canSetPrice], ["canManageBookings", "Manage bookings", presetCommercial || right.canManageBookings], ["canDelegateManager", "Delegate Manager", right.canDelegateManager]].map(([name, label, checked]) => <label key={String(name)} className="mr-5 inline-flex items-center gap-2 text-xs"><Checkbox name={String(name)} defaultChecked={Boolean(checked)} disabled={!commercial && name !== "canDelegateManager"} />{String(label)}</label>)}</div>
      <Field label="Evidence category"><select className="h-10 w-full border bg-white px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value as ParkingRightDocumentDto["category"])}>{["OWNERSHIP_DOCUMENT", "LEASE_AGREEMENT", "OWNER_CONSENT", "AUTHORIZATION_LETTER", "PARKING_ALLOCATION", "OTHER"].map((item) => <option key={item} value={item}>{formatEvidenceCategory(item)}</option>)}</select></Field>
      <Field label={pending ? "Add evidence" : "Amendment evidence"}><Input className="bg-white" type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" disabled={remainingDocumentSlots === 0} onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, pending ? remainingDocumentSlots : 5))} /><small className="block font-normal text-slate-500">PDF, JPEG, PNG or WebP; maximum 5 files, 10 MB each.</small></Field>
      <div className="flex items-end"><Button type="submit" disabled={mutation.isPending}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}{pending ? "Save claim changes" : "Submit change request"}</Button></div>
      <div className="sm:col-span-3"><p className="mb-2 text-xs font-semibold">Current evidence</p>{documents.length === 0 ? <p className="text-xs text-slate-500">No evidence files attached to this claim.</p> : <div className="space-y-2">{documents.map((document) => <div key={document.id} className="flex flex-wrap items-center justify-between gap-2 border bg-white p-3 text-xs"><div className="min-w-0"><p className="break-words font-semibold">{document.originalName}</p><p className="text-slate-500">{formatEvidenceCategory(document.category)} · {(document.sizeBytes / 1024 / 1024).toFixed(2)} MB</p></div><div className="flex gap-1"><Button type="button" size="icon" variant="ghost" title="Preview evidence" aria-label={`Preview ${document.originalName}`} onClick={() => setSelectedDoc(document)}><Eye className="size-4 text-emerald-700" /></Button><Button type="button" size="icon" variant="ghost" title="Download evidence" aria-label={`Download ${document.originalName}`} onClick={() => setSelectedDoc(document)}><Download className="size-4" /></Button>{pending && <Button type="button" size="icon" variant="ghost" title="Remove evidence" aria-label={`Remove ${document.originalName}`} disabled={removeDocument.isPending} onClick={() => removeDocument.mutate(document.id)}><Trash2 className="size-4 text-red-600" /></Button>}</div></div>)}</div>}</div>
    </form>
    <DocumentViewerModal
      document={selectedDoc}
      isOpen={Boolean(selectedDoc)}
      onClose={() => setSelectedDoc(null)}
    />
  </section>;
}

function ListingForm({ rights, renderedAt, refresh, onEnableListing, vehiclesAvailable }: { rights: Array<import("@/lib/api/marketplace-types").ParkingRightDto>; renderedAt: number; refresh: () => Promise<void>; onEnableListing: (right: ParkingRightDto) => void; vehiclesAvailable: VehicleType[] }) {
  const eligible = rights.filter((right) => right.status === "VERIFIED" && right.canList && right.canSetPrice && isRightEffectiveAt(right, renderedAt));
  const permissionBlocked = rights.find((right) => right.status === "VERIFIED" && right.rightType !== "USE_ONLY" && (!right.canList || !right.canSetPrice));
  const futureRight = rights.find((right) => right.status === "VERIFIED" && right.canList && right.canSetPrice && new Date(right.validFrom).getTime() > renderedAt);
  const pendingRight = rights.some((right) => right.status === "PENDING_VERIFICATION");
  const [open, setOpen] = useState(false); const [vehicles, setVehicles] = useState<VehicleType[]>(vehiclesAvailable.slice(0, 1));
  const [selectedRightId, setSelectedRightId] = useState("");
  const [overtimeMode, setOvertimeMode] = useState<"MULTIPLIER" | "FIXED_PER_HOUR">("MULTIPLIER");
  const selectedRight = eligible.find((right) => right.id === selectedRightId) ?? eligible[0];
  const mutation = useMutation({ mutationFn: listingsApi.create, onSuccess: async () => { toast.success("Draft listing created"); setOpen(false); await refresh(); }, onError: (error) => toast.error(getApiErrorMessage(error)) });
  const helper = eligible.length > 0 ? `${eligible.length} verified right(s) ready to publish.` : permissionBlocked ? "Your right is verified, but commercial permission was not requested." : futureRight ? `Listing access starts ${formatDateTime(futureRight.validFrom)}.` : pendingRight ? "Admin verification is in progress." : "Verify a commercial Parking Right before creating a listing.";
return <div className="border-t pt-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs text-slate-500">{helper}</p></div>{permissionBlocked ? <Button onClick={() => onEnableListing(permissionBlocked)}><LockKeyhole className="size-4" />Enable listing</Button> : <Button variant="outline" disabled={eligible.length === 0} onClick={() => setOpen((value) => !value)}>{eligible.length === 0 ? <LockKeyhole className="size-4" /> : <Plus className="size-4" />}{futureRight ? "Starts later" : pendingRight ? "Awaiting approval" : "Add vehicle pricing"}</Button>}</div>{open && <WorkspaceModal title="Add vehicle pricing" description="Booking conditions for this parking area" close={() => setOpen(false)}><form className="mt-4 grid gap-4 rounded-lg border bg-white p-5 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const unitId = String(data.get("unitId") || ""); try { const payload = listingPayload(data, overtimeMode, vehicles); mutation.mutate({ parkingRightId: String(data.get("rightId")), ...(unitId ? { parkingResourceUnitId: unitId } : {}), ...payload }); } catch (error) { toast.error(error instanceof Error ? error.message : "Review the listing details and try again."); } }}>
      <Field label="Verified right"><select name="rightId" required value={selectedRight?.id ?? ""} onChange={(event) => setSelectedRightId(event.target.value)} className="h-10 w-full rounded-md border bg-white px-3 text-sm">{eligible.map((right) => <option key={right.id} value={right.id}>{right.parkingSpot?.displayName ?? right.rightType} · Qty {right.quantity}</option>)}</select></Field>{selectedRight?.parkingSpot?.resourceType === "FIXED_SPACE" && <Field label="Listing scope"><select name="unitId" className="h-10 w-full rounded-md border bg-white px-3 text-sm"><option value="">Entire resource (recommended)</option>{selectedRight.parkingSpot.units?.map((unit) => <option key={unit.id} value={unit.id}>{unit.spotCode}{unit.displayName ? ` · ${unit.displayName}` : ""}</option>)}</select></Field>}<Field label="Title"><Input name="title" minLength={3} maxLength={150} required /></Field><Field label="Price per hour (BDT)"><Input name="hourlyRate" type="number" min="0.01" step="0.01" required /></Field><Field label="Deposit (BDT)"><Input name="deposit" type="number" min="0" step="0.01" defaultValue="0" required /></Field><Field label="Minimum minutes"><Input name="minimum" type="number" min={15} max={1440} defaultValue={60} required /></Field><Field label="Maximum minutes"><Input name="maximum" type="number" min={15} max={10080} defaultValue={720} required /></Field><Field label="Description"><Textarea name="description" maxLength={3000} /></Field>
      <Field label="Overtime pricing"><select className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={overtimeMode} onChange={(event) => setOvertimeMode(event.target.value as typeof overtimeMode)}><option value="MULTIPLIER">Multiplier of hourly rate</option><option value="FIXED_PER_HOUR">Fixed overtime rate</option></select></Field>{overtimeMode === "MULTIPLIER" ? <Field label="Overtime multiplier"><Input key="overtime-multiplier" name="overtimeMultiplier" type="number" min="1" max="5" step="0.0001" defaultValue="1.5" required /></Field> : <Field label="Overtime rate (BDT/hour)"><Input key="overtime-fixed-rate" name="overtimeRate" type="number" min="1" max="100000" step="0.01" required /></Field>}<Field label="Grace period (minutes)"><Input name="overtimeGrace" type="number" value={5} readOnly required /></Field><div className="flex items-end text-xs leading-5 text-slate-600">After the grace period, overtime is calculated automatically at checkout.</div>
<div><p className="mb-2 text-xs font-semibold">Allowed vehicles</p>{vehiclesAvailable.map((vehicle) => <label key={vehicle} className="mr-3 inline-flex items-center gap-1 text-xs"><Checkbox checked={vehicles.includes(vehicle)} onCheckedChange={(checked) => setVehicles((current) => checked ? [...current, vehicle] : current.filter((item) => item !== vehicle))} />{vehicle}</label>)}</div><Button type="submit" disabled={mutation.isPending || vehicles.length === 0}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Create draft</Button>
      <label className="col-span-full flex items-start gap-3 border-t pt-4 text-sm"><input type="checkbox" name="discloseLocationBeforePayment" className="mt-1 size-4 accent-emerald-800" /><span>Allow verified Drivers to see the actual parking location before booking.<span className="mt-1 block text-xs text-slate-500">Public visitors see an approximate area. Private access instructions remain restricted to confirmed bookings.</span></span></label>
    </form></WorkspaceModal>}</div>;
}

function ListingRow({ listing, refresh, supportedVehicles }: { listing: import("@/lib/api/marketplace-types").ParkingListingDto; refresh: () => Promise<void>; supportedVehicles: VehicleType[] }) {
  const [editing, setEditing] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const statusMutation = useMutation({ mutationFn: () => listing.status === "ACTIVE" ? listingsApi.pause(listing.id) : listingsApi.activate(listing.id), onSuccess: async () => { toast.success(listing.status === "ACTIVE" ? "Listing paused" : "Listing activated"); await refresh(); }, onError: (error) => toast.error(getApiErrorMessage(error)) });
  const endMutation = useMutation({ mutationFn: () => listingsApi.end(listing.id), onSuccess: async () => { toast.success("Listing ended"); setConfirmEnd(false); await refresh(); }, onError: (error) => toast.error(getApiErrorMessage(error)) });

return <div className="space-y-3 border-b py-4 last:border-b-0"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="break-words font-semibold">{listing.title}</p><p className="mt-1 text-sm text-slate-600">{listing.allowedVehicleTypes.map((type) => type === "SUV" ? "SUV" : type.charAt(0) + type.slice(1).toLowerCase()).join(" / ")}</p><p className="mt-2 text-lg font-semibold tabular-nums">{formatBDTFromPaisa(listing.pricePerHourPaisa)}<span className="text-xs font-normal text-slate-500"> / hour</span></p><p className="mt-1 text-xs text-slate-500">Deposit {formatBDTFromPaisa(listing.securityDepositPaisa)} · {listing.overtimeBillingMode === "MULTIPLIER" ? `${(listing.overtimeMultiplierBps ?? 15000) / 10000}x overtime` : `${formatBDTFromPaisa(listing.overtimeRatePerHourPaisa ?? "0")}/hour overtime`}</p></div><div className="flex flex-wrap items-center gap-2"><Status {...listingStatus[listing.status]} />{["ACTIVE", "DRAFT", "PAUSED"].includes(listing.status) && <Button size="sm" variant="outline" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate()}>{listing.status === "ACTIVE" ? "Pause" : "Activate"}</Button>}{listing.status !== "ENDED" && <Button size="icon" variant="ghost" title="End listing" aria-label="End listing" onClick={() => setConfirmEnd(true)}><Trash2 className="size-4 text-red-600" /></Button>}</div></div>
    {["ACTIVE", "DRAFT", "PAUSED"].includes(listing.status) && <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Edit3 className="size-4" />Edit booking settings</Button>}
    {editing && <WorkspaceModal title="Edit booking settings" description={listing.title} close={() => setEditing(false)}><ListingSettingsForm listing={listing} supported={supportedVehicles} close={() => setEditing(false)} refresh={refresh} /></WorkspaceModal>}
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
  const initial = useMemo(() => {
    const hasExistingRules = rules.length > 0;
    return DAYS.map((_, dayOfWeek) => {
      const dayRules = rules.filter((item) => item.dayOfWeek === dayOfWeek);
      return {
        enabled: hasExistingRules ? dayRules.length > 0 : (dayOfWeek >= 1 && dayOfWeek <= 6),
        ranges: dayRules.length > 0
          ? dayRules.map((rule) => ({
              start: availabilityTimeInput(rule.startLocalTime),
              end: availabilityTimeInput(rule.endLocalTime),
              validFrom: rule.validFrom.slice(0, 10),
              validUntil: rule.validUntil?.slice(0, 10),
            }))
          : [{ start: "08:00", end: "22:00", validFrom: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" }), validUntil: undefined as string | undefined }],
      };
    });
  }, [rules]);
  const [draft, setDraft] = useState(initial);
  const navigation = useUnsavedNavigation(JSON.stringify(draft) !== JSON.stringify(initial));
  const save = useMutation({
    mutationFn: () => {
      const validFrom = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
      const activeRules = draft.flatMap((day, dayOfWeek) =>
        day.enabled
          ? day.ranges.map((range) => ({
              dayOfWeek,
              startLocalTime: range.start,
              endLocalTime: range.end,
              validFrom: range.validFrom || validFrom,
              ...(range.validUntil ? { validUntil: range.validUntil } : {}),
            }))
          : [],
      );
      if (activeRules.length === 0) {
        throw new Error("Select at least one day to save availability.");
      }
      for (const rule of activeRules) {
        if (!availabilityTimeInput(rule.startLocalTime) || !availabilityTimeInput(rule.endLocalTime) || rule.endLocalTime <= rule.startLocalTime)
          throw new Error(`${DAYS[rule.dayOfWeek]}: choose a closing time later than opening time.`);
      }
      return parkingResourcesApi.replaceAvailability(
        resource.id,
        activeRules,
      );
    },
    onSuccess: async () => {
      toast.success("Availability saved");
      await client.invalidateQueries({ queryKey: queryKeys.availability.byResource(resource.id) });
      await client.invalidateQueries({ queryKey: queryKeys.parkingSearch.root });
    },
    onError: (error) => toast.error(error instanceof ApiError ? getApiErrorMessage(error) : error instanceof Error ? error.message : getApiErrorMessage(error)),
  });
  const addException = useMutation({ mutationFn: (input: Parameters<typeof parkingResourcesApi.addException>[1]) => parkingResourcesApi.addException(resource.id, input), onSuccess: async () => { toast.success("Availability exception added"); await client.invalidateQueries({ queryKey: queryKeys.availability.byResource(resource.id) }); await client.invalidateQueries({ queryKey: queryKeys.parkingSearch.root }); }, onError: (error) => toast.error(getApiErrorMessage(error)) });
return <><div className="rounded-lg border bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-bold">Weekly availability · {resource.displayName}</h3><p className="text-xs text-slate-500">Bangladesh time (Asia/Dhaka)</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setDraft((current) => current.map((day, index) => index >= 1 && index <= 5 ? { enabled: current[1]!.enabled, ranges: current[1]!.ranges.map((range) => ({ ...range })) } : day))}>Copy Monday to weekdays</Button><Button variant="ghost" disabled={save.isPending} onClick={() => navigation.confirmLeave(close)}>Close</Button></div></div><div className="mt-4 space-y-3">{draft.map((day, dayIndex) => <div key={DAYS[dayIndex]} className="border-b pb-3 sm:grid sm:grid-cols-[8rem_1fr] sm:gap-3"><label className="flex h-10 items-center gap-2 text-xs font-semibold"><Checkbox checked={day.enabled} onCheckedChange={(checked) => setDraft((current) => current.map((entry, index) => index === dayIndex ? { ...entry, enabled: checked === true } : entry))} />{DAYS[dayIndex]}</label><div className="space-y-2">{day.ranges.map((range, rangeIndex) => <div key={rangeIndex} className="grid grid-cols-[1fr_1fr_auto] gap-2"><Input aria-label={`${DAYS[dayIndex]} range ${rangeIndex + 1} start`} type="time" value={range.start} disabled={!day.enabled} onChange={(event) => setDraft((current) => current.map((entry, index) => index === dayIndex ? { ...entry, ranges: entry.ranges.map((currentRange, currentIndex) => currentIndex === rangeIndex ? { ...currentRange, start: event.target.value } : currentRange) } : entry))} /><Input aria-label={`${DAYS[dayIndex]} range ${rangeIndex + 1} end`} type="time" value={range.end} disabled={!day.enabled} onChange={(event) => setDraft((current) => current.map((entry, index) => index === dayIndex ? { ...entry, ranges: entry.ranges.map((currentRange, currentIndex) => currentIndex === rangeIndex ? { ...currentRange, end: event.target.value } : currentRange) } : entry))} /><Button type="button" size="sm" variant="ghost" disabled={day.ranges.length === 1} onClick={() => setDraft((current) => current.map((entry, index) => index === dayIndex ? { ...entry, ranges: entry.ranges.filter((_, currentIndex) => currentIndex !== rangeIndex) } : entry))}>Remove</Button></div>)}{day.enabled && day.ranges.length < 2 && <Button type="button" size="sm" variant="outline" onClick={() => setDraft((current) => current.map((entry, index) => index === dayIndex ? { ...entry, ranges: [...entry.ranges, { start: "18:00", end: "22:00", validFrom: entry.ranges[0].validFrom, validUntil: entry.ranges[0].validUntil }] } : entry))}>Add second range</Button>}</div></div>)}</div><Button className="mt-4" disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending && <Loader2 className="size-4 animate-spin" />}Save availability</Button><div className="mt-6 border-t pt-5"><h4 className="font-semibold">Date-specific exception</h4><form className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); addException.mutate({ startsAt: toUtcFromBangladeshLocal(String(data.get("startsAt"))), endsAt: toUtcFromBangladeshLocal(String(data.get("endsAt"))), exceptionType: String(data.get("exceptionType")) as "BLOCKED" | "SPECIAL_AVAILABLE", reason: String(data.get("reason") || "") || undefined }, { onSuccess: () => form.reset() }); }}><Field label="Starts"><Input name="startsAt" type="datetime-local" required /></Field><Field label="Ends"><Input name="endsAt" type="datetime-local" required /></Field><Field label="Type"><select name="exceptionType" className="h-10 w-full rounded-md border bg-white px-3 text-sm"><option value="BLOCKED">Blocked</option><option value="SPECIAL_AVAILABLE">Special available</option></select></Field><Field label="Reason"><Input name="reason" maxLength={255} /></Field><Button type="submit" variant="outline" disabled={addException.isPending}>{addException.isPending && <Loader2 className="size-4 animate-spin" />}Add exception</Button></form>{exceptions.length > 0 && <div className="mt-4 space-y-2">{exceptions.map((item) => <AvailabilityExceptionRow key={item.id} resourceId={resource.id} item={item} />)}</div>}</div></div>{navigation.guard}</>;
}

function AvailabilityExceptionRow({ resourceId, item }: { resourceId: string; item: import("@/lib/api/marketplace-types").AvailabilityExceptionDto }) {
  const client = useQueryClient(); const [editing, setEditing] = useState(false);
  const [startsAt, setStartsAt] = useState(toDhakaLocalInput(item.startsAt)); const [endsAt, setEndsAt] = useState(toDhakaLocalInput(item.endsAt));
  const [exceptionType, setExceptionType] = useState(item.exceptionType); const [reason, setReason] = useState(item.reason ?? "");
  const refresh = async () => { await client.invalidateQueries({ queryKey: queryKeys.availability.byResource(resourceId) }); await client.invalidateQueries({ queryKey: queryKeys.parkingSearch.root }); };
  const update = useMutation({ mutationFn: () => parkingResourcesApi.updateException(item.id, { startsAt: toUtcFromBangladeshLocal(startsAt), endsAt: toUtcFromBangladeshLocal(endsAt), exceptionType, reason: reason.trim() || null }), onSuccess: async () => { toast.success("Availability exception updated"); setEditing(false); await refresh(); }, onError: (error) => toast.error(getApiErrorMessage(error)) });
  const remove = useMutation({ mutationFn: () => parkingResourcesApi.removeException(item.id), onSuccess: async () => { toast.success("Availability exception deleted"); await refresh(); }, onError: (error) => toast.error(getApiErrorMessage(error)) });
  if (editing) return <WorkspaceModal title="Edit availability exception" description="Date-specific availability in Bangladesh time" close={() => setEditing(false)}><div className="grid gap-4 sm:grid-cols-2"><Field label="Starts"><Input aria-label="Exception starts" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></Field><Field label="Ends"><Input aria-label="Exception ends" type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></Field><Field label="Type"><select aria-label="Exception type" value={exceptionType} onChange={(event) => setExceptionType(event.target.value as typeof exceptionType)} className="h-10 w-full rounded-md border bg-white px-3 text-sm"><option value="BLOCKED">Blocked</option><option value="SPECIAL_AVAILABLE">Special available</option></select></Field><Field label="Reason"><Input aria-label="Exception reason" value={reason} maxLength={255} onChange={(event) => setReason(event.target.value)} /></Field><div className="flex gap-2 sm:col-span-2"><Button size="sm" disabled={update.isPending || !startsAt || !endsAt} onClick={() => update.mutate()}>{update.isPending && <Loader2 className="size-4 animate-spin" />}Save</Button><Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button></div></div></WorkspaceModal>;
  return <div className="flex items-start justify-between gap-3 rounded-md bg-slate-50 p-3 text-xs"><div><strong>{item.exceptionType.replaceAll("_", " ")}</strong><span className="ml-2 text-slate-600">{formatDateTime(item.startsAt)} to {formatDateTime(item.endsAt)}</span>{item.reason && <p className="mt-1 text-slate-500">{item.reason}</p>}</div><div className="flex gap-1"><Button size="icon" variant="ghost" title="Edit exception" onClick={() => setEditing(true)}><Edit3 className="size-4" /></Button><Button size="icon" variant="ghost" title="Delete exception" disabled={remove.isPending} onClick={() => remove.mutate()}>{remove.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}</Button></div></div>;
}

function toDhakaLocalInput(value: string) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value)).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-1.5 text-xs font-semibold"><span>{label}</span>{children}</label>; }
function Status({ label, className }: { label: string; className: string }) { return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${className}`}>{label}</span>; }
function PanelState({ message, loading, retry }: { message: string; loading?: boolean; retry?: () => void }) { return <div className="rounded-lg border bg-white p-8 text-center text-sm text-slate-600">{loading && <Loader2 className="mx-auto mb-2 size-5 animate-spin" />}<p>{message}</p>{retry && <Button className="mt-3" variant="outline" onClick={retry}>Retry</Button>}</div>; }
