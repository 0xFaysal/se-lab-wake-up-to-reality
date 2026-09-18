"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { adminOperationsApi } from "@/lib/api/admin-operations-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CampaignActionName = "send" | "schedule" | "cancel" | "preview" | "test";
type CampaignPreview = { subject: string; html: string; text: string };
type CampaignActionResult =
  | { name: "preview"; preview: CampaignPreview }
  | { name: Exclude<CampaignActionName, "preview"> };

export default function EmailCampaignDetailPage() {
  const { campaignId } = useParams<{ campaignId: string }>(); const client = useQueryClient(); const [scheduledAt, setScheduledAt] = useState(""); const [testEmail, setTestEmail] = useState(""); const [preview, setPreview] = useState<CampaignPreview | null>(null);
  const query = useQuery({ queryKey: ["admin", "email-campaign", campaignId], queryFn: () => adminOperationsApi.emailCampaign(campaignId) });
  const action = useMutation<CampaignActionResult, Error, CampaignActionName>({
    mutationFn: async (name) => {
      switch (name) {
        case "send":
          await adminOperationsApi.sendEmailCampaign(campaignId);
          return { name };
        case "schedule":
          await adminOperationsApi.scheduleEmailCampaign(campaignId, new Date(scheduledAt).toISOString());
          return { name };
        case "cancel":
          await adminOperationsApi.cancelEmailCampaign(campaignId);
          return { name };
        case "preview": {
          const campaignPreview = await adminOperationsApi.previewEmailCampaign(campaignId, { userName: "Test User" });
          return { name, preview: campaignPreview };
        }
        case "test":
          await adminOperationsApi.testEmailCampaign(campaignId, testEmail, { userName: "Test User" });
          return { name };
      }
    },
    onSuccess: async (result) => {
      if (result.name === "preview") {
        setPreview(result.preview);
      } else {
        toast.success(result.name === "send" ? "Campaign deliveries queued" : result.name === "test" ? "Test email accepted for delivery" : `Campaign ${result.name} completed`);
      }

      await client.invalidateQueries({ queryKey: ["admin", "email-campaign", campaignId] });
    },
    onError: (error) => toast.error(error.message),
  });
  const item = query.data; if (query.isLoading) return <p className="text-sm text-slate-500">Loading campaign...</p>; if (!item) return <p className="text-sm text-red-700">Campaign could not be loaded.</p>;
  const open = item.status === "DRAFT" || item.status === "SCHEDULED";
  return <div className="space-y-6"><header><Link href="/admin/communications/campaigns" className="text-sm font-semibold text-emerald-800 hover:underline">Email campaigns</Link><div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase text-emerald-700">{item.audience} · {item.status}</p><h1 className="text-2xl font-black">{item.title}</h1><p className="mt-1 text-sm text-slate-500">{item.template.name} v{item.template.version} · {item.estimatedRecipientCount} estimated recipients</p></div>{open && <div className="flex gap-2"><Button onClick={() => action.mutate("send")}><Send className="size-4" />Send now</Button><Button variant="outline" onClick={() => action.mutate("cancel")}><XCircle className="size-4" />Cancel</Button></div>}</div></header>
    {item.status === "DRAFT" && <section className="flex flex-wrap items-end gap-3 border-y border-slate-200 bg-white py-4"><label className="space-y-1 text-sm font-semibold"><span>Schedule delivery</span><Input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /></label><Button variant="outline" disabled={!scheduledAt || action.isPending} onClick={() => action.mutate("schedule")}><CalendarClock className="size-4" />Schedule</Button></section>}
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Status", item.status], ["Audience", item.audience], ["Recipients", item.estimatedRecipientCount], ["Deliveries", item._count?.deliveries ?? 0]].map(([label, value]) => <div key={String(label)} className="border-l-2 border-emerald-700 pl-4"><p className="text-xs uppercase text-slate-500">{label}</p><p className="mt-1 text-lg font-bold">{value}</p></div>)}</section>
    <section className="grid gap-5 lg:grid-cols-[1fr_300px]"><div><div className="mb-2 flex items-center justify-between"><h2 className="font-bold">Campaign preview</h2><Button size="sm" variant="outline" onClick={() => action.mutate("preview")}>Generate preview</Button></div>{preview ? <div className="border border-slate-200 bg-white"><div className="border-b px-4 py-2 text-sm font-semibold">{preview.subject}</div><iframe title="Sandboxed campaign preview" sandbox="" srcDoc={preview.html} className="h-80 w-full" /></div> : <p className="border-y border-slate-200 py-10 text-center text-sm text-slate-500">Preview this campaign with safe sample recipient data before sending.</p>}</div><div><h2 className="font-bold">Send one test</h2><p className="mt-1 text-xs text-slate-500">Test delivery is recorded and does not enqueue the audience.</p><Input className="mt-3" type="email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} placeholder="admin@example.com" /><Button className="mt-3 w-full" disabled={!testEmail || action.isPending} onClick={() => action.mutate("test")}>Send test email</Button></div></section>
    <section><div className="flex items-center justify-between"><h2 className="font-bold">Delivery summary</h2><Link href={`/admin/communications/deliveries?campaignId=${item.id}`} className="text-sm font-semibold text-emerald-800 hover:underline">View deliveries</Link></div><div className="mt-2 divide-y border-y border-slate-200">{item.deliverySummary?.length ? item.deliverySummary.map((row) => <div key={row.status} className="flex justify-between py-3 text-sm"><span>{row.status}</span><strong>{row._count}</strong></div>) : <p className="py-8 text-center text-sm text-slate-500">No delivery records yet.</p>}</div></section>
  </div>;
}
