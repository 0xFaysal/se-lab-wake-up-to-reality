"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Clock3, Landmark, Loader2, LockKeyhole, ShieldCheck, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { financeApi } from "@/lib/api/finance-api";
import { formatBDTFromPaisa, formatDateTime } from "@/lib/formatters";
import { payoutStatus } from "@/lib/marketplace-status";
import { queryKeys } from "@/lib/query-keys";

export default function PaymentsPage() {
  const client = useQueryClient();
  const payoutKey = useRef(crypto.randomUUID());
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const wallet = useQuery({ queryKey: queryKeys.wallet.current, queryFn: financeApi.wallet });
  const entries = useQuery({ queryKey: queryKeys.wallet.transactions(), queryFn: financeApi.walletTransactions });
  const methods = useQuery({ queryKey: ["driver", "payout-methods"], queryFn: financeApi.driverPayoutMethods });
  const payouts = useQuery({ queryKey: queryKeys.payouts.driver(), queryFn: () => financeApi.driverPayouts() });
  const activeMethods = (methods.data ?? []).filter((method) => method.status === "ACTIVE");
  const payoutMethodId = selectedMethod || activeMethods.find((method) => method.isDefault)?.id || activeMethods[0]?.id || "";
  const availablePaisa = BigInt(wallet.data?.availableBalancePaisa ?? "0");
  const requestedPaisa = useMemo(() => {
    const value = Number(amount);
    return Number.isFinite(value) ? BigInt(Math.max(0, Math.round(value * 100))) : BigInt(0);
  }, [amount]);
  const exceedsBalance = requestedPaisa > availablePaisa;
  const payout = useMutation({
    mutationFn: () => financeApi.requestDriverPayout(requestedPaisa.toString(), payoutMethodId, payoutKey.current),
    onSuccess: async () => {
      toast.success("Withdrawal request submitted for review");
      setAmount("");
      payoutKey.current = crypto.randomUUID();
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.wallet.current }),
        client.invalidateQueries({ queryKey: queryKeys.wallet.transactions() }),
        client.invalidateQueries({ queryKey: queryKeys.payouts.root }),
      ]);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const firstError = wallet.error ?? entries.error ?? methods.error ?? payouts.error;
  if (wallet.isPending || entries.isPending || methods.isPending || payouts.isPending) return <PageState loading message="Loading your Refund Balance" />;
  if (firstError) return <PageState message={getApiErrorMessage(firstError)} retry={() => void Promise.all([wallet.refetch(), entries.refetch(), methods.refetch(), payouts.refetch()])} />;
  if (!wallet.data || !entries.data || !methods.data || !payouts.data) return <PageState message="Refund Balance data is unavailable" retry={() => void Promise.all([wallet.refetch(), entries.refetch(), methods.refetch(), payouts.refetch()])} />;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
      <header className="flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase text-emerald-700">Money</p><h1 className="mt-2 text-3xl font-extrabold">Refund Balance</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Unused deposits and cancellation refunds return here. ParkEase applies this balance automatically before SSLCOMMERZ on your next booking.</p></div>
        <Button variant="outline" nativeButton={false} render={<Link href="/driver/payment-methods" />}>Manage payout methods<ArrowRight className="size-4" /></Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Metric icon={WalletCards} label="Ready to use" value={wallet.data.availableBalancePaisa} detail="Available for booking or withdrawal" />
        <Metric icon={Clock3} label="Processing" value={wallet.data.pendingBalancePaisa} detail="Refund credits still being processed" />
        <Metric icon={LockKeyhole} label="Reserved" value={wallet.data.heldBalancePaisa} detail="Applied to a booking or withdrawal" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="border bg-white p-6">
          <div className="flex items-start gap-3"><Landmark className="mt-0.5 size-5 text-emerald-700" /><div><h2 className="font-bold">Withdraw balance</h2><p className="mt-1 text-sm text-slate-600">Request a transfer to your saved bank or mobile financial service account.</p></div></div>
          <form noValidate className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); payout.mutate(); }}>
            <label className="space-y-2 text-sm font-semibold"><span>Amount in BDT</span><Input inputMode="decimal" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" disabled={availablePaisa === BigInt(0)} /></label>
            <label className="space-y-2 text-sm font-semibold"><span>Transfer destination</span><Select value={payoutMethodId} onValueChange={(value) => value && setSelectedMethod(value)} disabled={activeMethods.length === 0}><SelectTrigger className="w-full"><SelectValue placeholder="Select destination" /></SelectTrigger><SelectContent>{activeMethods.map((method) => <SelectItem key={method.id} value={method.id}>{method.type.replaceAll("_", " ")} · {method.maskedAccountIdentifier}</SelectItem>)}</SelectContent></Select></label>
            {exceedsBalance && <p role="alert" className="text-sm text-red-700 sm:col-span-2">Enter an amount within your available balance.</p>}
            {activeMethods.length === 0 && <p className="text-sm text-amber-800 sm:col-span-2">Add a bank or mobile wallet destination before requesting a withdrawal. <Link href="/driver/payment-methods" className="font-bold underline">Add destination</Link></p>}
            <div className="sm:col-span-2"><Button type="submit" disabled={requestedPaisa <= BigInt(0) || exceedsBalance || !payoutMethodId || payout.isPending || availablePaisa === BigInt(0)}>{payout.isPending && <Loader2 className="size-4 animate-spin" />}Request withdrawal</Button></div>
          </form>
        </div>
        <aside className="border-l-4 border-emerald-600 bg-emerald-50 p-5 text-sm text-emerald-950">
          <ShieldCheck className="size-5" /><h2 className="mt-3 font-bold">How transfer works</h2><p className="mt-2 leading-6">The requested amount is reserved immediately. An admin verifies the destination, completes the transfer, and records its reference. Rejected requests return to your available balance.</p>
        </aside>
      </section>

      <section><h2 className="mb-3 text-lg font-bold">Withdrawal requests</h2>{payouts.data.payouts.length === 0 ? <Empty text="No withdrawal requests yet." /> : <div className="divide-y border bg-white">{payouts.data.payouts.map((item) => { const status = payoutStatus[item.status]; return <article key={item.id} className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"><div><strong>{formatBDTFromPaisa(item.amountPaisa)}</strong><p className="mt-1 text-xs text-slate-500">{item.destinationSnapshot?.type.replaceAll("_", " ")} · {item.destinationSnapshot?.maskedAccountIdentifier ?? "Saved destination"} · {formatDateTime(item.createdAt)}</p></div><span className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}>{status.label}</span></article>; })}</div>}</section>

      <section><h2 className="mb-3 text-lg font-bold">Balance activity</h2>{entries.data.length === 0 ? <Empty text="Refunds, booking use, and withdrawals will appear here." /> : <div className="divide-y border bg-white">{entries.data.map((entry) => <article key={entry.id} className="flex items-start justify-between gap-4 p-4"><div><strong className="text-sm">{entry.ledgerTransaction.description}</strong><p className="mt-1 text-xs text-slate-500">{formatDateTime(entry.createdAt)}</p></div><span className={`shrink-0 font-semibold ${entry.entrySide === "CREDIT" ? "text-emerald-800" : "text-slate-900"}`}>{entry.entrySide === "CREDIT" ? "+" : "-"}{formatBDTFromPaisa(entry.amountPaisa)}</span></article>)}</div>}</section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof WalletCards; label: string; value: string; detail: string }) { return <div className="border bg-white p-5"><Icon className="size-5 text-emerald-700" /><p className="mt-3 text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-2 text-2xl font-extrabold">{formatBDTFromPaisa(value)}</p><p className="mt-2 text-xs text-slate-500">{detail}</p></div>; }
function Empty({ text }: { text: string }) { return <div className="border bg-white p-8 text-center text-sm text-slate-500">{text}</div>; }
function PageState({ message, loading, retry }: { message: string; loading?: boolean; retry?: () => void }) { return <div className="py-24 text-center">{loading && <Loader2 className="mx-auto mb-3 size-6 animate-spin" />}<p>{message}</p>{retry && <Button variant="outline" className="mt-4" onClick={retry}>Try again</Button>}</div>; }
