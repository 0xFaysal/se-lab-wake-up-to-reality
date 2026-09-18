"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { adminOperationsApi } from "@/lib/api/admin-operations-api";
import { Button } from "@/components/ui/button";

export default function EmailDeliveriesPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "email-deliveries"], queryFn: () => adminOperationsApi.emailDeliveries({ limit: 100 }) });
  const retry = useMutation({ mutationFn: (id: string) => adminOperationsApi.retryEmailDelivery(id), onSuccess: async () => { toast.success("Failed delivery queued for retry"); await client.invalidateQueries({ queryKey: ["admin", "email-deliveries"] }); }, onError: (error: Error) => toast.error(error.message) });
  return <div className="space-y-6"><header><p className="text-xs font-bold uppercase text-emerald-700">Communication</p><h1 className="text-2xl font-black">Email delivery</h1><p className="mt-1 text-sm text-slate-500">Safe delivery history with retry restricted to failed messages.</p></header>
    {query.isLoading ? <p className="text-sm text-slate-500">Loading delivery history...</p> : query.data?.deliveries.length ? <div className="overflow-x-auto border border-slate-200 bg-white"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Recipient</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Attempts</th><th className="px-4 py-3">Provider message</th><th className="px-4 py-3">Action</th></tr></thead><tbody className="divide-y">{query.data.deliveries.map((delivery) => <tr key={delivery.id}><td className="px-4 py-3">{delivery.recipientEmail}</td><td className="px-4 py-3 font-semibold">{delivery.subject}</td><td className="px-4 py-3">{delivery.status}</td><td className="px-4 py-3">{delivery.attemptCount}</td><td className="px-4 py-3 text-xs text-slate-500">{delivery.providerMessage ?? "—"}</td><td className="px-4 py-3">{delivery.status === "FAILED" ? <Button size="sm" variant="outline" onClick={() => retry.mutate(delivery.id)}><RotateCcw className="size-4" />Retry</Button> : "—"}</td></tr>)}</tbody></table></div> : <div className="border-y border-slate-200 py-10 text-center"><p className="font-bold">No email deliveries yet.</p><p className="mt-1 text-sm text-slate-500">Delivery records appear after a test or campaign is queued.</p></div>}
  </div>;
}
