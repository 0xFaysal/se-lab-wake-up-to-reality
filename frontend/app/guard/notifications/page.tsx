"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notificationsApi } from "@/lib/api/notifications-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

function destination(entityType: string | null, id: string | null) {
  if (!id) return null;
  if (entityType === "Booking") return `/guard/bookings/${id}`;
  return null;
}

export default function GuardNotificationsPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.notifications.all(), queryFn: notificationsApi.list });
  const refresh = () => client.invalidateQueries({ queryKey: queryKeys.notifications.root });
  const read = useMutation({ mutationFn: notificationsApi.read, onSuccess: refresh });
  const readAll = useMutation({ mutationFn: notificationsApi.readAll, onSuccess: refresh });
  const unread = query.data?.filter((item) => !item.readAt).length ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Operational updates</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">Notifications</h1><p className="mt-2 text-sm text-slate-500">{unread > 0 ? `${unread} unread operational update${unread === 1 ? "" : "s"}.` : "You’re up to date."}</p></div><Button type="button" variant="outline" size="lg" disabled={unread === 0 || readAll.isPending} onClick={() => readAll.mutate()} className="min-h-11"><CheckCheck className="size-4" />{readAll.isPending ? "Marking read…" : "Mark all read"}</Button></header>

      {query.isPending ? <div className="guard-panel divide-y divide-[var(--guard-line)]" aria-busy="true">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-28 animate-pulse p-5"><div className="h-4 w-1/3 rounded bg-slate-200" /><div className="mt-3 h-4 w-4/5 rounded bg-slate-100" /></div>)}</div> : query.isError ? <section className="guard-panel p-8 text-center" role="alert"><p className="font-bold text-red-800">Notifications could not be loaded</p><p className="mt-2 text-sm text-slate-600">{getApiErrorMessage(query.error)}</p><Button type="button" variant="outline" className="mt-5" onClick={() => query.refetch()}><RefreshCw className="size-4" />Retry</Button></section> : query.data.length === 0 ? <section className="guard-panel px-6 py-14 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><Bell className="size-6" /></span><h2 className="mt-4 text-lg font-bold">No notifications</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Checkout requests, booking changes and assignment updates will appear here.</p></section> : <section className="guard-panel overflow-hidden"><ol className="divide-y divide-[var(--guard-line)]">{query.data.map((item) => { const href = destination(item.entityType, item.entityId); const content = <><span className={cn("mt-1 size-2 shrink-0 rounded-full", item.readAt ? "bg-slate-200" : "bg-emerald-600")} aria-hidden="true" /><span className="min-w-0 flex-1"><span className="font-bold text-slate-950">{item.title}</span><span className="mt-1 block text-sm leading-6 text-slate-600">{item.message}</span><time className="mt-2 block text-xs text-slate-400" dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time></span>{href && <ChevronRight className="mt-1 size-4 shrink-0 text-slate-300" />}</>; return <li key={item.id}>{href ? <Link href={href} onClick={() => !item.readAt && read.mutate(item.id)} className={cn("flex gap-4 p-5 transition-colors hover:bg-emerald-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-800 sm:p-6", !item.readAt && "bg-emerald-50/30")}>{content}</Link> : <button type="button" onClick={() => !item.readAt && read.mutate(item.id)} disabled={Boolean(item.readAt) || read.isPending} className={cn("flex w-full gap-4 p-5 text-left transition-colors hover:bg-emerald-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-800 sm:p-6", !item.readAt && "bg-emerald-50/30")}>{content}</button>}</li>; })}</ol></section>}
    </div>
  );
}
