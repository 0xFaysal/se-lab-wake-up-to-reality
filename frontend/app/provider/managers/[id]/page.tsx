"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck,
  Trash2,
  UserCog,
  XCircle,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  PageEmptyState,
  PageErrorState,
  PageSkeleton,
  ProviderPage,
  ProviderPageHeader,
} from "@/components/provider/provider-page";
import { managerApi, type ManagerPermission } from "@/lib/api/manager-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

const PERMISSION_LABELS: Record<ManagerPermission, { label: string; description: string }> = {
  RESOURCE_VIEW: { label: "View Resources", description: "See assigned parking inventory." },
  RESOURCE_MANAGE: { label: "Manage Resources", description: "Create and configure parking inventory." },
  LISTING_VIEW: { label: "View Listings", description: "See listing state and pricing." },
  LISTING_MANAGE: { label: "Manage Listings", description: "Create, pause, and update listings." },
  PRICE_MANAGE: { label: "Manage Pricing", description: "Change hourly prices and deposits." },
  AVAILABILITY_MANAGE: { label: "Manage Availability", description: "Set schedules and exceptions." },
  BOOKING_VIEW: { label: "View Bookings", description: "See bookings inside the resource scope." },
  BOOKING_MANAGE: { label: "Manage Bookings", description: "Perform permitted booking operations." },
  IMAGE_MANAGE: { label: "Manage Images", description: "Upload and organize Property images." },
  GUARD_VIEW: { label: "View Guards", description: "See Property Guard memberships." },
  GUARD_ADD_TO_PROPERTY: { label: "Add Guards", description: "Invite Guards to this Property." },
  GUARD_ASSIGN: { label: "Assign Guards", description: "Create and end Guard assignments." },
  EARNINGS_VIEW: { label: "View Earnings", description: "See scoped settlement information." },
  REPORTS_VIEW: { label: "View Reports", description: "Access operational reports." },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING_ACCEPTANCE: { label: "Pending acceptance", color: "bg-amber-100 text-amber-800", icon: Clock },
  ACTIVE: { label: "Active", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  SUSPENDED: { label: "Suspended", color: "bg-orange-100 text-orange-800", icon: ShieldCheck },
  ENDED: { label: "Ended", color: "bg-slate-100 text-slate-600", icon: XCircle },
  CANCELLED: { label: "Cancelled", color: "bg-slate-100 text-slate-600", icon: XCircle },
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </dt>
      <dd className="text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

export default function ManagerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const client = useQueryClient();

  const query = useQuery({
    queryKey: [...queryKeys.managerDelegations.provider, id],
    queryFn: () => managerApi.detail(id),
  });

  const end = useMutation({
    mutationFn: () => managerApi.end(id),
    onSuccess: async () => {
      setConfirmEnd(false);
      toast.success("Delegation ended successfully");
      await client.invalidateQueries({
        queryKey: queryKeys.managerDelegations.provider,
      });
      void query.refetch();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  if (query.isPending) {
    return (
      <ProviderPage>
        <PageSkeleton label="Loading delegation details" />
      </ProviderPage>
    );
  }

  if (query.isError) {
    return (
      <ProviderPage>
        <PageErrorState message={getApiErrorMessage(query.error)} />
      </ProviderPage>
    );
  }

  const item = query.data;
  const status = STATUS_CONFIG[item.status] ?? {
    label: item.status.replaceAll("_", " "),
    color: "bg-slate-100 text-slate-600",
    icon: ShieldCheck,
  };
  const StatusIcon = status.icon;

  const canEnd =
    item.status === "ACTIVE" ||
    item.status === "PENDING_ACCEPTANCE" ||
    item.status === "SUSPENDED";

  const scopeLabel =
    item.resourceIds.length === 0
      ? "Whole Property"
      : `${item.resourceIds.length} selected resource${item.resourceIds.length !== 1 ? "s" : ""}`;

  return (
    <ProviderPage>
      <ProviderPageHeader
        title={item.manager.fullName}
        description={`Manager delegation for ${item.property.name}`}
        breadcrumbs={[
          { label: "Operations" },
          { label: "Managers", href: "/provider/managers" },
          { label: item.manager.fullName },
        ]}
        actions={
          <div className="flex gap-2">
            {canEnd && (
              <Link href={`/provider/managers/${id}/permissions`}>
                <Button variant="outline">Edit permissions</Button>
              </Link>
            )}
            {canEnd && (
              <Button
                variant="destructive"
                disabled={end.isPending}
                onClick={() => setConfirmEnd(true)}
              >
                {end.isPending && <Loader2 className="size-4 animate-spin" />}
                End delegation
              </Button>
            )}
          </div>
        }
      />

      {/* Status Banner */}
      <div
        className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold ${status.color}`}
      >
        <StatusIcon className="size-4" />
        {status.label}
      </div>

      {/* Main Info Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Delegation Details */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserCog className="size-4 text-[#064E3B]" />
            <h2 className="text-sm font-bold text-slate-900">Delegation Details</h2>
          </div>
          <dl className="space-y-4">
            <InfoRow label="Manager" value={item.manager.fullName} />
            <InfoRow
              label="Property"
              value={`${item.property.name} · ${item.property.publicArea}`}
            />
            <InfoRow label="Resource scope" value={scopeLabel} />
            <InfoRow label="Invited" value={formatDateTime(item.invitedAt)} />
            <InfoRow
              label="Accepted"
              value={item.acceptedAt ? formatDateTime(item.acceptedAt) : "Not yet accepted"}
            />
            <InfoRow
              label="Access expires"
              value={item.validUntil ? formatDateTime(item.validUntil) : "No expiry set"}
            />
            {item.endedAt && (
              <InfoRow label="Ended" value={formatDateTime(item.endedAt)} />
            )}
          </dl>
        </div>

        {/* Permissions */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-[#064E3B]" />
              <h2 className="text-sm font-bold text-slate-900">
                Granted Permissions
              </h2>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              {item.permissions.length} of 13
            </span>
          </div>

          {item.permissions.length === 0 ? (
            <p className="text-sm text-slate-500">No permissions granted.</p>
          ) : (
            <div className="space-y-3">
              {item.permissions.map((permission) => {
                const info = PERMISSION_LABELS[permission];
                return (
                  <div
                    key={permission}
                    className="flex items-start gap-3 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        {info?.label ?? permission.replaceAll("_", " ")}
                      </p>
                      {info?.description && (
                        <p className="text-[11px] text-slate-500">
                          {info.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Property card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 flex items-center gap-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50">
          <Building2 className="size-5 text-[#064E3B]" />
        </div>
        <div>
          <p className="text-xs text-slate-500">Delegated Property</p>
          <p className="font-bold text-slate-900">{item.property.name}</p>
          <p className="text-xs text-slate-500">{item.property.publicArea}</p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
          <CalendarDays className="size-4" />
          Scope: {scopeLabel}
        </div>
      </div>

      {/* End Delegation Dialog */}
      <AlertDialog open={confirmEnd} onOpenChange={setConfirmEnd}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End this Manager delegation?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{item.manager.fullName}</strong> will immediately lose all
              delegated access to <strong>{item.property.name}</strong>. This
              action cannot be undone, but you can create a new delegation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep delegation</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={end.isPending}
              onClick={() => end.mutate()}
            >
              {end.isPending && <Loader2 className="size-4 animate-spin" />}
              End delegation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProviderPage>
  );
}
