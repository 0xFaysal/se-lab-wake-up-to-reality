"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, ChevronRight, Clock3, KeyRound, Loader2, MapPin, ShieldCheck, Smartphone } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { guardApi } from "@/lib/api/guard-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatDateTime, formatTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export function GuardProfileView() {
  const user = useCurrentUser();
  const assignments = useQuery({ queryKey: queryKeys.guardAssignments.all(), queryFn: () => guardApi.listForGuard({ limit: 100 }) });

  if (user.isPending || assignments.isPending) {
    return <div className="grid min-h-[45vh] place-items-center text-center" role="status"><div><Loader2 className="mx-auto size-7 animate-spin text-emerald-800" aria-hidden="true" /><p className="mt-3 text-sm text-slate-500">Loading your guard profile…</p></div></div>;
  }
  if (user.isError || assignments.isError) {
    return <div className="guard-panel mx-auto max-w-xl p-8 text-center"><p className="text-sm font-semibold text-red-700">{getApiErrorMessage(user.error ?? assignments.error)}</p><Button className="mt-4" variant="outline" onClick={() => void Promise.all([user.refetch(), assignments.refetch()])}>Try again</Button></div>;
  }

  const currentUser = user.data!;
  const activeAssignments = assignments.data.assignments.filter((item) => item.status === "ACTIVE");
  const initials = currentUser.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <div className="space-y-6 pb-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">Account control</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">Profile &amp; security</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Review your identity, operational scope, and signed-in devices.</p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <div className="space-y-6">
          <section className="guard-panel overflow-hidden" aria-labelledby="identity-title">
            <div className="bg-emerald-950 px-5 py-6 text-white sm:px-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="grid size-20 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 text-2xl font-black shadow-inner">{initials}</div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><h2 id="identity-title" className="truncate text-2xl font-black tracking-[-0.025em]">{currentUser.fullName}</h2>{currentUser.emailVerified && <BadgeCheck className="size-5 text-emerald-300" aria-label="Verified email" />}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[0.68rem] font-extrabold uppercase tracking-[0.1em]"><span className="rounded-full bg-emerald-300 px-3 py-1.5 text-emerald-950">Security guard</span><span className="rounded-full border border-white/20 px-3 py-1.5 text-emerald-50">{currentUser.status}</span></div>
                </div>
              </div>
            </div>
            <dl className="grid gap-px bg-slate-200 sm:grid-cols-3"><Info label="Email" value={maskEmail(currentUser.email)} /><Info label="Phone" value={maskPhone(currentUser.phone)} /><Info label="Identity status" value={currentUser.emailVerified ? "Verified" : "Verification pending"} /></dl>
          </section>

          <section className="guard-panel p-5 sm:p-7" aria-labelledby="assignments-title">
            <div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-emerald-900"><ShieldCheck className="size-5" aria-hidden="true" /><h2 id="assignments-title" className="text-lg font-black text-slate-950">Active duty scope</h2></div><p className="mt-1 text-sm text-slate-500">Only these server-authorized assignments grant booking access.</p></div><span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-sm font-black text-emerald-900">{activeAssignments.length}</span></div>
            {activeAssignments.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><p className="text-sm font-semibold text-slate-700">No active provider assignment</p><p className="mt-1 text-xs leading-5 text-slate-500">Ask the property or provider administrator to assign this account.</p></div> : <div className="mt-5 divide-y divide-slate-200">{activeAssignments.map((item) => <article key={item.id} className="py-5 first:pt-0 last:pb-0"><div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><MapPin className="size-5" aria-hidden="true" /></span><div className="min-w-0"><h3 className="font-bold text-slate-950">{item.property.name}</h3><p className="mt-1 text-xs text-slate-500">{item.property.publicArea ?? "Public area unavailable"}</p><p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-700"><Clock3 className="mt-0.5 size-3.5 shrink-0 text-emerald-700" aria-hidden="true" />{item.shiftStart && item.shiftEnd ? `${formatTime(item.shiftStart)} to ${formatTime(item.shiftEnd)}` : "No shift window configured"}</p>{item.provider && <p className="mt-1 text-xs text-slate-500">Provider: {item.provider.fullName}</p>}</div></div></article>)}</div>}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="guard-panel p-5 sm:p-6" aria-labelledby="security-title"><p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">Protected access</p><h2 id="security-title" className="mt-2 text-xl font-black tracking-tight text-slate-950">Security controls</h2><div className="mt-4 divide-y divide-slate-200"><SecurityLink href="/guard/account/security" icon={KeyRound} title="Change password" description="Update your account password" /><SecurityLink href="/guard/account/sessions" icon={Smartphone} title="Active sessions" description="Review devices signed into this account" /></div></section>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-950"><p className="font-bold">Access is checked on every action</p><p className="mt-1 text-blue-900/80">An active property membership and provider assignment are both required to view or operate a booking.</p></div>
          <LogoutButton className="h-12 w-full rounded-xl border border-red-200 bg-white text-sm font-bold text-red-700 shadow-none hover:bg-red-50" />
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="bg-white p-5"><dt className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</dt><dd className="mt-2 break-all text-sm font-bold text-slate-900">{value}</dd></div>;
}

function SecurityLink({ href, icon: Icon, title, description }: { href: string; icon: typeof KeyRound; title: string; description: string }) {
  return <Link href={href} className="group flex min-h-16 items-center gap-3 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800 focus-visible:ring-offset-2"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-800"><Icon className="size-5" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-950">{title}</span><span className="mt-0.5 block text-xs text-slate-500">{description}</span></span><ChevronRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link>;
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"•".repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}

function maskPhone(phone: string) {
  const compact = phone.replace(/\s/g, "");
  if (compact.length <= 4) return compact;
  return `${compact.slice(0, 3)}${"•".repeat(Math.max(4, compact.length - 7))}${compact.slice(-4)}`;
}
