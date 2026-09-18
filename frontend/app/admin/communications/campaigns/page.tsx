"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { adminOperationsApi } from "@/lib/api/admin-operations-api";
import { Button } from "@/components/ui/button";

export default function EmailCampaignsPage() {
  const query = useQuery({ queryKey: ["admin", "email-campaigns"], queryFn: () => adminOperationsApi.emailCampaigns({ limit: 100 }) });
  return <div className="space-y-6"><header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase text-emerald-700">Communication</p><h1 className="text-2xl font-black">Email campaigns</h1><p className="mt-1 text-sm text-slate-500">Create targeted announcements without sending mass email inside a web request.</p></div><Button nativeButton={false} render={<Link href="/admin/communications/campaigns/new" />}><Plus className="size-4" />New campaign</Button></header>
  {query.isLoading ? <p className="text-sm text-slate-500">Loading campaigns...</p> : query.data?.campaigns.length ? <div className="overflow-x-auto border border-slate-200 bg-white"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Campaign</th><th className="px-4 py-3">Audience</th><th className="px-4 py-3">Recipients</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Schedule</th></tr></thead><tbody className="divide-y">{query.data.campaigns.map((campaign) => <tr key={campaign.id}><td className="px-4 py-3"><Link className="font-bold text-emerald-800 hover:underline" href={`/admin/communications/campaigns/${campaign.id}`}>{campaign.title}</Link><p className="mt-1 text-xs text-slate-500">{campaign.template.name} v{campaign.template.version}</p></td><td className="px-4 py-3">{campaign.audience}</td><td className="px-4 py-3">{campaign.estimatedRecipientCount}</td><td className="px-4 py-3 font-semibold">{campaign.status}</td><td className="px-4 py-3 text-xs">{campaign.scheduledAt ? new Date(campaign.scheduledAt).toLocaleString("en-BD") : "Manual"}</td></tr>)}</tbody></table></div> : <div className="border-y border-slate-200 py-10 text-center"><p className="font-bold">No email campaigns yet.</p><p className="mt-1 text-sm text-slate-500">Create a targeted announcement for platform users.</p></div>}
  </div>;
}
