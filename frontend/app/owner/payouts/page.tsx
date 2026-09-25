"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  PageEmptyState,
  PageErrorState,
  ProviderPage,
  ProviderPageHeader,
} from "@/components/owner/provider-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { financeApi } from "@/lib/api/finance-api";
import { formatBDTFromPaisa, formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export default function PayoutPage() {
  const client = useQueryClient();
  const [amount, setAmount] = useState("");
  const key = useRef(crypto.randomUUID());
  const earnings = useQuery({
    queryKey: queryKeys.earnings.summary(),
    queryFn: financeApi.earnings,
  });
  const history = useQuery({
    queryKey: queryKeys.payouts.provider(),
    queryFn: () => financeApi.providerPayouts(),
  });
  const methods = useQuery({ queryKey: ["provider", "payout-methods"], queryFn: financeApi.payoutMethods });
  const [payoutMethodId, setPayoutMethodId] = useState("");
  const activeMethods = (methods.data ?? []).filter((method) => method.status === "ACTIVE");
  const selectedMethodId = payoutMethodId || activeMethods.find((method) => method.isDefault)?.id || activeMethods[0]?.id || "";
  const availablePaisa = BigInt(earnings.data?.availableBalancePaisa ?? "0");
  const requestedPaisa = useMemo(
    () => Number.isFinite(Number(amount)) ? BigInt(Math.max(0, Math.round(Number(amount) * 100))) : BigInt(0),
    [amount],
  );
  const exceedsBalance = requestedPaisa > availablePaisa;
  const payout = useMutation({
    mutationFn: () => financeApi.requestPayout(requestedPaisa.toString(), selectedMethodId, key.current),
    onSuccess: async () => {
      toast.success("Payout request submitted for review");
      setAmount("");
      key.current = crypto.randomUUID();
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.earnings.root }),
        client.invalidateQueries({ queryKey: queryKeys.payouts.root }),
      ]);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  if (earnings.isError || history.isError || methods.isError) {
    return (
      <ProviderPage>
        <PageErrorState
          message={getApiErrorMessage(earnings.error ?? history.error ?? methods.error)}
          retry={() => void Promise.all([earnings.refetch(), history.refetch(), methods.refetch()])}
        />
      </ProviderPage>
    );
  }

  return (
    <ProviderPage className="max-w-5xl">
      <ProviderPageHeader
        title="Payouts"
        description="Request a payout from settled available earnings and review its processing status."
        breadcrumbs={[{ label: "Finance" }, { label: "Payouts" }]}
      />
      <section className="grid gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="border bg-white p-6">
          <p className="text-sm text-slate-500">Available balance</p>
          <p className="mt-2 text-3xl font-bold">
            {earnings.isPending ? <Loader2 className="size-6 animate-spin" /> : formatBDTFromPaisa(earnings.data?.availableBalancePaisa ?? "0")}
          </p>
          <label className="mt-6 block space-y-2 text-sm font-semibold">
            <span>Amount in BDT</span>
            <Input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} disabled={availablePaisa === BigInt(0)} />
          </label>
          <label className="mt-4 block space-y-2 text-sm font-semibold"><span>Payout destination</span><select className="h-10 w-full border bg-white px-3 text-sm" value={selectedMethodId} onChange={(event) => setPayoutMethodId(event.target.value)} disabled={activeMethods.length === 0}><option value="">Select payout method</option>{activeMethods.map((method) => <option key={method.id} value={method.id}>{method.type.replaceAll("_", " ")} · {method.maskedAccountIdentifier}</option>)}</select></label>
          {activeMethods.length === 0 && <p className="mt-2 text-xs text-amber-800">Add an active payout method before requesting a payout. <Link className="font-bold underline" href="/owner/settings/payout-methods">Manage payout methods</Link></p>}
          {availablePaisa === BigInt(0) && <p className="mt-2 text-xs text-amber-800">A completed, settled booking is required before you can request a payout.</p>}
          {exceedsBalance && <p role="alert" className="mt-2 text-xs text-red-700">The payout amount cannot exceed your available balance.</p>}
          <Button
            className="mt-5"
            disabled={requestedPaisa <= BigInt(0) || exceedsBalance || payout.isPending || availablePaisa === BigInt(0) || !selectedMethodId}
            onClick={() => payout.mutate()}
          >
            {payout.isPending && <Loader2 className="size-4 animate-spin" />}
            Request payout review
          </Button>
        </div>
        <aside className="border-l-4 border-emerald-600 bg-emerald-50 p-5 text-sm text-emerald-950">
          <Banknote className="size-5" />
          <h2 className="mt-3 font-bold">Manual transfer</h2>
          <p className="mt-2 leading-6">ParkEase reviews the destination, sends the money outside the platform, then records the transfer reference here.</p>
        </aside>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-bold">Payout history</h2>
        {history.isPending ? (
          <div className="border bg-white p-8 text-center"><Loader2 className="mx-auto size-5 animate-spin" /></div>
        ) : history.data.payouts.length === 0 ? (
          <PageEmptyState title="No payout requests yet" description="Approved payout requests and their processing status will appear here." />
        ) : (
          <div className="divide-y border bg-white">
            {history.data.payouts.map((item) => (
              <Link key={item.id} href={`/owner/payouts/${item.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50">
                <div><strong>{formatBDTFromPaisa(item.amountPaisa)}</strong><p className="mt-1 text-xs text-slate-500">{formatDateTime(item.createdAt)}</p></div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold">{item.status}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </ProviderPage>
  );
}
