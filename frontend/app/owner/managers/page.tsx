"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, UserCog } from "lucide-react";
import {
  PageEmptyState,
  PageErrorState,
  PageSkeleton,
  ProviderPage,
  ProviderPageHeader,
} from "@/components/owner/provider-page";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { managerApi } from "@/lib/api/manager-api";
import { formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export default function ManagersPage() {
  const query = useQuery({
    queryKey: queryKeys.managerDelegations.provider,
    queryFn: managerApi.listForProvider,
  });
  return (
    <ProviderPage>
      <ProviderPageHeader
        title="Managers"
        description="Delegate selected parking operations without sharing your account access."
        breadcrumbs={[{ label: "Operations" }, { label: "Managers" }]}
        actions={
          <Link href="/owner/managers/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-[#064E3B] px-4 text-sm font-semibold text-white">
            <Plus className="size-4" />Invite Manager
          </Link>
        }
      />
      {query.isPending ? (
        <PageSkeleton label="Loading Manager delegations" />
      ) : query.isError ? (
        <PageErrorState message={getApiErrorMessage(query.error)} retry={() => void query.refetch()} />
      ) : query.data.length === 0 ? (
        <PageEmptyState
          title="No Managers yet"
          description="Managers can operate selected parking resources with only the permissions you grant."
          action={{ label: "Invite Manager", href: "/owner/managers/new" }}
        />
      ) : (
        <div className="divide-y border bg-white">
          {query.data.map((item) => (
            <Link key={item.id} href={`/owner/managers/${item.id}`} className="grid gap-3 p-5 hover:bg-slate-50 md:grid-cols-[1.3fr_1fr_1fr_auto] md:items-center">
              <span className="flex items-center gap-3"><UserCog className="size-5 text-emerald-700" /><span><strong>{item.manager.fullName}</strong><small className="mt-1 block text-slate-500">{item.property.name}</small></span></span>
              <span className="text-sm"><small className="block text-slate-500">Resource scope</small>{item.resourceIds.length === 0 ? "Whole Property" : `${item.resourceIds.length} selected`}</span>
              <span className="text-sm"><small className="block text-slate-500">Invited</small>{formatDateTime(item.invitedAt)}</span>
              <span className="w-fit rounded-full bg-slate-100 px-2 py-1 text-xs font-bold">{item.status.replaceAll("_", " ")}</span>
            </Link>
          ))}
        </div>
      )}
    </ProviderPage>
  );
}
