"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, CreditCard, Loader2, LockKeyhole, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { financeApi } from "@/lib/api/finance-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import type { PayoutMethodDto } from "@/lib/api/marketplace-types";

const queryKey = ["driver", "payout-methods"] as const;

export default function DriverPaymentMethodsPage() {
  const client = useQueryClient();
  const [adding, setAdding] = useState(false);
  const methods = useQuery({ queryKey, queryFn: financeApi.driverPayoutMethods });
  const refresh = () => client.invalidateQueries({ queryKey });
  const create = useMutation({ mutationFn: financeApi.createDriverPayoutMethod, onSuccess: async () => { toast.success("Transfer destination added securely"); setAdding(false); await refresh(); }, onError: (error) => toast.error(getApiErrorMessage(error)) });
  const makeDefault = useMutation({ mutationFn: financeApi.setDefaultDriverPayoutMethod, onSuccess: async () => { toast.success("Default destination updated"); await refresh(); }, onError: (error) => toast.error(getApiErrorMessage(error)) });
  const deactivate = useMutation({ mutationFn: financeApi.deactivateDriverPayoutMethod, onSuccess: async () => { toast.success("Transfer destination deactivated"); await refresh(); }, onError: (error) => toast.error(getApiErrorMessage(error)) });

  if (methods.isError) return <PageState message={getApiErrorMessage(methods.error)} retry={() => void methods.refetch()} />;
  return <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6">
    <Link href="/driver/wallet" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-800"><ArrowLeft className="size-4" />Refund Balance &amp; Wallet</Link>
    <header className="flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase text-emerald-700">Secure settings</p><h1 className="mt-2 text-3xl font-extrabold">Transfer destinations</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Add the bank or mobile wallet account where ParkEase should send approved withdrawals.</p></div><Button onClick={() => setAdding((value) => !value)}><Plus className="size-4" />Add destination</Button></header>
    <div className="flex gap-3 border-l-4 border-emerald-600 bg-emerald-50 p-4 text-sm text-emerald-950"><LockKeyhole className="mt-0.5 size-5 shrink-0" /><p>Your full account identifier is encrypted before storage. After saving, only its masked ending is visible.</p></div>
    {adding && <DestinationForm pending={create.isPending} submit={(input) => create.mutate(input)} cancel={() => setAdding(false)} />}
    {methods.isPending ? <div className="h-36 animate-pulse border bg-slate-100" /> : methods.data.length === 0 ? <div className="border bg-white p-10 text-center"><CreditCard className="mx-auto size-6 text-slate-400" /><h2 className="mt-3 font-bold">No transfer destination</h2><p className="mt-1 text-sm text-slate-500">Add a bank account, bKash, Nagad, or Rocket account to withdraw Refund Balance.</p></div> : <div className="divide-y border bg-white">{methods.data.map((method) => <article key={method.id} className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"><div className="flex gap-3"><span className="flex size-10 items-center justify-center bg-emerald-50 text-emerald-800"><CreditCard className="size-5" /></span><div><div className="flex flex-wrap items-center gap-2"><strong>{method.type.replaceAll("_", " ")}</strong>{method.isDefault && <span className="inline-flex items-center gap-1 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-800"><CheckCircle2 className="size-3" />Default</span>}<span className="bg-slate-100 px-2 py-1 text-[10px] font-bold">{method.status}</span></div><p className="mt-1 text-sm text-slate-600">{method.accountHolderName} · {method.maskedAccountIdentifier}</p>{method.bankName && <p className="text-xs text-slate-500">{method.bankName}{method.branchName ? ` · ${method.branchName}` : ""}</p>}</div></div>{method.status === "ACTIVE" && <div className="flex gap-2">{!method.isDefault && <Button size="sm" variant="outline" disabled={makeDefault.isPending} onClick={() => makeDefault.mutate(method.id)}>Set default</Button>}<Button size="sm" variant="outline" disabled={deactivate.isPending} onClick={() => deactivate.mutate(method.id)}>Deactivate</Button></div>}</article>)}</div>}
  </div>;
}

function DestinationForm({ pending, submit, cancel }: { pending: boolean; submit: (input: Parameters<typeof financeApi.createDriverPayoutMethod>[0]) => void; cancel: () => void }) {
  const [type, setType] = useState<PayoutMethodDto["type"]>("BKASH");
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const optionalBankFields = type === "BANK" ? {
      bankName: String(data.get("bankName")),
      ...(data.get("branchName") ? { branchName: String(data.get("branchName")) } : {}),
      ...(data.get("routingNumber") ? { routingNumber: String(data.get("routingNumber")) } : {}),
    } : {};
    submit({ type, accountHolderName: String(data.get("accountHolderName")), accountIdentifier: String(data.get("accountIdentifier")), ...optionalBankFields, isDefault: data.get("isDefault") === "on" });
  }
  return <form noValidate onSubmit={onSubmit} className="grid gap-4 border border-emerald-200 bg-emerald-50 p-5 sm:grid-cols-2">
    <label className="space-y-2 text-sm font-semibold"><span>Destination type</span><Select value={type} onValueChange={(value) => value && setType(value as PayoutMethodDto["type"])}><SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="BKASH">bKash</SelectItem><SelectItem value="NAGAD">Nagad</SelectItem><SelectItem value="ROCKET">Rocket</SelectItem><SelectItem value="BANK">Bank account</SelectItem><SelectItem value="OTHER_MFS">Other mobile wallet</SelectItem></SelectContent></Select></label>
    <label className="space-y-2 text-sm font-semibold"><span>Account holder name</span><Input name="accountHolderName" minLength={2} maxLength={120} required /></label>
    <label className="space-y-2 text-sm font-semibold"><span>{type === "BANK" ? "Account number" : "Mobile wallet number"}</span><Input name="accountIdentifier" inputMode={type === "BANK" ? "text" : "tel"} minLength={6} maxLength={100} required autoComplete="off" /></label>
    {type === "BANK" && <><label className="space-y-2 text-sm font-semibold"><span>Bank name</span><Input name="bankName" minLength={2} maxLength={120} required /></label><label className="space-y-2 text-sm font-semibold"><span>Branch name</span><Input name="branchName" maxLength={120} /></label><label className="space-y-2 text-sm font-semibold"><span>Routing number</span><Input name="routingNumber" maxLength={40} /></label></>}
    <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2"><input type="checkbox" name="isDefault" className="size-4 accent-emerald-700" />Use as default withdrawal destination</label>
    <div className="flex gap-2 sm:col-span-2"><Button type="submit" disabled={pending}>{pending && <Loader2 className="size-4 animate-spin" />}Save destination</Button><Button type="button" variant="outline" onClick={cancel} disabled={pending}>Cancel</Button></div>
  </form>;
}

function PageState({ message, retry }: { message: string; retry: () => void }) { return <div className="py-24 text-center"><p>{message}</p><Button variant="outline" className="mt-4" onClick={retry}>Try again</Button></div>; }
