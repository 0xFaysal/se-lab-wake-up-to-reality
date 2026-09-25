"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminOperationsApi } from "@/lib/api/admin-operations-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const AUDIENCES = ["ALL", "DRIVER", "PROVIDER", "MANAGER", "GUARD"];

export default function NewEmailCampaignPage() {
  const router = useRouter(); const [audience, setAudience] = useState("ALL"); const [templateId, setTemplateId] = useState("");
  const templates = useQuery({ queryKey: ["admin", "email-templates", "published", "broadcast"], queryFn: () => adminOperationsApi.emailTemplates({ status: "PUBLISHED", type: "BROADCAST", limit: 100 }) });
  const estimate = useQuery({ queryKey: ["admin", "email-campaign-estimate", audience], queryFn: () => adminOperationsApi.estimateEmailCampaign(audience) });
  const selectedTemplateId = templateId || templates.data?.templates[0]?.id || "";
  const create = useMutation({ mutationFn: (body: Record<string, unknown>) => adminOperationsApi.createEmailCampaign(body), onSuccess: (campaign) => { toast.success("Campaign draft created"); router.push(`/admin/communications/campaigns/${campaign.id}`); }, onError: (error: Error) => toast.error(getApiErrorMessage(error)) });
  return <div className="max-w-4xl space-y-6"><header><p className="text-xs font-bold uppercase text-emerald-700">Communication</p><h1 className="text-2xl font-black">New email campaign</h1><p className="mt-1 text-sm text-slate-500">Only active accounts with verified email addresses are included.</p></header>
    <form className="grid gap-4 border-y border-slate-200 bg-white py-5 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); create.mutate({ title: data.get("title"), templateId: selectedTemplateId, audience, subjectOverride: data.get("subjectOverride") || null, htmlBodyOverride: data.get("htmlBodyOverride") || null, textBodyOverride: data.get("textBodyOverride") || null }); }}>
      <Field label="Campaign title"><Input name="title" required minLength={3} /></Field><Field label="Audience"><select className="h-10 w-full border border-slate-300 bg-white px-3 text-sm" value={audience} onChange={(event) => setAudience(event.target.value)}>{AUDIENCES.map((item) => <option key={item}>{item}</option>)}</select><small className="block font-normal text-slate-500">Estimated recipients: {estimate.data?.estimatedRecipientCount ?? "..."}</small></Field>
      <Field label="Published template"><select required disabled={templates.isPending || templates.isError} className="h-10 w-full border border-slate-300 bg-white px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60" value={selectedTemplateId} onChange={(event) => setTemplateId(event.target.value)}><option value="">{templates.isPending ? "Loading templates..." : "Select template"}</option>{templates.data?.templates.map((template) => <option key={template.id} value={template.id}>{template.name} v{template.version}</option>)}</select>{templates.isError ? <small className="flex items-center gap-1 font-normal text-red-700"><AlertCircle className="size-3.5" />{getApiErrorMessage(templates.error)}</small> : !templates.isPending && templates.data?.templates.length === 0 ? <small className="block font-normal text-amber-700">No published broadcast template is available. <Link href="/admin/communications/templates" className="font-semibold underline">Manage email templates</Link>.</small> : null}</Field><Field label="Subject override"><Input name="subjectOverride" placeholder="Leave blank to use template subject" /></Field>
      <Field label="HTML override"><Textarea name="htmlBodyOverride" className="min-h-48 font-mono text-xs" placeholder="Leave blank to use the template" /></Field><Field label="Plain-text override"><Textarea name="textBodyOverride" className="min-h-48 font-mono text-xs" placeholder="Leave blank to use the template" /></Field>
      {create.isError && <div role="alert" className="flex items-center gap-2 text-sm text-red-700 md:col-span-2"><AlertCircle className="size-4 shrink-0" />{getApiErrorMessage(create.error)}</div>}
      <div className="md:col-span-2"><Button type="submit" disabled={!selectedTemplateId || templates.isPending || create.isPending}>{create.isPending && <Loader2 className="size-4 animate-spin" />}{create.isPending ? "Creating draft..." : "Create draft"}</Button></div>
    </form>
  </div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-1 text-sm font-semibold"><span>{label}</span>{children}</label>; }
