"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { bookingsApi } from "@/lib/api/bookings-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";

type Scope = "driver" | "provider";

export function DisputeHistory({
  scope,
  hideHeader = false,
}: {
  scope: Scope;
  hideHeader?: boolean;
}) {
  const query = useQuery({
    queryKey:
      scope === "driver"
        ? queryKeys.disputes.driver()
        : queryKeys.disputes.provider(),
    queryFn: () =>
      scope === "driver"
        ? bookingsApi.driverDisputes()
        : bookingsApi.providerDisputes(),
  });
  if (query.isPending) {
    return (
      <div
        aria-busy="true"
        role="status"
        className="rounded-lg border bg-white px-6 py-14 text-center"
      >
        <Loader2 className="mx-auto size-6 animate-spin text-emerald-700" />
        <p className="mt-3 text-sm text-slate-600">Loading disputes...</p>
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p role="alert">{getApiErrorMessage(query.error)}</p>
        {scope === "provider" && (
          <Button
            variant="outline"
            className="mt-3"
            onClick={() => void query.refetch()}
          >
            Retry
          </Button>
        )}
      </div>
    );
  }
  const base = scope === "driver" ? "/driver/disputes" : "/provider/disputes";
  return (
    <div className="w-full space-y-5">
      {!hideHeader && (
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Disputes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Booking disputes visible within your account scope.
          </p>
        </div>
      )}
      <div className="divide-y overflow-hidden rounded-lg border bg-white shadow-xs">
        {query.data.disputes.map((dispute) => (
          <Link
            href={`${base}/${dispute.id}`}
            key={dispute.id}
            className="block p-4 transition-colors hover:bg-slate-50"
          >
            <div className="flex justify-between gap-4">
              <div>
                <strong className="text-slate-900">
                  {dispute.booking?.bookingCode ?? dispute.bookingId}
                </strong>
                <p className="mt-1 text-xs text-slate-500">
                  {dispute.booking?.property?.name} ·{" "}
                  {dispute.category.replaceAll("_", " ")} ·{" "}
                  {formatDateTime(dispute.createdAt)}
                </p>
              </div>
              <span className="inline-flex items-center self-start rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800">
                {dispute.status.replaceAll("_", " ")}
              </span>
            </div>
          </Link>
        ))}
        {query.data.disputes.length === 0 && (
          <div className="p-12 text-center text-sm text-slate-500">
            <p className="text-base font-semibold text-slate-800">
              No disputes yet.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Booking disputes will appear here if opened by drivers or your
              staff.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function DisputeDetail({
  scope,
  disputeId,
  hideHeader = false,
}: {
  scope: Scope;
  disputeId: string;
  hideHeader?: boolean;
}) {
  const query = useQuery({
    queryKey: queryKeys.disputes.detail(scope, disputeId),
    queryFn: () =>
      scope === "driver"
        ? bookingsApi.driverDispute(disputeId)
        : bookingsApi.providerDispute(disputeId),
  });
  if (query.isPending) {
    return (
      <div className="rounded-lg border bg-white px-6 py-14 text-center">
        <Loader2 className="mx-auto size-6 animate-spin text-emerald-700" />
        <p className="mt-3 text-sm text-slate-600">
          Loading dispute details...
        </p>
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p role="alert">{getApiErrorMessage(query.error)}</p>
      </div>
    );
  }
  const dispute = query.data;
  const back = scope === "driver" ? "/driver/disputes" : "/provider/disputes";
  return (
    <div className="w-full space-y-6">
      <Link
        href={back}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="size-4" />
        Disputes
      </Link>
      {!hideHeader && (
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Dispute detail
          </h1>
          <p className="mt-1 font-mono text-xs text-slate-500">{dispute.id}</p>
        </div>
      )}
      <section className="grid gap-4 rounded-lg border bg-white p-6 shadow-xs sm:grid-cols-2">
        <Info label="Status" value={dispute.status.replaceAll("_", " ")} />
        <Info label="Category" value={dispute.category.replaceAll("_", " ")} />
        <Info
          label="Booking"
          value={dispute.booking?.bookingCode ?? dispute.bookingId}
        />
        <Info
          label="Property"
          value={dispute.booking?.property?.name ?? "Unavailable"}
        />
        <Info
          label="Opened by"
          value={dispute.openedBy?.fullName ?? "Account user"}
        />
        <Info label="Opened" value={formatDateTime(dispute.createdAt)} />
        <div className="sm:col-span-2">
          <Info label="Description" value={dispute.description} />
        </div>
        {dispute.resolution && (
          <div className="sm:col-span-2">
            <Info label="Resolution" value={dispute.resolution} />
          </div>
        )}
      </section>
      {dispute.evidence && dispute.evidence.length > 0 && (
        <section>
          <h2 className="mb-3 font-bold text-slate-900">Evidence</h2>
          <div className="space-y-2">
            {dispute.evidence.map((item, index) => (
              <a
                key={`${item.url}-${index}`}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border bg-white p-3 text-sm font-semibold text-emerald-800 transition-colors hover:bg-slate-50 shadow-xs"
              >
                {item.type}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{value}</p>
    </div>
  );
}
