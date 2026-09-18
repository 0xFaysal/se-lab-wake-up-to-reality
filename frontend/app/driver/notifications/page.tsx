"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notificationsApi } from "@/lib/api/notifications-api";
import { formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

type ReadFilter = "ALL" | "UNREAD" | "READ";
function destination(entityType: string | null, id: string | null) { if (!id) return null; if (entityType === "Booking") return `/driver/bookings/${id}`; if (entityType === "Dispute") return `/driver/disputes/${id}`; if (entityType === "Refund") return `/driver/refunds/${id}`; return null; }
function category(type: string) { if (type.includes("PAYMENT") || type.includes("REFUND")) return "PAYMENTS"; if (type.includes("BOOKING") || type.includes("CHECK")) return "BOOKINGS"; if (type.includes("DISPUTE")) return "DISPUTES"; return "ACCOUNT"; }

export default function DriverNotificationsPage() {
  const client = useQueryClient();
  const [readFilter, setReadFilter] = useState<ReadFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const query = useQuery({ queryKey: queryKeys.notifications.all(), queryFn: notificationsApi.list });
  const refresh = () => client.invalidateQueries({ queryKey: queryKeys.notifications.root });
  const read = useMutation({ mutationFn: notificationsApi.read, onSuccess: refresh });
  const all = useMutation({ mutationFn: notificationsApi.readAll, onSuccess: refresh });
  const items = useMemo(() => (query.data ?? []).filter((item) => (readFilter === "ALL" || (readFilter === "UNREAD" ? !item.readAt : !!item.readAt)) && (categoryFilter === "ALL" || category(item.type) === categoryFilter)), [categoryFilter, query.data, readFilter]);
  const unread = query.data?.filter((item) => !item.readAt).length ?? 0;
  return <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6"><header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h1 className="text-2xl font-extrabold">Notifications</h1><p className="mt-1 text-sm text-muted-foreground">{unread} unread account and parking updates.</p></div><Button type="button" variant="outline" disabled={all.isPending || unread === 0} onClick={() => all.mutate()}>Mark all read</Button></header><div className="flex flex-wrap gap-2">{(["ALL", "UNREAD", "READ"] as ReadFilter[]).map((value) => <button type="button" key={value} onClick={() => setReadFilter(value)} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold", readFilter === value && "border-emerald-800 bg-emerald-50 text-emerald-900")}>{value.toLowerCase()}</button>)}<span className="mx-1 border-l" />{["ALL", "BOOKINGS", "PAYMENTS", "DISPUTES", "ACCOUNT"].map((value) => <button type="button" key={value} onClick={() => setCategoryFilter(value)} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold", categoryFilter === value && "border-emerald-800 bg-emerald-50 text-emerald-900")}>{value.toLowerCase()}</button>)}</div>{query.isPending ? <Loader2 className="size-6 animate-spin" /> : query.isError ? <div className="border bg-white p-8 text-center"><p className="text-sm text-rose-700">Notifications could not be loaded.</p><Button type="button" variant="outline" className="mt-3" onClick={() => query.refetch()}>Try again</Button></div> : <div className="divide-y border bg-white">{items.map((item) => { const href = destination(item.entityType, item.entityId); const body = <><div className="flex items-start justify-between gap-3"><strong>{item.title}</strong>{!item.readAt && <span className="mt-1 size-2 shrink-0 rounded-full bg-emerald-700" />}</div><p className="mt-1 text-sm text-slate-600">{item.message}</p><small className="mt-2 block text-slate-500">{formatDateTime(item.createdAt)}</small></>; return href ? <Link key={item.id} href={href} onClick={() => !item.readAt && read.mutate(item.id)} className={cn("block p-5 hover:bg-slate-50", !item.readAt && "bg-emerald-50/40")}>{body}</Link> : <button type="button" key={item.id} onClick={() => !item.readAt && read.mutate(item.id)} className={cn("block w-full p-5 text-left hover:bg-slate-50", !item.readAt && "bg-emerald-50/40")}>{body}</button>; })}{items.length === 0 && <div className="p-10 text-center"><Bell className="mx-auto size-7 text-slate-400" /><p className="mt-3 text-sm text-slate-500">No notifications match these filters.</p></div>}</div>}</div>;
}
