"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  Hourglass,
  Info,
  Mail,
  ShieldCheck,
  UserPlus,
  Users,
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
import { Button as CanonicalButton } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select as CanonicalSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PageEmptyState,
  PageErrorState,
  PageSkeleton,
  ProviderPage,
  ProviderPageHeader,
} from "@/components/provider/provider-page";
import type { GuardAssignmentDto, GuardAssignmentStatus, PropertyGuardMembershipDto } from "@/lib/api/api-types";
import { ApiError, getApiErrorMessage } from "@/lib/api/api-error";
import { guardApi } from "@/lib/api/guard-api";
import { propertyApi } from "@/lib/api/property-api";
import { userApi } from "@/lib/api/user-api";
import { formatDateTime, guardStatus } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

type GuardAction = "invite" | "create" | "assign";
type Notice = { tone: "success" | "warning" | "info"; title: string; message: string };
const allStatuses = "ALL" as const;

export function OwnerGuardsLiveView({ initialPropertyId = "" }: { initialPropertyId?: string }) {
  const client = useQueryClient();
  const [propertyId, setPropertyId] = useState(initialPropertyId);
  const [action, setAction] = useState<GuardAction>("invite");
  const [assignmentStatus, setAssignmentStatus] = useState<GuardAssignmentStatus | typeof allStatuses>(allStatuses);
  const [identifier, setIdentifier] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [membershipId, setMembershipId] = useState("");
  const [shiftStart, setShiftStart] = useState("08:00");
  const [shiftEnd, setShiftEnd] = useState("17:00");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [formError, setFormError] = useState("");
  const [editTarget, setEditTarget] = useState<GuardAssignmentDto | null>(null);
  const [endTarget, setEndTarget] = useState<GuardAssignmentDto | null>(null);

  const properties = useQuery({ queryKey: queryKeys.properties.all(), queryFn: propertyApi.list });
  const selectedPropertyId = propertyId || properties.data?.[0]?.id || "";
  const selectedProperty = properties.data?.find((property) => property.id === selectedPropertyId);
  const assignmentFilters = useMemo(() => ({
    limit: 100,
    ...(selectedPropertyId ? { propertyId: selectedPropertyId } : {}),
    ...(assignmentStatus !== allStatuses ? { status: assignmentStatus } : {}),
  }), [assignmentStatus, selectedPropertyId]);
  const assignments = useQuery({
    queryKey: queryKeys.ownerGuardAssignments.all(assignmentFilters),
    queryFn: () => guardApi.listForProvider(assignmentFilters),
  });
  const memberships = useQuery({
    queryKey: queryKeys.propertyGuards.byProperty(selectedPropertyId),
    queryFn: () => guardApi.propertyMemberships(selectedPropertyId),
    enabled: Boolean(selectedPropertyId),
  });

  const propertyMemberships = memberships.data ?? [];
  const activeMemberships = propertyMemberships.filter((item) => item.status === "ACTIVE");
  const pendingMemberships = propertyMemberships.filter((item) => item.status === "PENDING_ACCEPTANCE");
  const currentAssignments = assignments.data?.assignments ?? [];
  const activeAssignments = currentAssignments.filter((item) => item.status === "ACTIVE");

  const invalidate = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.ownerGuardAssignments.root }),
      client.invalidateQueries({ queryKey: ["property-guards"] }),
      client.invalidateQueries({ queryKey: queryKeys.guardMemberships.root }),
      client.invalidateQueries({ queryKey: queryKeys.guardAssignments.root }),
    ]);
  };

  const invite = useMutation({
    mutationFn: () => guardApi.invite(selectedPropertyId, identifier.trim()),
    onSuccess: async (membership) => {
      setIdentifier("");
      setFormError("");
      setNotice({
        tone: "success",
        title: `${membership.guard?.fullName ?? "Guard"} was added to ${membership.property.name}`,
        message: "The Guard must sign in and accept the property invitation. After acceptance, assign a working shift from this page.",
      });
      toast.success("Property invitation sent");
      await invalidate();
    },
    onError: async (error) => {
      await invalidate();
      if (error instanceof ApiError && error.code === "PROPERTY_GUARD_MEMBERSHIP_ALREADY_EXISTS") {
        setNotice({
          tone: "info",
          title: "This Guard is already in the property directory",
          message: "Check the directory beside this form. If the status is Waiting for acceptance, the Guard must accept first. If it is Ready to assign, choose Assign shift.",
        });
        setFormError("");
        return;
      }
      setFormError(getApiErrorMessage(error));
    },
  });

  const createUser = useMutation({
    mutationFn: async () => {
      const account = await userApi.createGuard({ fullName: fullName.trim(), email: email.trim(), phone: phone.trim() });
      try {
        const membership = await guardApi.invite(selectedPropertyId, account.user.email);
        return { account, membership, inviteError: null as unknown };
      } catch (inviteError) {
        return { account, membership: null, inviteError };
      }
    },
    onSuccess: async ({ account, membership, inviteError }) => {
      setFullName("");
      setPhone("");
      setEmail("");
      setFormError("");
      if (membership) {
        setAction("assign");
        setNotice({
          tone: "success",
          title: `${account.user.fullName}'s Guard account and property invitation are ready`,
          message: "A secure setup link was sent. The shift selector will unlock after the Guard completes setup and accepts the property invitation.",
        });
        toast.success("Guard account created and invited");
      } else {
        setIdentifier(account.user.email);
        setAction("invite");
        setNotice({
          tone: "warning",
          title: "Guard account created; property invitation needs attention",
          message: `${getApiErrorMessage(inviteError)} The Guard account was preserved. Review the prefilled invitation and send it again.`,
        });
      }
      await invalidate();
    },
    onError: (error) => setFormError(getApiErrorMessage(error)),
  });

  const createAssignment = useMutation({
    mutationFn: () => guardApi.createAssignment(selectedPropertyId, { guardMembershipId: membershipId, shiftStart, shiftEnd }),
    onSuccess: async (assignment) => {
      setMembershipId("");
      setFormError("");
      setNotice({ tone: "success", title: `${assignment.guard?.fullName ?? "Guard"} is assigned`, message: `The ${shiftStart}–${shiftEnd} shift is active now. The Guard portal will show the property and eligible bookings.` });
      toast.success("Guard shift assigned");
      await invalidate();
    },
    onError: (error) => setFormError(getApiErrorMessage(error)),
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof guardApi.update>[1] }) => guardApi.update(id, body),
    onSuccess: async () => { setEditTarget(null); toast.success("Guard assignment updated"); await invalidate(); },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  const end = useMutation({
    mutationFn: guardApi.end,
    onSuccess: async () => { setEndTarget(null); toast.success("Guard assignment ended"); await invalidate(); },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const changeProperty = (value: string | null) => {
    if (!value) return;
    setPropertyId(value);
    setMembershipId("");
    setNotice(null);
    setFormError("");
  };

  if (properties.isPending) return <ProviderPage><PageSkeleton label="Loading Guard workspace" /></ProviderPage>;
  if (properties.isError) return <ProviderPage><PageErrorState message={getApiErrorMessage(properties.error)} retry={() => void properties.refetch()} /></ProviderPage>;

  return (
    <ProviderPage className="max-w-[88rem] space-y-7">
      <ProviderPageHeader
        title="Guards & gate access"
        description="Create or find a Guard, add them to a Property, wait for acceptance, then activate a Provider shift. Every stage and next action is visible here."
        breadcrumbs={[{ label: "Operations" }, { label: "Guards" }]}
        actions={properties.data.length > 0 ? (
          <div className="min-w-64">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Working property</label>
            <CanonicalSelect value={selectedPropertyId} onValueChange={changeProperty}>
              <SelectTrigger className="min-h-11 bg-white"><SelectValue placeholder="Choose a property" /></SelectTrigger>
              <SelectContent align="end">{properties.data.map((property) => <SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>)}</SelectContent>
            </CanonicalSelect>
          </div>
        ) : undefined}
      />

      {properties.data.length === 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div><h2 className="font-bold text-amber-950">Add a verified Property first</h2><p className="mt-1 text-sm leading-6 text-amber-900/75">A Guard membership and shift must belong to a Property.</p></div>
          <CanonicalButton render={<Link href="/provider/properties/new" />} className="mt-4 min-h-11 sm:mt-0">Add Property <ArrowRight className="size-4" /></CanonicalButton>
        </section>
      ) : (
        <>
          <section className="overflow-hidden rounded-3xl border border-emerald-900/10 bg-emerald-950 text-white shadow-[0_18px_55px_rgba(6,78,59,0.12)]">
            <div className="grid gap-6 px-6 py-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:px-8">
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Gate team handoff</p><h2 className="mt-2 text-2xl font-black tracking-[-0.03em] sm:text-3xl">{selectedProperty?.name ?? "Selected property"}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">A Guard becomes operational only after property acceptance and a Provider shift. Account creation alone does not grant booking access.</p></div>
              <dl className="grid grid-cols-3 gap-2 text-center">
                <Metric label="Directory" value={propertyMemberships.length} />
                <Metric label="Waiting" value={pendingMemberships.length} tone="amber" />
                <Metric label="Active shifts" value={activeAssignments.length} tone="mint" />
              </dl>
            </div>
            <ol className="grid border-t border-white/10 bg-white/[0.04] sm:grid-cols-2 xl:grid-cols-4">
              <FlowStep number="1" title="Create or find" detail="Guard identity" done={propertyMemberships.length > 0} />
              <FlowStep number="2" title="Add to Property" detail="Invitation sent" done={propertyMemberships.length > 0} />
              <FlowStep number="3" title="Guard accepts" detail="Property access" done={activeMemberships.length > 0} current={pendingMemberships.length > 0} />
              <FlowStep number="4" title="Assign shift" detail="Booking access" done={activeAssignments.length > 0} current={activeMemberships.length > 0 && activeAssignments.length === 0} />
            </ol>
          </section>

          {notice && <StatusNotice notice={notice} onDismiss={() => setNotice(null)} />}

          <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(28rem,1.1fr)]">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_10px_35px_rgba(6,78,59,0.04)]">
              <div className="border-b border-slate-200 p-4 sm:p-5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">Next action</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <ActionChoice active={action === "invite"} icon={Mail} title="Add existing" description="Invite by contact" onClick={() => { setAction("invite"); setFormError(""); }} />
                  <ActionChoice active={action === "create"} icon={UserPlus} title="Create account" description="New Guard" onClick={() => { setAction("create"); setFormError(""); }} />
                  <ActionChoice active={action === "assign"} icon={ShieldCheck} title="Assign shift" description="Activate access" onClick={() => { setAction("assign"); setFormError(""); }} />
                </div>
              </div>
              <div className="p-5 sm:p-6">
                {action === "invite" && <InviteForm identifier={identifier} setIdentifier={setIdentifier} pending={invite.isPending} error={formError} onSubmit={() => {
                  if (identifier.trim().length < 3) { setFormError("Enter the Guard's complete email address or Bangladesh phone number."); return; }
                  setFormError(""); invite.mutate();
                }} />}
                {action === "create" && <CreateForm fullName={fullName} email={email} phone={phone} setFullName={setFullName} setEmail={setEmail} setPhone={setPhone} pending={createUser.isPending} error={formError} onSubmit={() => {
                  if (!fullName.trim() || !email.trim() || !phone.trim()) { setFormError("Complete the Guard's name, email, and Bangladesh phone number."); return; }
                  setFormError(""); createUser.mutate();
                }} />}
                {action === "assign" && <AssignForm memberships={activeMemberships} membershipId={membershipId} setMembershipId={setMembershipId} shiftStart={shiftStart} shiftEnd={shiftEnd} setShiftStart={setShiftStart} setShiftEnd={setShiftEnd} pending={createAssignment.isPending} waitingCount={pendingMemberships.length} error={formError} onSubmit={() => {
                  if (!membershipId) { setFormError("Choose a Guard whose property invitation is accepted."); return; }
                  if (shiftStart >= shiftEnd) { setFormError("Shift end must be later than shift start."); return; }
                  setFormError(""); createAssignment.mutate();
                }} />}
              </div>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_10px_35px_rgba(6,78,59,0.04)]" aria-labelledby="directory-heading">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
                <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">Property directory</p><h2 id="directory-heading" className="mt-1 text-xl font-black tracking-tight text-slate-950">Every Guard at this Property</h2><p className="mt-1 text-sm text-slate-500">Pending Guards appear here before they can receive a shift.</p></div>
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 font-black text-emerald-900">{propertyMemberships.length}</span>
              </div>
              {memberships.isPending ? <div className="p-5"><PageSkeleton label="Loading property Guards" /></div> : memberships.isError ? <div className="p-5"><PageErrorState message={getApiErrorMessage(memberships.error)} retry={() => void memberships.refetch()} /></div> : propertyMemberships.length === 0 ? (
                <div className="px-6 py-12 text-center"><Users className="mx-auto size-9 text-slate-300" /><h3 className="mt-4 font-bold text-slate-950">No Guards in this property yet</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Add an existing Guard or create a new account. The invitation will appear here immediately.</p></div>
              ) : <div className="divide-y divide-slate-200">{propertyMemberships.map((item) => <MembershipRow key={item.id} item={item} onAssign={() => { setMembershipId(item.id); setAction("assign"); setFormError(""); }} />)}</div>}
            </section>
          </section>

          <section aria-labelledby="shift-heading">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">Provider-controlled access</p><h2 id="shift-heading" className="mt-1 text-2xl font-black tracking-[-0.025em] text-slate-950">Shift assignments</h2><p className="mt-1 text-sm text-slate-500">Only an active shift lets the Guard view and operate this Provider’s eligible bookings.</p></div>
              <div className="w-full sm:w-52"><label className="mb-1.5 block text-xs font-bold text-slate-600">Assignment status</label><CanonicalSelect value={assignmentStatus} onValueChange={(value) => value && setAssignmentStatus(value as GuardAssignmentStatus | typeof allStatuses)}><SelectTrigger className="min-h-11 bg-white"><SelectValue /></SelectTrigger><SelectContent align="end"><SelectItem value={allStatuses}>All statuses</SelectItem>{Object.entries(guardStatus).map(([value, item]) => <SelectItem key={value} value={value}>{item.label}</SelectItem>)}</SelectContent></CanonicalSelect></div>
            </div>
            <div className="mt-4">
              {assignments.isPending ? <PageSkeleton label="Loading Guard shifts" /> : assignments.isError ? <PageErrorState message={getApiErrorMessage(assignments.error)} retry={() => void assignments.refetch()} /> : currentAssignments.length === 0 ? <PageEmptyState title={assignmentStatus === allStatuses ? "No shifts assigned at this Property" : "No assignments match this status"} description={pendingMemberships.length > 0 ? "A Guard is waiting to accept the Property invitation. Assign a shift after acceptance." : activeMemberships.length > 0 ? "A Guard is ready. Use Assign shift above to activate booking access." : "Add a Guard to the Property and wait for acceptance before assigning a shift."} /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{currentAssignments.map((item) => <AssignmentCard key={item.id} item={item} onEdit={() => { setEditTarget(item); setShiftStart(item.shiftStart ?? "08:00"); setShiftEnd(item.shiftEnd ?? "17:00"); }} onSuspend={() => update.mutate({ id: item.id, body: { action: "SUSPEND" } })} onResume={() => update.mutate({ id: item.id, body: { action: "RESUME" } })} onEnd={() => setEndTarget(item)} pending={update.isPending} />)}</div>}
            </div>
          </section>
        </>
      )}

      <Dialog open={Boolean(editTarget)} onOpenChange={(open) => { if (!open && !update.isPending) setEditTarget(null); }}>
        <DialogContent className="max-w-md p-5"><DialogHeader><DialogTitle>Update Guard shift</DialogTitle><DialogDescription>Change the working window for {editTarget?.guard?.fullName ?? "this Guard"}. Booking access remains limited to the assigned Property and Provider.</DialogDescription></DialogHeader><form noValidate onSubmit={(event) => { event.preventDefault(); if (!editTarget) return; if (shiftStart >= shiftEnd) { toast.error("Shift end must be later than shift start"); return; } update.mutate({ id: editTarget.id, body: { action: "UPDATE_SHIFT", shiftStart, shiftEnd } }); }} className="space-y-4"><div className="grid grid-cols-2 gap-3"><Field label="Shift starts"><Input type="time" className="text-base sm:text-sm" value={shiftStart} onChange={(event) => setShiftStart(event.target.value)} /></Field><Field label="Shift ends"><Input type="time" className="text-base sm:text-sm" value={shiftEnd} onChange={(event) => setShiftEnd(event.target.value)} /></Field></div><DialogFooter><CanonicalButton type="button" variant="outline" onClick={() => setEditTarget(null)} disabled={update.isPending}>Cancel</CanonicalButton><CanonicalButton type="submit" disabled={update.isPending}>{update.isPending ? "Updating…" : "Update shift"}</CanonicalButton></DialogFooter></form></DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(endTarget)} onOpenChange={(open) => { if (!open && !end.isPending) setEndTarget(null); }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>End {endTarget?.guard?.fullName ?? "this Guard"}’s assignment?</AlertDialogTitle><AlertDialogDescription>The Guard will immediately lose access to this Provider’s bookings at {endTarget?.property.name}. An ended assignment cannot be resumed.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={end.isPending}>Keep assignment</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={end.isPending} onClick={() => endTarget && end.mutate(endTarget.id)}>{end.isPending ? "Ending…" : "End assignment"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </ProviderPage>
  );
}

function Metric({ label, value, tone = "white" }: { label: string; value: number; tone?: "white" | "amber" | "mint" }) {
  return <div className={cn("min-w-20 rounded-xl border px-3 py-3", tone === "amber" ? "border-amber-300/20 bg-amber-300/10" : tone === "mint" ? "border-emerald-300/20 bg-emerald-300/10" : "border-white/10 bg-white/[0.06]")}><dt className="text-[0.62rem] font-bold uppercase tracking-wide text-white/55">{label}</dt><dd className={cn("mt-1 text-xl font-black", tone === "amber" ? "text-amber-300" : tone === "mint" ? "text-emerald-300" : "text-white")}>{value}</dd></div>;
}

function FlowStep({ number, title, detail, done, current = false }: { number: string; title: string; detail: string; done: boolean; current?: boolean }) {
  return <li className={cn("flex items-center gap-3 border-white/10 px-5 py-4 sm:border-r xl:last:border-r-0", current && "bg-amber-300/10")}><span className={cn("grid size-8 shrink-0 place-items-center rounded-full border text-xs font-black", done ? "border-emerald-300 bg-emerald-300 text-emerald-950" : current ? "border-amber-300 bg-amber-300 text-amber-950" : "border-white/20 text-white/50")}>{done ? <Check className="size-4" aria-hidden="true" /> : number}</span><span><strong className="block text-sm text-white">{title}</strong><span className="block text-xs text-white/45">{detail}</span></span></li>;
}

function ActionChoice({ active, icon: Icon, title, description, onClick }: { active: boolean; icon: typeof Users; title: string; description: string; onClick: () => void }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={cn("min-h-20 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800", active ? "border-emerald-800 bg-emerald-50 text-emerald-950" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-700/35 hover:bg-emerald-50/40")}><Icon className="size-4" aria-hidden="true" /><strong className="mt-2 block text-xs">{title}</strong><span className="mt-0.5 block text-[0.68rem] text-slate-500">{description}</span></button>;
}

function InviteForm({ identifier, setIdentifier, pending, error, onSubmit }: { identifier: string; setIdentifier: (value: string) => void; pending: boolean; error: string; onSubmit: () => void }) {
  return <form noValidate onSubmit={(event) => { event.preventDefault(); onSubmit(); }}><FormIntro icon={Mail} title="Add an existing Guard" description="Use the email or phone number already connected to their ParkEase Guard account." /><Field label="Guard email or phone" error={error}><Input value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="guard@example.com or 01XXXXXXXXX" autoComplete="off" className="min-h-11 text-base sm:text-sm" aria-invalid={Boolean(error)} /></Field><CanonicalButton type="submit" size="lg" className="mt-5 min-h-11 w-full" disabled={pending}>{pending ? "Sending invitation…" : "Send property invitation"}</CanonicalButton></form>;
}

function CreateForm({ fullName, email, phone, setFullName, setEmail, setPhone, pending, error, onSubmit }: { fullName: string; email: string; phone: string; setFullName: (value: string) => void; setEmail: (value: string) => void; setPhone: (value: string) => void; pending: boolean; error: string; onSubmit: () => void }) {
  return <form noValidate onSubmit={(event) => { event.preventDefault(); onSubmit(); }}><FormIntro icon={UserPlus} title="Create and invite a new Guard" description="One action creates the secure account and adds the Guard to the selected Property." /><div className="space-y-4"><Field label="Full name"><Input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" className="min-h-11 text-base sm:text-sm" /></Field><Field label="Email"><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="min-h-11 text-base sm:text-sm" /></Field><Field label="Bangladesh phone" error={error}><Input type="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="01XXXXXXXXX" autoComplete="tel" className="min-h-11 text-base sm:text-sm" aria-invalid={Boolean(error)} /></Field></div><div className="mt-4 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-950"><strong>What happens next:</strong> a secure setup link is emailed to the Guard. They must finish setup and accept the Property invitation before a shift can be assigned.</div><CanonicalButton type="submit" size="lg" className="mt-5 min-h-11 w-full" disabled={pending}>{pending ? "Creating and inviting…" : "Create account & invite"}</CanonicalButton></form>;
}

function AssignForm({ memberships, membershipId, setMembershipId, shiftStart, shiftEnd, setShiftStart, setShiftEnd, pending, waitingCount, error, onSubmit }: { memberships: PropertyGuardMembershipDto[]; membershipId: string; setMembershipId: (value: string) => void; shiftStart: string; shiftEnd: string; setShiftStart: (value: string) => void; setShiftEnd: (value: string) => void; pending: boolean; waitingCount: number; error: string; onSubmit: () => void }) {
  return <form noValidate onSubmit={(event) => { event.preventDefault(); onSubmit(); }}><FormIntro icon={ShieldCheck} title="Assign a working shift" description="Only Guards who accepted the Property invitation are available here." />{memberships.length === 0 ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>No Guard is ready to assign.</strong><p className="mt-1 text-amber-900/80">{waitingCount > 0 ? `${waitingCount} invitation${waitingCount === 1 ? " is" : "s are"} waiting for Guard acceptance. Ask the Guard to open Assignments and accept.` : "Add a Guard to this Property first."}</p></div> : <><Field label="Accepted Guard"><CanonicalSelect value={membershipId || null} onValueChange={(value) => value && setMembershipId(value)}><SelectTrigger className="min-h-11"><SelectValue placeholder="Choose a ready Guard" /></SelectTrigger><SelectContent>{memberships.map((item) => <SelectItem key={item.id} value={item.id}>{item.guard?.fullName ?? "Guard"}</SelectItem>)}</SelectContent></CanonicalSelect></Field><div className="mt-4 grid grid-cols-2 gap-3"><Field label="Shift starts"><Input type="time" value={shiftStart} onChange={(event) => setShiftStart(event.target.value)} className="min-h-11 text-base sm:text-sm" /></Field><Field label="Shift ends"><Input type="time" value={shiftEnd} onChange={(event) => setShiftEnd(event.target.value)} className="min-h-11 text-base sm:text-sm" /></Field></div>{error && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p>}<CanonicalButton type="submit" size="lg" className="mt-5 min-h-11 w-full" disabled={pending}>{pending ? "Assigning shift…" : "Activate Guard shift"}</CanonicalButton></>}</form>;
}

function FormIntro({ icon: Icon, title, description }: { icon: typeof Mail; title: string; description: string }) {
  return <div className="mb-5 flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-900"><Icon className="size-5" aria-hidden="true" /></span><div><h2 className="font-black text-slate-950">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div></div>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block text-sm font-bold text-slate-800"><span>{label}</span><span className="mt-2 block">{children}</span>{error && <span role="alert" className="mt-2 block text-xs font-semibold leading-5 text-red-700">{error}</span>}</label>;
}

function MembershipRow({ item, onAssign }: { item: PropertyGuardMembershipDto; onAssign: () => void }) {
  const ready = item.status === "ACTIVE";
  const pending = item.status === "PENDING_ACCEPTANCE";
  return <article className="grid gap-4 p-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:p-6"><span className={cn("grid size-11 place-items-center rounded-2xl", ready ? "bg-emerald-100 text-emerald-900" : pending ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-500")}>{ready ? <CheckCircle2 className="size-5" aria-hidden="true" /> : pending ? <Hourglass className="size-5" aria-hidden="true" /> : <Users className="size-5" aria-hidden="true" />}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-950">{item.guard?.fullName ?? "Guard"}</h3><MembershipBadge status={item.status} /></div><p className="mt-1 text-xs text-slate-500">{item.guard?.emailMasked} · {item.guard?.phoneMasked}</p><p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><Clock3 className="size-3.5" aria-hidden="true" />{pending ? `Invited ${formatDateTime(item.invitedAt)}` : ready && item.joinedAt ? `Accepted ${formatDateTime(item.joinedAt)}` : "No current access"}</p></div>{ready ? <CanonicalButton type="button" size="sm" variant="outline" className="min-h-10" onClick={onAssign}>Assign shift <ArrowRight className="size-4" /></CanonicalButton> : pending ? <span className="max-w-48 text-xs leading-5 text-amber-800">Guard action required: open Assignments and accept.</span> : <span className="text-xs text-slate-500">Membership closed</span>}</article>;
}

function MembershipBadge({ status }: { status: PropertyGuardMembershipDto["status"] }) {
  const copy = status === "ACTIVE" ? "Ready to assign" : status === "PENDING_ACCEPTANCE" ? "Waiting for acceptance" : status === "ENDED" ? "Ended" : "Declined";
  return <span className={cn("rounded-full px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wide", status === "ACTIVE" ? "bg-emerald-100 text-emerald-900" : status === "PENDING_ACCEPTANCE" ? "bg-amber-100 text-amber-950" : "bg-slate-100 text-slate-600")}>{copy}</span>;
}

function AssignmentCard({ item, onEdit, onSuspend, onResume, onEnd, pending }: { item: GuardAssignmentDto; onEdit: () => void; onSuspend: () => void; onResume: () => void; onEnd: () => void; pending: boolean }) {
  const badge = guardStatus[item.status];
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_28px_rgba(6,78,59,0.035)]"><div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-900"><ShieldCheck className="size-5" aria-hidden="true" /></span><span className={cn("rounded-full px-2.5 py-1 text-[0.65rem] font-bold", badge.className)}>{badge.label}</span></div><h3 className="mt-4 font-black text-slate-950">{item.guard?.fullName ?? "Guard"}</h3><p className="mt-1 text-xs text-slate-500">{item.guard?.emailMasked} · {item.guard?.phoneMasked}</p><div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-xs text-slate-600"><p className="flex items-center gap-2"><Building2 className="size-3.5 text-emerald-700" />{item.property.name}</p><p className="flex items-center gap-2"><Clock3 className="size-3.5 text-emerald-700" />{item.shiftStart ?? "Not set"}–{item.shiftEnd ?? "Not set"}</p></div><div className="mt-5 flex flex-wrap gap-2"><CanonicalButton type="button" size="sm" variant="outline" onClick={onEdit} disabled={pending}>Edit shift</CanonicalButton>{item.status === "ACTIVE" && <CanonicalButton type="button" size="sm" variant="outline" onClick={onSuspend} disabled={pending}>Suspend</CanonicalButton>}{item.status === "SUSPENDED" && <CanonicalButton type="button" size="sm" variant="outline" onClick={onResume} disabled={pending}>Resume</CanonicalButton>}{!["ENDED", "CANCELLED"].includes(item.status) && <CanonicalButton type="button" size="sm" variant="destructive" onClick={onEnd} disabled={pending}>End</CanonicalButton>}</div></article>;
}

function StatusNotice({ notice, onDismiss }: { notice: Notice; onDismiss: () => void }) {
  const styles = notice.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-950" : notice.tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-950" : "border-blue-200 bg-blue-50 text-blue-950";
  return <div role="status" className={cn("flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-start sm:justify-between", styles)}><div className="flex gap-3"><Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><div><p className="font-bold">{notice.title}</p><p className="mt-1 text-sm leading-6 opacity-80">{notice.message}</p></div></div><CanonicalButton type="button" size="sm" variant="ghost" onClick={onDismiss} className="shrink-0">Dismiss</CanonicalButton></div>;
}
