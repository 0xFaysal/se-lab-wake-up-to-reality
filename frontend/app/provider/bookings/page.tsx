"use client";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  PageEmptyState,
  PageErrorState,
  PageSkeleton,
  ProviderPage,
  ProviderPageHeader,
} from "@/components/provider/provider-page";
import { bookingsApi } from "@/lib/api/bookings-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatBDTFromPaisa, formatDateTime } from "@/lib/formatters";
import { bookingStatus } from "@/lib/marketplace-status";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProviderBookingsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: [...queryKeys.bookings.provider(), statusFilter],
    queryFn: () =>
      bookingsApi.providerList(
        statusFilter === "ALL" ? undefined : { status: statusFilter },
      ),
    refetchInterval: () =>
      document.visibilityState === "visible" ? 30_000 : false,
  });
  const matches =
    query.data?.filter((booking) =>
      [
        booking.bookingCode,
        booking.property?.name,
        booking.vehicle?.registrationNumber,
      ].some((value) =>
        value?.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    ) ?? [];
  const pages = Math.max(1, Math.ceil(matches.length / 20));
  const currentPage = Math.min(page, pages);
  const displayed = matches.slice((currentPage - 1) * 20, currentPage * 20);
  return (
    <ProviderPage>
      <ProviderPageHeader
        title="Bookings"
        description="Review reservations within your commercial or delegated parking scope."
        breadcrumbs={[{ label: "Operations" }, { label: "Bookings" }]}
      />
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1">
          <span className="mb-2 block text-sm font-medium">
            Search reservations
          </span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" />
            <Input
              className="bg-white pl-9"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Booking, property or vehicle"
            />
          </div>
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium">Status</span>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              if (value) {
                setStatusFilter(value);
                setPage(1);
              }
            }}
          >
            <SelectTrigger className="w-48 bg-white">
              <SelectValue>
                {() =>
                  statusFilter === "ALL"
                    ? "All reservations"
                    : bookingStatus[statusFilter as keyof typeof bookingStatus]
                        ?.label
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All reservations</SelectItem>
              {Object.entries(bookingStatus).map(([value, status]) => (
                <SelectItem key={value} value={value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>
      {query.isPending ? (
        <PageSkeleton label="Loading bookings" />
      ) : query.isError ? (
        <PageErrorState
          message={getApiErrorMessage(query.error)}
          retry={() => void query.refetch()}
        />
      ) : matches.length === 0 ? (
        <PageEmptyState
          title={
            search || statusFilter !== "ALL"
              ? "No matching reservations"
              : "No bookings yet"
          }
          description={
            search || statusFilter !== "ALL"
              ? "Choose another status or search term."
              : "Bookings will appear after an active listing receives a reservation."
          }
          action={{ label: "View listings", href: "/provider/listings" }}
        />
      ) : (
        <>
          <div className="divide-y border bg-white">
            {displayed.map((booking) => {
              const status = bookingStatus[booking.status];
              return (
                <Link
                  href={`/provider/bookings/${booking.id}`}
                  key={booking.id}
                  className="grid gap-3 p-5 hover:bg-slate-50 sm:grid-cols-[1fr_auto]"
                >
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <strong className="font-mono">
                        {booking.bookingCode}
                      </strong>
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold">
                      {booking.property?.name} ·{" "}
                      {booking.parkingSpot?.resourceType === "SHARED_POOL"
                        ? "Shared parking area"
                        : booking.parkingSpot?.displayName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {booking.vehicle?.registrationNumber} ·{" "}
                      {formatDateTime(booking.startAt)} -{" "}
                      {formatDateTime(booking.scheduledEndAt)}
                    </p>
                  </div>
                  <div className="text-sm sm:text-right">
                    <span className="block text-xs text-slate-500">
                      Reservation total
                    </span>
                    <strong>
                      {formatBDTFromPaisa(booking.totalAmountPaisa)}
                    </strong>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <span>{matches.length} reservations</span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                aria-label="Previous booking page"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span>
                {currentPage} / {pages}
              </span>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next booking page"
                disabled={currentPage >= pages}
                onClick={() => setPage(currentPage + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </ProviderPage>
  );
}
