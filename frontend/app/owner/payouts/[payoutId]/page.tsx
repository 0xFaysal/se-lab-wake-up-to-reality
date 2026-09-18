"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { financeApi } from "@/lib/api/finance-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatBDTFromPaisa, formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export default function PayoutDetailPage({ params }: { params: Promise<{ payoutId: string }> }) {
  const { payoutId } = use(params);
  const query = useQuery({ queryKey: queryKeys.payouts.detail(payoutId), queryFn: () => financeApi.providerPayout(payoutId) });
  if (query.isPending) return <Loader2 className="mx-auto mt-20 size-6 animate-spin" />;
  if (query.isError) return <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{getApiErrorMessage(query.error)}</p>;
  const item = query.data;
  return <div className="max-w-2xl space-y-5"><Link href="/owner/payouts" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft className="size-4" />Payouts</Link><h1 className="text-3xl font-extrabold">Payout detail</h1><section className="grid gap-4 rounded-lg border bg-white p-6 sm:grid-cols-2"><Info label="Status" value={item.status} /><Info label="Amount" value={formatBDTFromPaisa(item.amountPaisa)} /><Info label="Requested" value={formatDateTime(item.createdAt)} /><Info label="Reviewed" value={item.reviewedAt ? formatDateTime(item.reviewedAt) : "Pending"} /><div className="sm:col-span-2"><Info label="Review note" value={item.reviewNote ?? "No review note yet"} /></div></section></div>;
}

function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-1 text-sm text-slate-800">{value}</p></div>; }
