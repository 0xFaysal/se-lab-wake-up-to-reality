"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageEmptyState, PageErrorState, PageSkeleton, ProviderPage, ProviderPageHeader } from "@/components/owner/provider-page";
import { Button } from "@/components/ui/button";
import { notificationsApi } from "@/lib/api/notifications-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export default function NotificationsPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.notifications.all(), queryFn: notificationsApi.list });
  const refresh = () => client.invalidateQueries({ queryKey: queryKeys.notifications.root });
  const read = useMutation({ mutationFn: notificationsApi.read, onSuccess: refresh });
  const all = useMutation({ mutationFn: notificationsApi.readAll, onSuccess: refresh });
  const hasUnread = query.data?.some((item) => !item.readAt) ?? false;
  return <ProviderPage><ProviderPageHeader title="Notifications" description="Stay current on verification, bookings, staffing, and settlement updates." breadcrumbs={[{ label: "Reputation & Support" }, { label: "Notifications" }]} actions={<Button variant="outline" disabled={!hasUnread || all.isPending} onClick={() => all.mutate()}>Mark all read</Button>} />
    {query.isPending ? <PageSkeleton label="Loading notifications" /> : query.isError ? <PageErrorState message={getApiErrorMessage(query.error)} retry={() => void query.refetch()} /> : query.data.length === 0 ? <PageEmptyState title="No notifications" description="Important Provider activity will appear here." /> : <div className="divide-y border bg-white">{query.data.map((item) => <button key={item.id} onClick={() => !item.readAt && read.mutate(item.id)} disabled={Boolean(item.readAt) || read.isPending} className={`block w-full p-5 text-left ${item.readAt ? "opacity-60" : "bg-emerald-50/40 hover:bg-emerald-50"}`}><strong>{item.title}</strong><p className="mt-1 text-sm text-slate-600">{item.message}</p><small className="mt-2 block text-slate-500">{formatDateTime(item.createdAt)}</small></button>)}</div>}
  </ProviderPage>;
}
