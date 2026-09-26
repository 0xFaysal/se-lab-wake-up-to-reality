"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck,
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
  ManagerPage,
  ManagerPageErrorState,
  ManagerPageHeader,
  ManagerPageSkeleton,
} from "@/components/manager/manager-page";
import { managerApi, type ManagerDelegationDto } from "@/lib/api/manager-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  PENDING_ACCEPTANCE: {
    label: "Pending your acceptance",
    color: "bg-amber-100 text-amber-800",
    icon: Clock,
  },
  ACTIVE: {
    label: "Active",
    color: "bg-emerald-100 text-emerald-800",
    icon: CheckCircle2,
  },
  SUSPENDED: {
    label: "Suspended",
    color: "bg-orange-100 text-orange-800",
    icon: AlertCircle,
  },
  ENDED: {
    label: "Ended",
    color: "bg-slate-100 text-slate-600",
    icon: XCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-slate-100 text-slate-600",
    icon: XCircle,
  },
};

function DelegationCard({ item }: { item: ManagerDelegationDto }) {
  const client = useQueryClient();
  const status = STATUS_CONFIG[item.status] ?? {
    label: item.status.replaceAll("_", " "),
    color: "bg-slate-100 text-slate-600",
    icon: AlertCircle,
  };
  const StatusIcon = status.icon;

  const respond = useMutation({
    mutationFn: ({ accept }: { accept: boolean }) =>
      accept ? managerApi.accept(item.id) : managerApi.reject(item.id),
    onSuccess: (_, { accept }) => {
      toast.success(accept ? "Delegation accepted" : "Delegation rejected");
      void client.invalidateQueries({
        queryKey: queryKeys.managerDelegations.manager,
      });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const scopeLabel =
    item.resourceIds.length === 0
      ? "Whole Property"
      : `${item.resourceIds.length} resource${item.resourceIds.length !== 1 ? "s" : ""}`;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
            <Building2 className="size-5 text-[#064E3B]" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">{item.property.name}</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {item.property.publicArea}
            </p>
            {item.provider && (
              <p className="mt-1 text-xs text-slate-500">
                Delegated by{" "}
                <span className="font-semibold text-slate-700">
                  {item.provider.fullName}
                </span>
              </p>
            )}
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.color}`}
        >
          <StatusIcon className="size-3" />
          {status.label}
        </span>
      </div>

      {/* Permissions */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {item.permissions.slice(0, 6).map((permission) => (
          <span
            key={permission}
            className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
          >
            {permission.replaceAll("_", " ")}
          </span>
        ))}
        {item.permissions.length > 6 && (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            +{item.permissions.length - 6} more
          </span>
        )}
      </div>

      {/* Meta row */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
          <span>
            <strong className="text-slate-700">Scope:</strong> {scopeLabel}
          </span>
          <span>
            <strong className="text-slate-700">Invited:</strong>{" "}
            {formatDateTime(item.invitedAt)}
          </span>
          {item.validUntil && (
            <span>
              <strong className="text-slate-700">Expires:</strong>{" "}
              {formatDateTime(item.validUntil)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {item.status === "PENDING_ACCEPTANCE" && (
            <>
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={respond.isPending}
                      className="text-red-700 hover:bg-red-50 hover:border-red-300"
                    />
                  }
                >
                  Decline
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Decline this delegation?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will not have access to {item.property.name}. The
                      Provider can re-invite you later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep pending</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      disabled={respond.isPending}
                      onClick={() => respond.mutate({ accept: false })}
                    >
                      {respond.isPending && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      Decline delegation
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button size="sm" disabled={respond.isPending} />
                  }
                >
                  Accept
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Accept this delegation?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will gain access to <strong>{item.property.name}</strong> with{" "}
                      {item.permissions.length} permission
                      {item.permissions.length !== 1 ? "s" : ""} across{" "}
                      {scopeLabel.toLowerCase()}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={respond.isPending}
                      onClick={() => respond.mutate({ accept: true })}
                    >
                      {respond.isPending && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      Accept delegation
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {item.status === "ACTIVE" && (
            <Link href={`/manager/properties/${item.property.id}`}>
              <Button size="sm" variant="outline">
                Open Property
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export default function ManagerDashboardPage() {
  const query = useQuery({
    queryKey: queryKeys.managerDelegations.manager,
    queryFn: managerApi.listForManager,
  });

  const pending = query.data?.filter(
    (d) => d.status === "PENDING_ACCEPTANCE",
  ) ?? [];
  const active = query.data?.filter((d) => d.status === "ACTIVE") ?? [];
  const historical =
    query.data?.filter(
      (d) => d.status === "ENDED" || d.status === "CANCELLED" || d.status === "SUSPENDED",
    ) ?? [];

  return (
    <ManagerPage>
      <ManagerPageHeader
        title="Manager Dashboard"
        description="Review your Provider delegations. Accept invitations, then open the delegated Property workspace to operate within your granted scope."
      />

      {query.isPending ? (
        <ManagerPageSkeleton label="Loading your delegations" />
      ) : query.isError ? (
        <ManagerPageErrorState
          message={getApiErrorMessage(query.error)}
          retry={() => void query.refetch()}
        />
      ) : query.data.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white px-6 py-16 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50">
            <ShieldCheck className="size-7 text-emerald-700" />
          </div>
          <h2 className="mt-4 text-base font-bold text-slate-900">
            No delegations yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            A Property Provider needs to invite you before you can access any
            property. Your invitations will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-amber-700">
                Pending acceptance ({pending.length})
              </h2>
              <div className="space-y-4">
                {pending.map((item) => (
                  <DelegationCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {active.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-emerald-700">
                Active delegations ({active.length})
              </h2>
              <div className="space-y-4">
                {active.map((item) => (
                  <DelegationCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {historical.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">
                Past delegations ({historical.length})
              </h2>
              <div className="space-y-4 opacity-70">
                {historical.map((item) => (
                  <DelegationCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </ManagerPage>
  );
}
