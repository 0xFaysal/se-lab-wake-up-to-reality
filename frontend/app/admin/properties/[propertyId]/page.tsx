"use client";

import { use, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, MapPin, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AdminStatus } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "@/lib/api/admin-api";
import { adminOperationsApi } from "@/lib/api/admin-operations-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import type { AdminPropertyDetailDto } from "@/lib/api/api-types";
import { formatBDTFromPaisa } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

type Action = "APPROVE" | "REJECT" | "STATUS" | "NOTE" | "RISK" | "MERGE";

export default function AdminPropertyDetailPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(params);
  const router = useRouter();
  const client = useQueryClient();
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState("");
  const [nextStatus, setNextStatus] = useState("TEMPORARILY_CLOSED");
  const [closedUntil, setClosedUntil] = useState("");
  const [riskLevel, setRiskLevel] = useState("MEDIUM");
  const [duplicate, setDuplicate] = useState<AdminPropertyDetailDto["duplicateCandidates"][number] | null>(null);

  const query = useQuery({ queryKey: queryKeys.adminProperties.detail(propertyId), queryFn: () => adminApi.propertyDetail(propertyId) });
  const preview = useQuery({
    queryKey: ["admin", "properties", propertyId, "merge-preview", duplicate?.id],
    queryFn: () => adminApi.mergePreview(propertyId, duplicate!.id),
    enabled: action === "MERGE" && Boolean(duplicate),
  });
  const mutation = useMutation({
    mutationFn: async () => {
      if (action === "APPROVE") return adminApi.verifyProperty(propertyId, { decision: "APPROVE" });
      if (action === "REJECT") return adminApi.verifyProperty(propertyId, { decision: "REJECT", reason: reason.trim() });
      if (action === "STATUS") return adminOperationsApi.updatePropertyStatus(propertyId, {
        status: nextStatus,
        reason: reason.trim(),
        ...(nextStatus === "TEMPORARILY_CLOSED" ? { closedUntil: closedUntil ? new Date(closedUntil).toISOString() : null } : {}),
      });
      if (action === "NOTE") return adminOperationsApi.createNote({ subjectType: "PROPERTY", subjectId: propertyId, body: reason.trim() });
      if (action === "RISK") return adminOperationsApi.createRiskFlag({ targetType: "PROPERTY", targetId: propertyId, level: riskLevel, reason: reason.trim() });
      if (!duplicate) throw new Error("No duplicate Property selected");
      return adminApi.mergeProperty(propertyId, { canonicalPropertyId: duplicate.id, canonicalVersion: duplicate.version, duplicateVersion: query.data!.version, reason: reason.trim() });
    },
    onSuccess: async () => {
      toast.success(action === "MERGE" ? "Duplicate Property merged" : "Admin action completed");
      const canonicalId = duplicate?.id;
      setAction(null);
      setReason("");
      setDuplicate(null);
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.adminProperties.pendingRoot }),
        client.invalidateQueries({ queryKey: ["admin", "properties"] }),
      ]);
      if (canonicalId) router.push(`/admin/properties/${canonicalId}`);
      else await query.refetch();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  if (query.isPending) return <div className="py-24 text-center"><Loader2 className="mx-auto size-7 animate-spin" /></div>;
  if (query.isError || !query.data) return <div className="border border-red-200 bg-red-50 p-8"><p className="text-red-700">{getApiErrorMessage(query.error)}</p></div>;
  const property = query.data;
  const reasonRequired = action !== "APPROVE";

  function open(nextAction: Action) {
    setReason("");
    setAction(nextAction);
  }

  return <div className="space-y-6">
    <Link href="/admin/properties" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-800"><ArrowLeft className="size-4" />Back to Properties</Link>
    <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start">
      <div><p className="text-xs font-bold uppercase text-emerald-700">Property governance</p><h1 className="mt-1 text-3xl font-extrabold">{property.name}</h1><p className="mt-2 flex items-center gap-2 text-sm text-slate-500"><MapPin className="size-4" />{property.exactAddress}</p></div>
      <div className="flex flex-wrap gap-2"><AdminStatus value={property.verificationStatus} /><AdminStatus value={property.status} /></div>
    </header>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_340px]">
      <div className="space-y-5">
        <section className="border border-slate-200 bg-white p-5"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center"><h2 className="text-sm font-bold">Property information</h2><a href={`https://www.google.com/maps?q=${property.latitude},${property.longitude}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 hover:underline"><MapPin className="size-4" />Review coordinates on map</a></div><dl className="mt-4 grid gap-4 sm:grid-cols-2"><Info label="Public area" value={property.publicArea} /><Info label="Approximate public address" value={property.approximateAddress} /><Info label="Exact address (Admin only)" value={property.exactAddress} /><Info label="Coordinates" value={`${property.latitude}, ${property.longitude}`} /><Info label="Entrance coordinates" value={property.entranceLatitude !== null && property.entranceLongitude !== null ? `${property.entranceLatitude}, ${property.entranceLongitude}` : "Not provided"} /><Info label="Access instructions" value={property.accessInstructions ?? "Not provided"} /><Info label="Submitted by" value={`${property.creator.fullName} · ${property.creator.email}`} /></dl></section>
        <section className="border border-slate-200 bg-white p-5"><h2 className="text-sm font-bold">Verification evidence</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{property.images.map((image, index) => <div key={image.id} className="relative aspect-[4/3] overflow-hidden bg-slate-100"><Image src={image.url} alt={`Verification image ${index + 1}`} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />{image.isCover && <span className="absolute left-2 top-2 bg-black/70 px-2 py-1 text-[10px] font-bold text-white">Cover</span>}</div>)}</div>{property.images.length === 0 && <p className="mt-4 bg-amber-50 p-4 text-sm text-amber-800">No images uploaded. Approval requirements are not met.</p>}</section>
        <GovernancePanels property={property} />
      </div>

      <aside className="space-y-4">
        <section className="border border-slate-200 bg-white p-5"><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-emerald-800" /><h2 className="font-bold">Admin controls</h2></div><div className="mt-4 grid gap-2">{property.verificationStatus === "PENDING" && <><Button onClick={() => open("APPROVE")}><CheckCircle2 className="size-4" />Approve Property</Button><Button variant="outline" onClick={() => open("REJECT")}><XCircle className="size-4" />Reject Property</Button></>}<Button variant="outline" onClick={() => open("STATUS")}>Change operating status</Button><Button variant="outline" onClick={() => open("NOTE")}>Add private note</Button><Button variant="outline" onClick={() => open("RISK")}><AlertTriangle className="size-4" />Add risk flag</Button></div></section>
        <section className="border border-slate-200 bg-white p-5"><h2 className="text-sm font-bold">Possible duplicates</h2>{property.duplicateCandidates.length ? <div className="mt-3 divide-y divide-slate-100">{property.duplicateCandidates.map((candidate) => <div key={candidate.id} className="py-3 text-xs"><p className="font-bold">{candidate.name}</p><p className="text-slate-500">{candidate.approximateAddress}</p><Button className="mt-2" size="sm" variant="outline" onClick={() => { setDuplicate(candidate); open("MERGE"); }}>Preview merge</Button></div>)}</div> : <p className="mt-3 text-sm text-slate-500">No likely duplicate was found.</p>}</section>
      </aside>
    </div>

    <Dialog open={Boolean(action)} onOpenChange={(isOpen) => { if (!isOpen && !mutation.isPending) { setAction(null); setReason(""); setDuplicate(null); } }}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>{dialogTitle(action)}</DialogTitle><DialogDescription>{dialogDescription(action)}</DialogDescription></DialogHeader>
      {action === "STATUS" && <div className="grid gap-3"><select className="h-10 border bg-white px-3 text-sm" value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}>{["ACTIVE", "TEMPORARILY_CLOSED", "INACTIVE"].map((value) => <option key={value}>{value}</option>)}</select>{nextStatus === "TEMPORARILY_CLOSED" && <label className="text-xs font-semibold text-slate-600">Expected reopening<Input className="mt-1" type="datetime-local" value={closedUntil} onChange={(event) => setClosedUntil(event.target.value)} /></label>}</div>}
      {action === "RISK" && <select className="h-10 border bg-white px-3 text-sm" value={riskLevel} onChange={(event) => setRiskLevel(event.target.value)}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select>}
      {action === "MERGE" && <MergePreview query={preview} duplicate={duplicate} />}
      {reasonRequired && <Textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={action === "NOTE" ? 2 : 10} maxLength={action === "NOTE" ? 3000 : 1000} placeholder={action === "NOTE" ? "Private note" : "Operational reason (minimum 10 characters)"} />}
      <DialogFooter><Button variant="outline" disabled={mutation.isPending} onClick={() => { setAction(null); setDuplicate(null); }}>Cancel</Button><Button variant={["REJECT", "MERGE"].includes(action ?? "") ? "destructive" : "default"} disabled={mutation.isPending || (action === "MERGE" && (preview.isPending || preview.isError)) || (reasonRequired && reason.trim().length < (action === "NOTE" ? 2 : 10))} onClick={() => mutation.mutate()}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Confirm</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>;
}

function GovernancePanels({ property }: { property: AdminPropertyDetailDto }) {
  return <div className="grid gap-5 lg:grid-cols-2">
    <section className="border border-slate-200 bg-white lg:col-span-2"><h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Providers and governance roles</h2><div className="grid gap-px bg-slate-100 lg:grid-cols-2"><div className="bg-white"><h3 className="px-4 pt-4 text-xs font-bold uppercase text-slate-500">Provider memberships</h3>{property.providers.length ? <div className="divide-y divide-slate-100">{property.providers.map((membership) => <div key={membership.id} className="flex items-start justify-between gap-3 px-4 py-3 text-xs"><div><strong>{membership.provider.fullName}</strong><p className="text-slate-500">{membership.provider.email} · {membership.provider.phone}</p></div><div className="flex gap-1"><AdminStatus value={membership.status} /><AdminStatus value={membership.verificationStatus} /></div></div>)}</div> : <EmptyLine>No Provider memberships.</EmptyLine>}</div><div className="bg-white"><h3 className="px-4 pt-4 text-xs font-bold uppercase text-slate-500">Building Managers</h3>{property.buildingManagers.length ? <div className="divide-y divide-slate-100">{property.buildingManagers.map((assignment) => <div key={assignment.id} className="flex items-start justify-between gap-3 px-4 py-3 text-xs"><div><strong>{assignment.candidate.fullName}</strong><p className="text-slate-500">Nominated by {assignment.nominatedBy.fullName}</p></div><AdminStatus value={assignment.status} /></div>)}</div> : <EmptyLine>No Building Manager history.</EmptyLine>}</div></div></section>
    <section className="border border-slate-200 bg-white lg:col-span-2"><h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Parking resources and physical units</h2>{property.resources.length ? <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-xs"><thead className="bg-slate-50 text-[11px] uppercase text-slate-500"><tr><th className="px-4 py-3">Resource</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Capacity</th><th className="px-4 py-3">Units</th><th className="px-4 py-3">Rights</th><th className="px-4 py-3">Listings</th><th className="px-4 py-3">Bookings</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{property.resources.map((resource) => <tr key={resource.id}><td className="px-4 py-3 font-bold">{resource.displayName ?? resource.spotCode ?? resource.id}</td><td className="px-4 py-3">{resource.resourceType}</td><td className="px-4 py-3">{resource.capacity}</td><td className="max-w-72 px-4 py-3">{resource.resourceType === "SHARED_POOL" ? "Not applicable" : resource.units.length ? resource.units.map((unit) => unit.spotCode).join(", ") : "No units"}</td><td className="px-4 py-3">{resource._count.parkingRights}</td><td className="px-4 py-3">{resource._count.listings}</td><td className="px-4 py-3">{resource._count.bookings}</td><td className="px-4 py-3"><AdminStatus value={resource.status} /></td></tr>)}</tbody></table></div> : <EmptyLine>No parking resources.</EmptyLine>}</section>
    <section className="border border-slate-200 bg-white"><h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Parking rights</h2>{property.rights.length ? <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">{property.rights.map((right) => <div key={right.id} className="px-4 py-3 text-xs"><div className="flex justify-between gap-3"><strong>{right.holder.fullName} · {right.quantity} unit</strong><AdminStatus value={right.status} /></div><p className="mt-1 text-slate-500">{right.rightType} · {right.parkingSpot.displayName ?? right.parkingSpot.spotCode ?? right.parkingSpot.id}</p></div>)}</div> : <EmptyLine>No parking rights.</EmptyLine>}</section>
    <section className="border border-slate-200 bg-white"><h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Listings</h2>{property.listings.length ? <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">{property.listings.map((listing) => <div key={listing.id} className="flex justify-between gap-3 px-4 py-3 text-xs"><div><Link href={`/admin/marketplace/listings/${listing.id}`} className="font-bold text-emerald-800 hover:underline">{listing.title}</Link><p className="text-slate-500">{listing.provider.fullName} · {formatBDTFromPaisa(listing.pricePerHourPaisa)}/hr</p></div><AdminStatus value={listing.status} /></div>)}</div> : <EmptyLine>No listings.</EmptyLine>}</section>
    <section className="border border-slate-200 bg-white"><h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Property Guards</h2>{property.guards.length ? <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">{property.guards.map((membership) => <div key={membership.id} className="flex justify-between gap-3 px-4 py-3 text-xs"><div><strong>{membership.guard.fullName}</strong><p className="text-slate-500">{membership.guard.email} · {membership.assignments.length} recent assignments</p></div><AdminStatus value={membership.status} /></div>)}</div> : <EmptyLine>No Property Guards.</EmptyLine>}</section>
    <section className="border border-slate-200 bg-white"><h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Common rule and closure history</h2>{property.governanceHistory.length ? <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">{property.governanceHistory.map((proposal) => <div key={proposal.id} className="px-4 py-3 text-xs"><div className="flex justify-between gap-3"><strong>Proposed by {proposal.proposedBy.fullName}</strong><AdminStatus value={proposal.status} /></div><p className="mt-1 text-slate-500">{new Date(proposal.createdAt).toLocaleString("en-BD")} · {proposal.votes.length} votes</p></div>)}</div> : <EmptyLine>No governance proposals.</EmptyLine>}</section>
    <section className="border border-slate-200 bg-white"><h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Risk flags</h2>{property.riskFlags.length ? <div className="divide-y divide-slate-100">{property.riskFlags.map((flag) => <div key={flag.id} className="p-4 text-xs"><div className="flex justify-between"><AdminStatus value={flag.level} /><span>{flag.resolvedAt ? "Resolved" : "Open"}</span></div><p className="mt-2">{flag.reason}</p></div>)}</div> : <EmptyLine>No risk flags.</EmptyLine>}</section>
    <section className="border border-slate-200 bg-white"><h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Private notes</h2>{property.adminNotes.length ? <div className="divide-y divide-slate-100">{property.adminNotes.map((note) => <div key={note.id} className="p-4 text-xs"><p>{note.body}</p><p className="mt-2 text-slate-400">{note.authorAdmin.fullName} · {new Date(note.createdAt).toLocaleString("en-BD")}</p></div>)}</div> : <EmptyLine>No Admin notes.</EmptyLine>}</section>
    <section className="border border-slate-200 bg-white lg:col-span-2"><h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Recent booking activity</h2>{property.recentBookings.length ? <div className="divide-y divide-slate-100">{property.recentBookings.map((booking) => <div key={booking.id} className="grid gap-2 px-4 py-3 text-xs sm:grid-cols-4"><Link className="font-bold text-emerald-800" href={`/admin/bookings/${booking.id}`}>{booking.bookingCode}</Link><AdminStatus value={booking.status} /><span>{booking.driver.fullName}</span><span>{new Date(booking.startAt).toLocaleString("en-BD")}</span></div>)}</div> : <EmptyLine>No booking activity.</EmptyLine>}</section>
    <section className="border border-slate-200 bg-white lg:col-span-2"><h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Audit timeline</h2>{property.auditTimeline.length ? <ol className="divide-y divide-slate-100">{property.auditTimeline.slice(0, 30).map((event) => <li key={event.id} className="flex flex-col justify-between gap-1 px-4 py-3 text-xs sm:flex-row"><span><strong>{event.eventType.replaceAll("_", " ")}</strong> · {event.actor?.fullName ?? "System"}</span><time className="text-slate-400">{new Date(event.createdAt).toLocaleString("en-BD")}</time></li>)}</ol> : <EmptyLine>No audited event.</EmptyLine>}</section>
  </div>;
}

function MergePreview({ query, duplicate }: { query: UseQueryResult<Record<string, unknown>, Error>; duplicate: AdminPropertyDetailDto["duplicateCandidates"][number] | null }) {
  if (query.isPending) return <div className="flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin" />Calculating affected records…</div>;
  if (query.isError) return <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-800">{getApiErrorMessage(query.error)}</p>;
  const entities = query.data?.entitiesToMigrate as Record<string, unknown> | undefined;
  return <div className="border border-amber-200 bg-amber-50 p-3 text-sm"><p className="font-bold">Canonical destination: {duplicate?.name}</p><p className="mt-1 text-xs text-amber-900">This archives the current duplicate and moves compatible memberships, resources, rights, listings, guards and images. Booking references remain historically immutable.</p>{entities && <div className="mt-3 flex flex-wrap gap-2">{Object.entries(entities).map(([key, value]) => <span key={key} className="bg-white px-2 py-1 text-xs">{key}: {String(value)}</span>)}</div>}</div>;
}

function dialogTitle(action: Action | null) {
  if (action === "APPROVE") return "Approve Property";
  if (action === "REJECT") return "Reject Property";
  if (action === "STATUS") return "Change operating status";
  if (action === "NOTE") return "Add private Admin note";
  if (action === "RISK") return "Create Property risk flag";
  return "Merge duplicate Property";
}

function dialogDescription(action: Action | null) {
  if (action === "APPROVE") return "Approval is allowed only when identity, location, image and Provider requirements pass backend validation.";
  if (action === "MERGE") return "Review the affected-record preview carefully. The merge is transactional, version-checked and permanently audited.";
  return "Provide a clear reason. This action is recorded in the private governance history.";
}

function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-bold uppercase text-slate-500">{label}</dt><dd className="mt-1 text-sm leading-relaxed text-slate-800">{value}</dd></div>; }
function EmptyLine({ children }: { children: ReactNode }) { return <p className="p-4 text-sm text-slate-500">{children}</p>; }
