"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Banknote, Clock3, LockKeyhole, Wallet } from "lucide-react";
import {
  PageEmptyState,
  PageErrorState,
  PageSkeleton,
  ProviderPage,
  ProviderPageHeader,
} from "@/components/owner/provider-page";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { financeApi } from "@/lib/api/finance-api";
import { formatBDTFromPaisa, formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

export default function EarningsPage() {
  const summary = useQuery({
    queryKey: queryKeys.earnings.summary(),
    queryFn: financeApi.earnings,
  });
  const entries = useQuery({
    queryKey: queryKeys.earnings.transactions(),
    queryFn: financeApi.earningsTransactions,
  });

  if (summary.isPending || entries.isPending) {
    return <ProviderPage><PageSkeleton label="Loading earnings" /></ProviderPage>;
  }
  if (summary.isError || entries.isError) {
    return (
      <ProviderPage>
        <PageErrorState
          message={getApiErrorMessage(summary.error ?? entries.error)}
          retry={() => void Promise.all([summary.refetch(), entries.refetch()])}
        />
      </ProviderPage>
    );
  }

  const availablePaisa = BigInt(summary.data.availableBalancePaisa);
  return (
    <ProviderPage>
      <ProviderPageHeader
        title="Earnings"
        description="See settled earnings, upcoming booking income, and payout reservations."
        breadcrumbs={[{ label: "Finance" }, { label: "Earnings" }]}
        actions={
          availablePaisa > BigInt(0) ? (
            <Link href="/owner/payouts"><Button>Request payout<ArrowRight className="size-4" /></Button></Link>
          ) : (
            <Button disabled title="A positive available balance is required">Request payout</Button>
          )
        }
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <Metric icon={Wallet} label="Available" value={summary.data.availableBalancePaisa} detail="Ready for payout request" />
        <Metric icon={Clock3} label="Awaiting settlement" value={summary.data.unsettledBalancePaisa} detail={`${summary.data.unsettledBookingCount} paid booking${summary.data.unsettledBookingCount === 1 ? "" : "s"} not settled yet`} />
        <Metric icon={LockKeyhole} label="Held for payout" value={summary.data.heldBalancePaisa} detail="Reserved in payout requests" />
      </section>
      <section>
        <h2 className="mb-3 font-bold">Earnings activity</h2>
        {entries.data.length === 0 ? (
          <PageEmptyState
            title="No earnings yet"
            description="Completed paid bookings generate earnings and will appear here."
            action={{ label: "View active listings", href: "/owner/listings" }}
          />
        ) : (
          <div className="divide-y border bg-white">
            {entries.data.map((entry) => (
              <div key={entry.id} className="flex items-start justify-between gap-4 p-4">
                <span>
                  <strong className="text-sm">{entry.ledgerTransaction.description}</strong>
                  <small className="mt-1 block text-slate-500">{formatDateTime(entry.createdAt)}</small>
                </span>
                <strong className={entry.entrySide === "CREDIT" ? "text-emerald-800" : "text-slate-900"}>
                  {entry.entrySide === "CREDIT" ? "+" : "-"}{formatBDTFromPaisa(entry.amountPaisa)}
                </strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </ProviderPage>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Banknote;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border bg-white p-5">
      <Icon className="size-5 text-emerald-700" />
      <small className="mt-3 block text-slate-500">{label}</small>
      <strong className="mt-1 block text-2xl">{formatBDTFromPaisa(value)}</strong>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </div>
  );
}
