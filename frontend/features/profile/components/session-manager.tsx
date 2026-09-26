"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Laptop, Loader2, LogOut, ShieldCheck, Smartphone } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { PageEmptyState, PageErrorState, PageSkeleton } from "@/components/provider/provider-page";
import { authApi } from "@/lib/api/auth-api";
import type { SessionDto } from "@/lib/api/api-types";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export function SessionManager() {
  const client = useQueryClient();
  const router = useRouter();
  const [target, setTarget] = useState<SessionDto | null>(null);
  const query = useQuery({ queryKey: queryKeys.auth.sessions, queryFn: async () => (await authApi.sessions()).sessions });
  const revoke = useMutation({ mutationFn: authApi.revokeSession, onSuccess: async () => { const wasCurrent = target?.current; setTarget(null); if (wasCurrent) { client.clear(); router.replace("/login"); router.refresh(); return; } await client.invalidateQueries({ queryKey: queryKeys.auth.sessions }); } });
  if (query.isPending) return <PageSkeleton label="Loading active sessions" />;
  if (query.isError) return <PageErrorState message={getApiErrorMessage(query.error)} retry={() => void query.refetch()} />;
  if (query.data.length === 0) return <PageEmptyState title="No active sessions" description="No active login sessions were returned for this account." />;
  return <><div className="space-y-3">{query.data.map((session) => <article key={session.id} className="flex flex-col justify-between gap-4 rounded-lg border bg-white p-5 sm:flex-row sm:items-center"><div className="flex min-w-0 gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-[#064E3B]">{/mobile|android|iphone/i.test(session.userAgent) ? <Smartphone className="size-5" /> : <Laptop className="size-5" />}</span><div className="min-w-0"><h2 className="truncate text-sm font-bold">{session.userAgent || "Unknown browser"}</h2><p className="mt-1 text-xs text-slate-500">Signed in {formatDateTime(session.createdAt)} · Expires {formatDateTime(session.expiresAt)}</p>{session.current && <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800"><ShieldCheck className="size-3" />Current session</span>}</div></div><Button variant="outline" disabled={revoke.isPending} onClick={() => setTarget(session)}><LogOut className="size-4" />Revoke</Button></article>)}</div>{revoke.isError && <p role="alert" className="text-sm text-red-700">{getApiErrorMessage(revoke.error)}</p>}<AlertDialog open={Boolean(target)} onOpenChange={(open) => { if (!open && !revoke.isPending) setTarget(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Revoke this session?</AlertDialogTitle><AlertDialogDescription>{target?.current ? "This is your current session. You will be signed out immediately." : "This device will lose access and must sign in again."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={revoke.isPending}>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={revoke.isPending} onClick={() => target && revoke.mutate(target.id)}>{revoke.isPending ? <Loader2 className="size-4 animate-spin" /> : "Revoke session"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></>;
}
