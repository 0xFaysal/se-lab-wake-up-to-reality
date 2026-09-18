"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { financeApi } from "@/lib/api/finance-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatBDTFromPaisa, formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export default function RefundsPage() {
  const query = useQuery({ queryKey: queryKeys.refunds.driver(), queryFn: () => financeApi.driverRefunds() });
  if (query.isPending) return <Loader2 className="mx-auto mt-20 size-6 animate-spin" />;
  if (query.isError) return <p role="alert" className="mx-auto max-w-3xl rounded-lg bg-red-50 p-4 text-red-700">{getApiErrorMessage(query.error)}</p>;
  return <div className="mx-auto max-w-3xl space-y-5 px-4"><div><h1 className="text-3xl font-extrabold">Refunds</h1><p className="mt-1 text-sm text-slate-500">Refund requests linked to your payments.</p></div><div className="divide-y overflow-hidden rounded-lg border bg-white">{query.data.refunds.map((refund) => <Link key={refund.id} href={`/driver/refunds/${refund.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50"><div><strong>{refund.payment?.booking.bookingCode ?? refund.id}</strong><p className="mt-1 text-xs text-slate-500">{refund.payment?.booking.property.name} · {formatDateTime(refund.createdAt)}</p></div><div className="text-right"><strong>{formatBDTFromPaisa(refund.amountPaisa)}</strong><p className="mt-1 text-xs font-bold text-slate-500">{refund.status}</p></div></Link>)}{query.data.refunds.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No refunds yet.</p>}</div></div>;
}
