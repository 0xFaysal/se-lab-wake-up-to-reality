import { Mail } from "lucide-react";

export function SupportTicketForm() {
  return <section className="rounded-lg border bg-white p-6"><h3 className="text-lg font-bold">Contact support</h3><p className="mt-2 text-sm text-slate-600">In-app support tickets are not enabled in this release. For account assistance, contact the project team by email.</p><a href="mailto:support@parkease.bd" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:underline"><Mail className="size-4" />support@parkease.bd</a><p className="mt-4 text-xs text-slate-500">For an immediate physical safety emergency, contact local emergency services.</p></section>;
}
