"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { financeApi } from "@/lib/api/finance-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatBDTFromPaisa, formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export default function RefundDetailPage({ params }: { params: Promise<{ refundId: string }> }) {
  const { refundId } = use(params);
  const query = useQuery({ queryKey: queryKeys.refunds.detail(refundId), queryFn: () => financeApi.driverRefund(refundId) });
  if (query.isPending) return <Loader2 className="mx-auto mt-20 size-6 animate-spin" />;
  if (query.isError) return <p role="alert" className="mx-auto max-w-3xl rounded-lg bg-red-50 p-4 text-red-700">{getApiErrorMessage(query.error)}</p>;
  const refund = query.data;
  return <div className="mx-auto max-w-3xl space-y-5 px-4"><Link href="/driver/refunds" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft className="size-4" />Refunds</Link><h1 className="text-3xl font-extrabold">Refund detail</h1><section className="grid gap-4 rounded-lg border bg-white p-6 sm:grid-cols-2"><Info label="Status" value={refund.status} /><Info label="Amount" value={formatBDTFromPaisa(refund.amountPaisa)} /><Info label="Booking" value={refund.payment?.booking.bookingCode ?? "Unavailable"} /><Info label="Property" value={refund.payment?.booking.property.name ?? "Unavailable"} /><Info label="Requested" value={formatDateTime(refund.createdAt)} /><Info label="Processed" value={refund.processedAt ? formatDateTime(refund.processedAt) : "Pending"} /><div className="sm:col-span-2"><Info label="Reason" value={refund.reason} /></div></section></div>;
}

function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-1 text-sm text-slate-800">{value}</p></div>; }
