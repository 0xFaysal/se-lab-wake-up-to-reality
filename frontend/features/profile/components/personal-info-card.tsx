"use client";

import { Check, Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatPhone } from "@/lib/formatters";

export function PersonalInfoCard() {
  const user = useCurrentUser();
  return <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm"><div><h3 className="text-lg font-bold">Personal Information</h3><p className="mt-1 text-xs text-muted-foreground">Identity details returned by your authenticated account.</p></div><div className="h-px bg-border" />{user.isPending && <div className="p-6 text-center"><Loader2 className="mx-auto size-5 animate-spin" /></div>}{user.isError && <p role="alert" className="text-sm text-red-700">Account details could not be loaded.</p>}{user.data && <div className="grid gap-5 text-sm sm:grid-cols-2"><Info label="Full name" value={user.data.fullName} /><Info label="Roles" value={user.data.roles.join(", ").replaceAll("_", " ")} /><VerifiedInfo label="Email address" value={user.data.email} verified={user.data.emailVerified} /><VerifiedInfo label="Phone number" value={formatPhone(user.data.phone)} verified={user.data.phoneVerified} /></div>}<div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">Profile editing is unavailable because the backend does not currently provide a profile-update endpoint.</div></div>;
}
function Info({ label, value }: { label: string; value: string }) { return <div><span className="text-xs text-muted-foreground">{label}</span><p className="mt-1 font-bold">{value}</p></div>; }
function VerifiedInfo({ label, value, verified }: { label: string; value: string; verified: boolean }) { return <div><span className="text-xs text-muted-foreground">{label}</span><div className="mt-1 flex flex-wrap items-center gap-2"><strong>{value}</strong><span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${verified ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}><Check className="size-3" />{verified ? "Verified" : "Not verified"}</span></div></div>; }
