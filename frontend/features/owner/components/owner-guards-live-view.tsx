"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Mail, ShieldCheck, UserPlus, Users } from "lucide-react";
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
import {
  PageEmptyState,
  PageErrorState,
  PageSkeleton,
  ProviderPage,
  ProviderPageHeader,
} from "@/components/owner/provider-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GuardAssignmentDto } from "@/lib/api/api-types";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { guardApi, type GuardFilters } from "@/lib/api/guard-api";
import { propertyApi } from "@/lib/api/property-api";
import { userApi } from "@/lib/api/user-api";
import { guardStatus } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

type GuardAction = "add" | "assign" | "create";

export function OwnerGuardsLiveView({ initialPropertyId = "" }: { initialPropertyId?: string }) {
  const client = useQueryClient();
  const [filters, setFilters] = useState<GuardFilters>({ limit: 100 });
  const [propertyId, setPropertyId] = useState(initialPropertyId);
  const [action, setAction] = useState<GuardAction>("add");
  const [identifier, setIdentifier] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [membershipId, setMembershipId] = useState("");
  const [shiftStart, setShiftStart] = useState("08:00");
  const [shiftEnd, setShiftEnd] = useState("17:00");
  const [editTarget, setEditTarget] = useState<GuardAssignmentDto | null>(null);
  const [endTarget, setEndTarget] = useState<GuardAssignmentDto | null>(null);

  const properties = useQuery({
    queryKey: queryKeys.properties.all(),
    queryFn: propertyApi.list,
  });
  const assignments = useQuery({
    queryKey: queryKeys.ownerGuardAssignments.all(filters),
    queryFn: () => guardApi.listForProvider(filters),
  });
  const memberships = useQuery({
    queryKey: queryKeys.propertyGuards.byProperty(propertyId),
    queryFn: () => guardApi.propertyMemberships(propertyId),
    enabled: Boolean(propertyId),
  });
  const activeMemberships = useMemo(
    () => memberships.data?.filter((item) => item.status === "ACTIVE") ?? [],
    [memberships.data],
  );
  const invalidate = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.ownerGuardAssignments.root }),
      client.invalidateQueries({ queryKey: ["property-guards"] }),
    ]);
  };
  const invite = useMutation({
    mutationFn: () => guardApi.invite(propertyId, identifier),
    onSuccess: async () => {
      setIdentifier("");
      toast.success("Guard invitation sent");
      await invalidate();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  const createUser = useMutation({
    mutationFn: () => userApi.createGuard({ fullName, email, phone }),
    onSuccess: () => {
      setIdentifier(email);
      setFullName("");
      setEmail("");
      setPhone("");
      setAction("add");
      toast.success("Guard account created. Add the Guard to a Property next.");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  const createAssignment = useMutation({
    mutationFn: () => guardApi.createAssignment(propertyId, {
      guardMembershipId: membershipId,
      shiftStart,
      shiftEnd,
    }),
    onSuccess: async () => {
      setMembershipId("");
      toast.success("Guard shift assigned");
      await invalidate();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof guardApi.update>[1] }) => guardApi.update(id, body),
    onSuccess: async () => {
      setEditTarget(null);
      toast.success("Guard assignment updated");
      await invalidate();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  const end = useMutation({
    mutationFn: guardApi.end,
    onSuccess: async () => {
      setEndTarget(null);
      toast.success("Guard assignment ended");
      await invalidate();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  return (
    <ProviderPage>
      <ProviderPageHeader
        title="Guards"
        description="Add Guards to a shared Property directory, then assign accepted Guards to your parking operation."
        breadcrumbs={[{ label: "Operations" }, { label: "Guards" }]}
      />

      <section className="grid gap-3 md:grid-cols-3">
        <ActionChoice
          active={action === "add"}
          icon={Mail}
          title="Add Guard to Property"
          description="Invite an existing Guard by email or phone."
          onClick={() => setAction("add")}
        />
        <ActionChoice
          active={action === "assign"}
          icon={ShieldCheck}
          title="Assign Existing Guard"
          description="Assign an accepted Property Guard to your shift."
          onClick={() => setAction("assign")}
        />
        <ActionChoice
          active={action === "create"}
          icon={UserPlus}
          title="Create Guard Account"
          description="Send secure setup to a person without an account."
          onClick={() => setAction("create")}
        />
      </section>

      <section className="border bg-white p-5">
        <h2 className="font-bold">
          {action === "add" ? "Add Guard to Property" : action === "assign" ? "Assign an accepted Guard" : "Create a Guard account"}
        </h2>
        {action !== "create" && (
          <label className="mt-4 block max-w-md space-y-2 text-sm font-semibold">
            <span>Property</span>
            <select
              required
              value={propertyId}
              onChange={(event) => {
                setPropertyId(event.target.value);
                setMembershipId("");
              }}
              className="h-10 w-full rounded-md border bg-white px-3 font-normal"
            >
              <option value="">Select Property</option>
              {properties.data?.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}
            </select>
          </label>
        )}
        {action === "add" && (
          <form className="mt-4 flex max-w-2xl flex-col gap-3 sm:flex-row" onSubmit={(event) => { event.preventDefault(); invite.mutate(); }}>
            <label className="flex-1 space-y-2 text-sm font-semibold"><span>Guard email or phone</span><Input required value={identifier} onChange={(event) => setIdentifier(event.target.value)} /></label>
            <Button type="submit" className="sm:mt-7" disabled={invite.isPending || !propertyId}>Send invitation</Button>
          </form>
        )}
        {action === "assign" && (
          <form className="mt-4 grid gap-3 md:grid-cols-4" onSubmit={(event) => { event.preventDefault(); createAssignment.mutate(); }}>
            <label className="space-y-2 text-sm font-semibold"><span>Accepted Guard</span><select required value={membershipId} onChange={(event) => setMembershipId(event.target.value)} className="h-10 w-full rounded-md border bg-white px-3 font-normal"><option value="">Select Guard</option>{activeMemberships.map((item) => <option key={item.id} value={item.id}>{item.guard?.fullName ?? item.id}</option>)}</select></label>
            <label className="space-y-2 text-sm font-semibold"><span>Shift starts</span><Input type="time" value={shiftStart} onChange={(event) => setShiftStart(event.target.value)} /></label>
            <label className="space-y-2 text-sm font-semibold"><span>Shift ends</span><Input type="time" value={shiftEnd} onChange={(event) => setShiftEnd(event.target.value)} /></label>
            <Button type="submit" className="md:mt-7" disabled={createAssignment.isPending || !propertyId || !membershipId}>Assign shift</Button>
            {propertyId && !memberships.isPending && activeMemberships.length === 0 && <p className="text-sm text-amber-800 md:col-span-4">No accepted Guards are available. Invite a Guard first; assignment becomes available after they accept.</p>}
          </form>
        )}
        {action === "create" && (
          <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={(event) => { event.preventDefault(); createUser.mutate(); }}>
            <label className="space-y-2 text-sm font-semibold"><span>Full name</span><Input required value={fullName} onChange={(event) => setFullName(event.target.value)} /></label>
            <label className="space-y-2 text-sm font-semibold"><span>Email</span><Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label className="space-y-2 text-sm font-semibold"><span>Bangladesh phone</span><Input required value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
            <p className="text-xs leading-5 text-slate-600 sm:col-span-2">A single-use secure account setup link will be emailed to the Guard. No plaintext temporary password is created.</p>
            <Button type="submit" disabled={createUser.isPending}>Create and continue</Button>
          </form>
        )}
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="font-bold">My Guard assignments</h2><p className="mt-1 text-sm text-slate-600">Provider-controlled shifts across your Properties.</p></div>
          <div className="flex gap-2">
            <select aria-label="Filter by Property" value={filters.propertyId ?? ""} onChange={(event) => setFilters((current) => ({ ...current, propertyId: event.target.value || undefined }))} className="h-10 rounded-md border bg-white px-3 text-sm"><option value="">All Properties</option>{properties.data?.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}</select>
            <select aria-label="Filter by status" value={filters.status ?? ""} onChange={(event) => setFilters((current) => ({ ...current, status: (event.target.value || undefined) as GuardFilters["status"] }))} className="h-10 rounded-md border bg-white px-3 text-sm"><option value="">All statuses</option>{Object.keys(guardStatus).map((status) => <option key={status} value={status}>{guardStatus[status as keyof typeof guardStatus].label}</option>)}</select>
          </div>
        </div>
        {assignments.isPending ? (
          <PageSkeleton label="Loading Guard assignments" />
        ) : assignments.isError ? (
          <PageErrorState message={getApiErrorMessage(assignments.error)} retry={() => void assignments.refetch()} />
        ) : assignments.data.assignments.length === 0 ? (
          <PageEmptyState title="No matching Guard assignments" description="Add a Guard to a Property, wait for acceptance, then assign a working shift." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {assignments.data.assignments.map((item) => {
              const badge = guardStatus[item.status];
              return (
                <article key={item.id} className="border bg-white p-5">
                  <div className="flex justify-between gap-3">
                    <div><h3 className="font-bold">{item.guard?.fullName ?? "Guard"}</h3><p className="mt-1 text-xs text-slate-500">{item.guard?.emailMasked} · {item.guard?.phoneMasked}</p></div>
                    <span className={`h-fit rounded-full px-2 py-1 text-[10px] font-bold ${badge.className}`}>{badge.label}</span>
                  </div>
                  <p className="mt-4 text-sm font-semibold">{item.property.name}</p>
                  <p className="mt-2 flex items-center gap-2 text-xs text-slate-600"><Clock className="size-4" />{item.shiftStart ?? "Not set"} – {item.shiftEnd ?? "Not set"}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditTarget(item); setShiftStart(item.shiftStart ?? "08:00"); setShiftEnd(item.shiftEnd ?? "17:00"); }}>Edit shift</Button>
                    {item.status === "ACTIVE" && <Button size="sm" variant="outline" onClick={() => update.mutate({ id: item.id, body: { action: "SUSPEND" } })}>Suspend</Button>}
                    {item.status === "SUSPENDED" && <Button size="sm" variant="outline" onClick={() => update.mutate({ id: item.id, body: { action: "RESUME" } })}>Resume</Button>}
                    {!["ENDED", "CANCELLED"].includes(item.status) && <Button size="sm" variant="destructive" onClick={() => setEndTarget(item)}>End</Button>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {editTarget && (
        <div role="dialog" aria-modal="true" aria-labelledby="edit-shift-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={(event) => { event.preventDefault(); update.mutate({ id: editTarget.id, body: { action: "UPDATE_SHIFT", shiftStart, shiftEnd } }); }} className="w-full max-w-sm space-y-4 rounded-md bg-white p-6">
            <h2 id="edit-shift-title" className="text-lg font-bold">Update Guard shift</h2>
            <div className="grid grid-cols-2 gap-2"><label className="text-xs font-bold">Start<Input type="time" className="mt-1" value={shiftStart} onChange={(event) => setShiftStart(event.target.value)} /></label><label className="text-xs font-bold">End<Input type="time" className="mt-1" value={shiftEnd} onChange={(event) => setShiftEnd(event.target.value)} /></label></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button><Button type="submit" disabled={update.isPending}>Update shift</Button></div>
          </form>
        </div>
      )}
      <AlertDialog open={Boolean(endTarget)} onOpenChange={(open) => { if (!open && !end.isPending) setEndTarget(null); }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>End this Guard assignment?</AlertDialogTitle><AlertDialogDescription>The assignment cannot be resumed after it ends.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={end.isPending} onClick={() => endTarget && end.mutate(endTarget.id)}>End assignment</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </ProviderPage>
  );
}

function ActionChoice({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: typeof Users;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`border p-4 text-left ${active ? "border-emerald-700 bg-emerald-50" : "bg-white hover:border-slate-400"}`}>
      <Icon className="size-5 text-emerald-700" /><strong className="mt-3 block text-sm">{title}</strong><span className="mt-1 block text-xs leading-5 text-slate-600">{description}</span>
    </button>
  );
}
