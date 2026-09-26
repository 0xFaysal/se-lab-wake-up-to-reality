"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, ShieldCheck } from "lucide-react";
import {
  ManagerPage,
  ManagerPageEmptyState,
  ManagerPageErrorState,
  ManagerPageHeader,
  ManagerPageSkeleton,
} from "@/components/manager/manager-page";
import { managerApi } from "@/lib/api/manager-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export default function ManagerPropertiesPage() {
  const query = useQuery({
    queryKey: queryKeys.managerDelegations.manager,
    queryFn: managerApi.listForManager,
  });

  const active = query.data?.filter((d) => d.status === "ACTIVE") ?? [];

  return (
    <ManagerPage>
      <ManagerPageHeader
        title="Delegated Properties"
        description="Properties where you have an active Provider delegation. Click a property to open your scoped workspace."
        breadcrumbs={[{ label: "Properties" }]}
      />

      {query.isPending ? (
        <ManagerPageSkeleton label="Loading delegated properties" />
      ) : query.isError ? (
        <ManagerPageErrorState
          message={getApiErrorMessage(query.error)}
          retry={() => void query.refetch()}
        />
      ) : active.length === 0 ? (
        <ManagerPageEmptyState
          title="No active delegations"
          description="You currently have no active property delegations. Accept a pending invitation from your Dashboard to get started."
          action={{ label: "Go to Dashboard", href: "/manager/dashboard" }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {active.map((item) => {
            const scopeLabel =
              item.resourceIds.length === 0
                ? "Whole Property"
                : `${item.resourceIds.length} resource${item.resourceIds.length !== 1 ? "s" : ""}`;

            return (
              <Link
                key={item.id}
                href={`/manager/properties/${item.property.id}`}
                className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-emerald-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 transition-colors group-hover:bg-emerald-100">
                    <Building2 className="size-5 text-[#064E3B]" />
                  </div>
                  <ArrowRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-emerald-700" />
                </div>

                <div className="mt-4">
                  <h2 className="font-bold text-slate-900 leading-tight">
                    {item.property.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {item.property.publicArea}
                  </p>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <ShieldCheck className="size-3.5 text-emerald-600" />
                    <span>
                      <strong className="text-slate-700">Scope:</strong>{" "}
                      {scopeLabel}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    <strong className="text-slate-600">Permissions:</strong>{" "}
                    {item.permissions.length}
                  </div>
                  {item.provider && (
                    <div className="text-xs text-slate-500">
                      <strong className="text-slate-600">Provider:</strong>{" "}
                      {item.provider.fullName}
                    </div>
                  )}
                  <div className="text-xs text-slate-500">
                    <strong className="text-slate-600">Active since:</strong>{" "}
                    {item.acceptedAt
                      ? formatDateTime(item.acceptedAt)
                      : formatDateTime(item.invitedAt)}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1">
                  {item.permissions.slice(0, 4).map((p) => (
                    <span
                      key={p}
                      className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                    >
                      {p.replaceAll("_", " ")}
                    </span>
                  ))}
                  {item.permissions.length > 4 && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                      +{item.permissions.length - 4}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </ManagerPage>
  );
}
