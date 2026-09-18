"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Loader2, ShieldCheck } from "lucide-react";
import { guardApi } from "@/lib/api/guard-api";
import { propertyApi } from "@/lib/api/property-api";
import { queryKeys } from "@/lib/query-keys";

export function OwnerLiveSummary() {
  const properties = useQuery({ queryKey: queryKeys.properties.all(), queryFn: propertyApi.list }); const guards = useQuery({ queryKey: queryKeys.ownerGuardAssignments.all({ limit: 100 }), queryFn: () => guardApi.listForProvider({ limit: 100 }) }); const loading = properties.isPending || guards.isPending;
  if (loading) return <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6" aria-busy="true"><div className="rounded-2xl border bg-white p-6"><Loader2 className="size-5 animate-spin" /></div></section>;
  const list = properties.data ?? []; const assignments = guards.data?.assignments ?? [];
  return <section className="mx-auto max-w-7xl space-y-3 px-4 pt-6 sm:px-6"><div className="grid gap-3 sm:grid-cols-3"><Metric icon={<Building2 className="size-5" />} label="Backend Properties" value={String(list.length)} /><Metric icon={<ShieldCheck className="size-5" />} label="Verified Properties" value={String(list.filter((item) => item.verificationStatus === "VERIFIED").length)} /><Metric icon={<ShieldCheck className="size-5" />} label="Guard Assignments" value={String(assignments.length)} /></div><p className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">Live data is shown above. Booking, occupancy, and revenue sections below are design-demo data because those backend APIs do not exist yet.</p></section>;
}
function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex items-center gap-3 rounded-2xl border bg-white p-4"><span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-[#064E3B]">{icon}</span><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-extrabold">{value}</p></div></div>; }
