"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Copy, Loader2, Send, Upload } from "lucide-react";
import { toast } from "sonner";
import { adminOperationsApi } from "@/lib/api/admin-operations-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const SAMPLE_VARIABLE_VALUES: Record<string, string> = {
  userName: "Faysal Ahmed",
  otp: "482731",
  expiresIn: "10",
  setupUrl: "https://parkease.example.com/change-initial-password?token=sample",
  resetUrl: "https://parkease.example.com/reset-password?token=sample",
  propertyName: "ParkEase Gulshan Parking",
  bookingCode: "PE-2026-10482",
  amount: "BDT 350.00",
  status: "Active",
  reason: "The requested update has been completed.",
  campaignTitle: "A safer and smoother parking experience",
};

export default function EmailTemplateDetailPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "email-template", templateId], queryFn: () => adminOperationsApi.emailTemplate(templateId) });
  const [form, setForm] = useState({ name: "", subject: "", preheader: "", htmlBody: "", textBody: "", allowedVariables: "" });
  const [testEmail, setTestEmail] = useState("");
  const [sampleValues, setSampleValues] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<{ subject: string; html: string; text: string } | null>(null);
  useEffect(() => {
    const item = query.data;
    if (!item) return;

    setForm({ name: item.name, subject: item.subject, preheader: item.preheader ?? "", htmlBody: item.htmlBody, textBody: item.textBody, allowedVariables: item.allowedVariables.join(", ") });
    setSampleValues(Object.fromEntries(item.allowedVariables.map((key) => [key, SAMPLE_VARIABLE_VALUES[key] ?? `Sample ${key}`])));
  }, [query.data]);
  const refresh = () => client.invalidateQueries({ queryKey: ["admin", "email-template", templateId] });
  const action = useMutation({
    mutationFn: async (name: "save" | "publish" | "archive" | "clone" | "preview" | "test") => {
      const values = Object.fromEntries((query.data?.allowedVariables ?? []).map((key) => [key, sampleValues[key] ?? ""]));
      if (name === "save") return adminOperationsApi.updateEmailTemplate(templateId, { ...form, preheader: form.preheader || null, allowedVariables: form.allowedVariables.split(",").map((item) => item.trim()).filter(Boolean) });
      if (name === "publish") return adminOperationsApi.publishEmailTemplate(templateId);
      if (name === "archive") return adminOperationsApi.archiveEmailTemplate(templateId, "Archived through Admin template management");
      if (name === "clone") return adminOperationsApi.cloneEmailTemplate(templateId);
      if (name === "preview") return adminOperationsApi.previewEmailTemplate(templateId, values);
      return adminOperationsApi.testEmailTemplate(templateId, testEmail, values);
    },
    onSuccess: async (result, name) => { if (name === "preview" && "html" in result) setPreview(result as { subject: string; html: string; text: string }); else toast.success(name === "test" ? "Test email accepted for delivery" : `Template ${name} completed`); await refresh(); },
    onError: (error: Error) => toast.error(error.message),
  });
  const item = query.data;
  if (query.isLoading) return <p className="text-sm text-slate-500">Loading template...</p>;
  if (!item) return <p className="text-sm text-red-700">Template could not be loaded.</p>;
  const editable = item.status === "DRAFT";
  return <div className="space-y-6">
    <header><Link href="/admin/communications/templates" className="text-sm font-semibold text-emerald-800 hover:underline">Email templates</Link><div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase text-emerald-700">{item.type} · v{item.version} · {item.status}</p><h1 className="text-2xl font-black">{item.name}</h1></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => action.mutate("clone")}><Copy className="size-4" />New version</Button>{editable && <Button onClick={() => action.mutate("publish")}><Upload className="size-4" />Publish</Button>}<Button variant="outline" disabled={item.status === "ARCHIVED"} onClick={() => action.mutate("archive")}><Archive className="size-4" />Archive</Button></div></div></header>
    <section className="grid gap-4 border-y border-slate-200 bg-white py-5 md:grid-cols-2"><Field label="Name"><Input disabled={!editable} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="Subject"><Input disabled={!editable} value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /></Field><Field label="Preheader"><Input disabled={!editable} value={form.preheader} onChange={(event) => setForm({ ...form, preheader: event.target.value })} /></Field><Field label="Allowed variables"><Input disabled={!editable} value={form.allowedVariables} onChange={(event) => setForm({ ...form, allowedVariables: event.target.value })} /></Field><Field label="HTML body"><Textarea disabled={!editable} className="min-h-64 font-mono text-xs" value={form.htmlBody} onChange={(event) => setForm({ ...form, htmlBody: event.target.value })} /></Field><Field label="Plain-text fallback"><Textarea disabled={!editable} className="min-h-64 font-mono text-xs" value={form.textBody} onChange={(event) => setForm({ ...form, textBody: event.target.value })} /></Field>{editable && <div className="md:col-span-2"><Button disabled={action.isPending} onClick={() => action.mutate("save")}>{action.isPending && <Loader2 className="size-4 animate-spin" />}Save draft</Button></div>}</section>
    <section className="grid gap-5 lg:grid-cols-[1fr_320px]"><div><div className="mb-2 flex items-center justify-between"><h2 className="font-bold">Safe preview</h2><Button size="sm" variant="outline" onClick={() => action.mutate("preview")}>Refresh preview</Button></div>{preview ? <div className="border border-slate-200 bg-white"><div className="border-b px-4 py-2 text-sm font-semibold">{preview.subject}</div><iframe title="Sandboxed email preview" sandbox="" srcDoc={preview.html} className="h-[560px] w-full" /></div> : <div className="border-y border-slate-200 py-10 text-center text-sm text-slate-500">Generate a sandboxed preview using sample placeholder values.</div>}</div><div className="space-y-6"><div><h2 className="font-bold">Preview values</h2><div className="mt-3 space-y-3">{item.allowedVariables.map((variable) => <label key={variable} className="block space-y-1 text-xs font-semibold"><span>{variable}</span><Input value={sampleValues[variable] ?? ""} onChange={(event) => setSampleValues((current) => ({ ...current, [variable]: event.target.value }))} /></label>)}</div></div><div><h2 className="font-bold">Send test</h2><p className="mt-1 text-xs text-slate-500">A single test is sent immediately and recorded in delivery history.</p><Input className="mt-3" type="email" placeholder="admin@example.com" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} /><Button className="mt-3 w-full" disabled={!testEmail || action.isPending} onClick={() => action.mutate("test")}><Send className="size-4" />Send test</Button></div></div></section>
    <section><h2 className="font-bold">Version history</h2><div className="mt-2 divide-y border-y border-slate-200">{item.versionHistory?.map((version) => <Link href={`/admin/communications/templates/${version.id}`} key={version.id} className="flex justify-between gap-3 py-3 text-sm hover:text-emerald-800"><span>Version {version.version} · {version.name}</span><strong>{version.status}</strong></Link>)}</div></section>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-1 text-sm font-semibold"><span>{label}</span>{children}</label>; }
