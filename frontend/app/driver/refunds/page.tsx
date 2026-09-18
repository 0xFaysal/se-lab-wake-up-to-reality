"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ReceiptText } from "lucide-react";
import { MobileEmptyState } from "@/components/driver/mobile-empty-state";
import { financeApi } from "@/lib/api/finance-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatBDTFromPaisa, formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export default function RefundsPage() {
  const query = useQuery({ queryKey: queryKeys.refunds.driver(), queryFn: () => financeApi.driverRefunds() });
  if (query.isPending) return <div className="mx-auto max-w-3xl space-y-3 px-4 py-5">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-md border bg-white" />)}</div>;
  if (query.isError) return <p role="alert" className="mx-auto max-w-3xl rounded-lg bg-red-50 p-4 text-red-700">{getApiErrorMessage(query.error)}</p>;
  return <div className="mx-auto max-w-3xl space-y-5 px-4 py-5 sm:px-6 sm:py-7"><div><h1 className="text-2xl font-extrabold">Refunds</h1><p className="mt-1 text-sm text-slate-500">Refund requests linked to your payments.</p></div>{query.data.refunds.length === 0 ? <MobileEmptyState icon={ReceiptText} title="No refunds yet" description="Refund requests and their latest processing status will appear here." primaryAction={{ label: "View payments", href: "/driver/payments" }} /> : <div className="space-y-3">{query.data.refunds.map((refund) => <Link key={refund.id} href={`/driver/refunds/${refund.id}`} className="flex items-center justify-between gap-4 rounded-md border bg-white p-4 shadow-sm hover:border-emerald-200"><div className="min-w-0"><strong>{refund.payment?.booking.bookingCode ?? refund.id}</strong><p className="mt-1 truncate text-xs text-slate-500">{refund.payment?.booking.property.name}</p><p className="mt-1 text-xs text-slate-500">{formatDateTime(refund.createdAt)}</p></div><div className="shrink-0 text-right"><strong>{formatBDTFromPaisa(refund.amountPaisa)}</strong><p className="mt-1 text-xs font-bold text-slate-500">{refund.status}</p></div></Link>)}</div>}</div>;
}
