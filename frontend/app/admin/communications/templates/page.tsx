"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2, MailPlus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { adminOperationsApi } from "@/lib/api/admin-operations-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const TYPES = ["EMAIL_VERIFICATION_OTP", "ACCOUNT_SETUP", "GUARD_INVITATION", "MANAGER_INVITATION", "PASSWORD_RESET", "BOOKING_CONFIRMATION", "BOOKING_CANCELLED", "PAYMENT_SUCCESS", "REFUND_PROCESSED", "PAYOUT_STATUS", "PROPERTY_APPROVED", "PROPERTY_REJECTED", "PARKING_RIGHT_APPROVED", "PARKING_RIGHT_REJECTED", "DISPUTE_UPDATE", "BROADCAST"];

export default function EmailTemplatesPage() {
  const client = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const query = useQuery({ queryKey: ["admin", "email-templates"], queryFn: () => adminOperationsApi.emailTemplates({ limit: 100 }) });
  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) => adminOperationsApi.createEmailTemplate(body),
    onSuccess: async () => { toast.success("Email template draft created"); setShowCreate(false); await client.invalidateQueries({ queryKey: ["admin", "email-templates"] }); },
    onError: (error: Error) => toast.error(error.message),
  });
  const templates = query.data?.templates ?? [];

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase text-emerald-700">Communication</p><h1 className="text-2xl font-black">Email templates</h1><p className="mt-1 text-sm text-slate-500">Versioned, allow-listed templates for transactional and broadcast email.</p></div><Button onClick={() => setShowCreate((value) => !value)}><MailPlus className="size-4" />New draft</Button></header>
    {showCreate && <form className="grid gap-4 border-y border-slate-200 bg-white py-5 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); create.mutate({ type: data.get("type"), name: data.get("name"), subject: data.get("subject"), preheader: data.get("preheader") || null, htmlBody: data.get("htmlBody"), textBody: data.get("textBody"), allowedVariables: String(data.get("allowedVariables") ?? "").split(",").map((item) => item.trim()).filter(Boolean) }); }}>
      <Field label="Template type"><select name="type" className="h-10 w-full border border-slate-300 bg-white px-3 text-sm">{TYPES.map((type) => <option key={type}>{type}</option>)}</select></Field><Field label="Name"><Input name="name" required minLength={3} /></Field><Field label="Subject"><Input name="subject" required minLength={3} /></Field><Field label="Preheader"><Input name="preheader" /></Field><Field label="Allowed variables" hint="Comma-separated, for example userName, otp"><Input name="allowedVariables" /></Field><div />
      <Field label="HTML body"><Textarea name="htmlBody" required minLength={10} className="min-h-40 font-mono text-xs" /></Field><Field label="Plain-text fallback"><Textarea name="textBody" required minLength={10} className="min-h-40 font-mono text-xs" /></Field>
      <div className="md:col-span-2"><Button type="submit" disabled={create.isPending}>{create.isPending && <Loader2 className="size-4 animate-spin" />}Create draft</Button></div>
    </form>}
    {query.isLoading ? (
      <p className="text-sm text-slate-500">Loading templates...</p>
    ) : query.isError ? (
      <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-y border-red-200 bg-red-50 px-4 py-5 text-red-800">
        <div className="flex min-w-0 items-start gap-3">
          <AlertCircle className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-bold">Email templates could not be loaded</p>
            <p className="mt-1 text-sm">{getApiErrorMessage(query.error)}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>
          {query.isFetching ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Retry
        </Button>
      </div>
    ) : templates.length ? (
      <div className="overflow-x-auto border border-slate-200 bg-white"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Template</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Version</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Usage</th></tr></thead><tbody className="divide-y">{templates.map((template) => <tr key={template.id}><td className="px-4 py-3"><Link className="font-bold text-emerald-800 hover:underline" href={`/admin/communications/templates/${template.id}`}>{template.name}</Link><p className="mt-1 text-xs text-slate-500">{template.subject}</p></td><td className="px-4 py-3 text-xs">{template.type}</td><td className="px-4 py-3">v{template.version}</td><td className="px-4 py-3 font-semibold">{template.status}</td><td className="px-4 py-3 text-xs">{template._count?.campaigns ?? 0} campaigns, {template._count?.deliveries ?? 0} deliveries</td></tr>)}</tbody></table></div>
    ) : (
      <div className="border-y border-slate-200 py-10 text-center"><p className="font-bold">No email templates are stored in this environment.</p><p className="mt-1 text-sm text-slate-500">Create a draft or install the managed system templates through the database seed.</p></div>
    )}
  </div>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) { return <label className="space-y-1 text-sm font-semibold"><span>{label}</span>{children}{hint && <small className="block font-normal text-slate-500">{hint}</small>}</label>; }
