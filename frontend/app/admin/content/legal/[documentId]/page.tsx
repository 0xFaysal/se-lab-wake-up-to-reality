"use client";

import { use, useState, type ReactNode } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader, AdminStatus } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type AdminLegalDocumentDetail, adminOperationsApi } from "@/lib/api/admin-operations-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/formatters";

export default function AdminLegalDocumentPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = use(params);
  const query = useQuery({ queryKey: ["admin", "content", "legal", documentId], queryFn: () => adminOperationsApi.legalDocument(documentId) });
  if (query.isPending) return <div className="h-64 animate-pulse bg-slate-200" />;
  if (query.isError) return <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-800">{getApiErrorMessage(query.error)}</div>;
  return <LegalDocumentView key={`${query.data.id}-${query.data.contentHash}-${query.data.status}`} document={query.data} refresh={() => query.refetch()} />;
}

function LegalDocumentView({ document, refresh }: { document: AdminLegalDocumentDetail; refresh: () => Promise<unknown> }) {
  const [editing, setEditing] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const [draft, setDraft] = useState({ version: document.version, title: document.title, content: document.content ?? "", effectiveAt: toLocalInput(document.effectiveAt) });
  const publish = useMutation({ mutationFn: () => adminOperationsApi.publishLegal(document.id), onSuccess: async () => { toast.success("Legal version published"); await refresh(); }, onError: (error) => toast.error(getApiErrorMessage(error)) });
  const update = useMutation({ mutationFn: () => adminOperationsApi.updateLegalDraft(document.id, { version: draft.version.trim(), title: draft.title.trim(), content: draft.content.trim(), effectiveAt: new Date(draft.effectiveAt).toISOString() }), onSuccess: async () => { toast.success("Legal draft updated"); setEditing(false); await refresh(); }, onError: (error) => toast.error(getApiErrorMessage(error)) });
  const archive = useMutation({ mutationFn: () => adminOperationsApi.archiveLegal(document.id, archiveReason.trim()), onSuccess: async () => { toast.success("Legal version archived"); setArchiveOpen(false); setArchiveReason(""); await refresh(); }, onError: (error) => toast.error(getApiErrorMessage(error)) });
  return <div className="space-y-6">
    <Link href="/admin/content/legal" className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800"><ArrowLeft className="size-4" />Legal documents</Link>
    <AdminPageHeader eyebrow={document.type.replaceAll("_", " ")} title={document.title} description={`Version ${document.version} · Effective ${formatDateTime(document.effectiveAt)}`} action={<div className="flex flex-wrap gap-2">{document.status === "DRAFT" && <><Button variant="outline" onClick={() => setEditing((value) => !value)}>Edit draft</Button><Button disabled={publish.isPending} onClick={() => publish.mutate()}>{publish.isPending && <Loader2 className="size-4 animate-spin" />}Publish</Button></>} {document.status !== "ARCHIVED" && <Button variant="outline" onClick={() => setArchiveOpen(true)}>Archive</Button>}</div>} />
    <section className="grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4"><Info label="Status"><AdminStatus value={document.status} /></Info><Info label="Active version">{document.isActive ? "Yes" : "No"}</Info><Info label="Acceptances">{document._count.acceptances.toLocaleString("en-BD")}</Info><Info label="Published">{document.publishedAt ? formatDateTime(document.publishedAt) : "Not published"}</Info></section>
    {editing && <section className="space-y-3 border border-emerald-200 bg-emerald-50 p-5"><h2 className="text-sm font-bold">Edit draft</h2><div className="grid gap-3 sm:grid-cols-2"><Input value={draft.version} onChange={(event) => setDraft((current) => ({ ...current, version: event.target.value }))} placeholder="Version" /><Input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Title" /><Input className="sm:col-span-2" type="datetime-local" value={draft.effectiveAt} onChange={(event) => setDraft((current) => ({ ...current, effectiveAt: event.target.value }))} /><Textarea className="sm:col-span-2" rows={16} value={draft.content} onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))} /></div><div className="flex gap-2"><Button disabled={update.isPending || draft.version.trim().length === 0 || draft.title.trim().length < 3 || draft.content.trim().length < 20 || !draft.effectiveAt} onClick={() => update.mutate()}>{update.isPending && <Loader2 className="size-4 animate-spin" />}Save draft</Button><Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button></div></section>}
    <section className="border border-slate-200 bg-white"><h2 className="border-b px-4 py-3 text-sm font-bold">Document content</h2><pre className="whitespace-pre-wrap break-words p-5 font-sans text-sm leading-7 text-slate-700">{document.content ?? "No content"}</pre></section>
    <div className="grid gap-4 xl:grid-cols-2"><section className="border border-slate-200 bg-white"><h2 className="border-b px-4 py-3 text-sm font-bold">Version history</h2><div className="divide-y">{document.versionHistory.map((version) => <Link key={version.id} href={`/admin/content/legal/${version.id}`} className="flex items-center justify-between gap-3 px-4 py-3 text-xs hover:bg-slate-50"><span><strong>Version {version.version}</strong><span className="ml-2 text-slate-500">{version.title}</span></span><span className="flex items-center gap-2"><span>{version._count.acceptances} acceptances</span><AdminStatus value={version.status} /></span></Link>)}</div></section><section className="border border-slate-200 bg-white"><h2 className="border-b px-4 py-3 text-sm font-bold">Recent acceptances</h2>{document.acceptances.length ? <div className="max-h-96 divide-y overflow-y-auto">{document.acceptances.map((acceptance) => <div key={acceptance.id} className="px-4 py-3 text-xs"><strong>{acceptance.user.fullName}</strong><p className="text-slate-500">{acceptance.user.email} · {acceptance.acceptanceSource.replaceAll("_", " ")} · {formatDateTime(acceptance.acceptedAt)}</p></div>)}</div> : <p className="p-4 text-sm text-slate-500">No user has accepted this version.</p>}</section></div>
    <Dialog open={archiveOpen} onOpenChange={(open) => { if (!archive.isPending) setArchiveOpen(open); }}><DialogContent><DialogHeader><DialogTitle>Archive legal version</DialogTitle><DialogDescription>Acceptance history will remain immutable. An active published version cannot be archived until a replacement is published.</DialogDescription></DialogHeader><Textarea value={archiveReason} onChange={(event) => setArchiveReason(event.target.value)} minLength={10} maxLength={500} placeholder="Archive reason (minimum 10 characters)" /><DialogFooter><Button variant="outline" disabled={archive.isPending} onClick={() => setArchiveOpen(false)}>Cancel</Button><Button variant="destructive" disabled={archive.isPending || archiveReason.trim().length < 10} onClick={() => archive.mutate()}>Archive version</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function Info({ label, children }: { label: string; children: ReactNode }) { return <div className="bg-white p-4"><p className="text-[11px] font-bold uppercase text-slate-500">{label}</p><div className="mt-2 text-sm font-semibold">{children}</div></div>; }
function toLocalInput(value: string) { const date = new Date(value); const offset = date.getTimezoneOffset(); return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16); }
