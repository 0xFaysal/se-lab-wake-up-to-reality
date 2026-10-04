"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChartGantt, List, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  PageEmptyState,
  PageErrorState,
  PageSkeleton,
  ProviderPage,
  ProviderPageHeader,
} from "./provider-page";
import { propertyApi } from "@/lib/api/property-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import {
  sessionTimelineApi,
  type SessionKind,
  type SessionSegment,
  type SessionRow,
  type SessionTimeline,
} from "@/lib/api/session-timeline-api";
import { queryKeys } from "@/lib/query-keys";
import {
  dhakaDate,
  nextSevenDates,
  timelinePosition,
  sessionLanes,
  timelineClock,
  timelineHour,
  graceDuration,
} from "@/lib/provider-session-display";
import { cn } from "@/lib/utils";
import { selectWorkingProperty } from "@/lib/provider-property-selection";

const colors: Record<SessionKind, string> = {
  RESERVATION: "bg-blue-100 text-blue-950 border-blue-300",
  PRESENT: "bg-emerald-100 text-emerald-950 border-emerald-400",
  GRACE: "bg-amber-100 text-amber-950 border-amber-400",
  OVERTIME: "bg-red-100 text-red-950 border-red-400",
  CHECKOUT_REQUESTED: "bg-violet-100 text-violet-950 border-violet-300",
  HOLD: "bg-slate-100 text-slate-700 border-dashed border-slate-400",
  BLOCKED: "bg-slate-200 text-slate-800 border-dashed border-slate-400",
};
const statusLabel = (kind: string) =>
  kind === "ALL"
    ? "All spots"
    : kind === "PRESENT"
      ? "Parked"
      : kind.toLowerCase().replaceAll("_", " ");
const clock = timelineClock;
const time = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Dhaka",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(value))
    : "Not recorded";
const subscribeWidth = (callback: () => void) => {
  const media = window.matchMedia("(max-width: 767px)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
};
const narrowSnapshot = () => window.matchMedia("(max-width: 767px)").matches;

export function ProviderSessionWorkspace() {
  const router = useRouter(),
    params = useSearchParams();
  const [clientNow, setClientNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setClientNow(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, []);
  const today = dhakaDate(new Date(clientNow));
  const dates = nextSevenDates(today),
    date = dates.includes(params.get("date") ?? "")
      ? params.get("date")!
      : today;
  const narrow = useSyncExternalStore(
    subscribeWidth,
    narrowSnapshot,
    () => false,
  );
  const view =
    params.get("view") === "list"
      ? "list"
      : params.get("view") === "timeline"
        ? "timeline"
        : narrow
          ? "list"
          : "timeline";
  const filter = params.get("filter") ?? "ALL";
  const properties = useQuery({
    queryKey: queryKeys.properties.all(),
    queryFn: propertyApi.list,
  });
  const selectedProperty = selectWorkingProperty(
    properties.data,
    params.get("propertyId"),
  );
  const propertyId = selectedProperty?.id ?? "";
  const setParams = (values: Record<string, string>) => {
    const next = new URLSearchParams(params);
    next.set("propertyId", propertyId);
    next.set("date", date);
    next.set("view", view);
    next.set("filter", filter);
    for (const [key, value] of Object.entries(values)) next.set(key, value);
    router.replace(`/provider/sessions?${next}`, { scroll: false });
  };
  const operational =
    selectedProperty?.verificationStatus === "VERIFIED" &&
    selectedProperty.status === "ACTIVE";
  const query = useQuery({
    queryKey: [...queryKeys.bookings.root, "timeline", propertyId, date],
    queryFn: ({ signal }) => sessionTimelineApi.get(propertyId, date, signal),
    enabled: Boolean(propertyId) && operational,
    refetchInterval: () =>
      typeof document !== "undefined" && document.visibilityState === "visible"
        ? 30_000
        : false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
  const [selection, setSelection] = useState<{
    propertyId: string;
    date: string;
    row: SessionRow;
    segment: SessionSegment;
  } | null>(null);
  const selectedRow =
    selection?.propertyId === propertyId && selection.date === date
      ? query.data?.rows.find((row) => row.id === selection.row.id)
      : undefined;
  const selectedSegment = selectedRow?.segments.find(
    (segment) => segment.id === selection?.segment.id,
  );
  const selected =
    selectedRow && selectedSegment
      ? { row: selectedRow, segment: selectedSegment }
      : null;
  const rows =
    query.data?.rows.filter(
      (row) => filter === "ALL" || row.segments.some((s) => s.kind === filter),
    ) ?? [];
  return (
    <ProviderPage className="max-w-[96rem]">
      <ProviderPageHeader
        title="Live sessions"
        description="Parking occupancy and scheduled availability, Asia/Dhaka."
        breadcrumbs={[{ label: "Operations" }, { label: "Live sessions" }]}
        actions={
          <Button
            variant="outline"
            disabled={query.isFetching || !propertyId}
            onClick={() => void query.refetch()}
          >
            <RefreshCw
              className={cn("size-4", query.isFetching && "animate-spin")}
            />
            Refresh
          </Button>
        }
      />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="w-full sm:w-80">
          <span className="mb-2 block text-sm font-medium">
            Working property
          </span>
          <Select
            value={propertyId || null}
            onValueChange={(value) => value && setParams({ propertyId: value })}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue
                placeholder={
                  properties.isPending
                    ? "Loading properties"
                    : "Choose a property"
                }
              >
                {() => selectedProperty?.name ?? "Choose a property"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {properties.data?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <div className="flex flex-wrap gap-3">
          <label>
            <span className="mb-2 block text-sm font-medium">Status</span>
            <Select
              value={filter}
              onValueChange={(value) => value && setParams({ filter: value })}
            >
              <SelectTrigger className="w-44 bg-white">
                <SelectValue>{() => statusLabel(filter)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {[
                  "ALL",
                  "RESERVATION",
                  "PRESENT",
                  "GRACE",
                  "OVERTIME",
                  "CHECKOUT_REQUESTED",
                  "HOLD",
                  "BLOCKED",
                ].map((value) => (
                  <SelectItem key={value} value={value}>
                    {statusLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <div
            className="flex items-end gap-1"
            role="group"
            aria-label="Session view"
          >
            <Button
              variant={view === "timeline" ? "default" : "outline"}
              aria-pressed={view === "timeline"}
              onClick={() => setParams({ view: "timeline" })}
            >
              <ChartGantt className="size-4" />
              Timeline
            </Button>
            <Button
              variant={view === "list" ? "default" : "outline"}
              aria-pressed={view === "list"}
              onClick={() => setParams({ view: "list" })}
            >
              <List className="size-4" />
              List
            </Button>
          </div>
        </div>
      </div>
      <nav
        aria-label="Session date"
        className="flex gap-1 overflow-x-auto border-b pb-3"
      >
        {dates.map((day) => (
          <button
            type="button"
            key={day}
            aria-current={day === date ? "date" : undefined}
            onClick={() => setParams({ date: day })}
            className={cn(
              "flex min-h-12 min-w-24 flex-col items-center justify-center rounded-md px-3 text-sm",
              day === date
                ? "bg-emerald-950 text-white"
                : "bg-white text-slate-700 hover:bg-slate-100",
            )}
          >
            <span className="text-xs">
              {day === today
                ? "Today"
                : new Intl.DateTimeFormat("en-GB", {
                    timeZone: "Asia/Dhaka",
                    weekday: "short",
                  }).format(new Date(`${day}T12:00:00+06:00`))}
            </span>
            <strong>
              {new Intl.DateTimeFormat("en-GB", {
                timeZone: "Asia/Dhaka",
                month: "short",
                day: "numeric",
              }).format(new Date(`${day}T12:00:00+06:00`))}
            </strong>
          </button>
        ))}
      </nav>
      {properties.isError ? (
        <PageErrorState
          message={getApiErrorMessage(properties.error)}
          retry={() => void properties.refetch()}
        />
      ) : properties.isPending ? (
        <PageSkeleton label="Loading properties" />
      ) : !propertyId ? (
        <PageEmptyState
          title="No properties yet"
          description="Add a parking property to manage occupancy."
          action={{ label: "Add property", href: "/provider/properties/new" }}
        />
      ) : !operational ? (
        <PageEmptyState
          title="Property not operational"
          description="Property verification and active provider authority are required before sessions can be viewed."
          action={{
            label: "Property workspace",
            href: `/provider/properties/${propertyId}`,
          }}
        />
      ) : query.isPending ? (
        <PageSkeleton label="Loading occupancy" />
      ) : query.isError ? (
        <PageErrorState
          message={getApiErrorMessage(query.error)}
          retry={() => void query.refetch()}
        />
      ) : (
        query.data && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <span>
                {rows.length} spot rows · 12:00 AM to 12:00 AM next day
              </span>
              <span role="status">
                {query.isFetching
                  ? "Refreshing occupancy..."
                  : `Updated ${clock(query.data.serverNow)}`}
                {clientNow - query.dataUpdatedAt > 60_000
                  ? " · Data may be out of date"
                  : ""}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs">
              {(
                [
                  "RESERVATION",
                  "PRESENT",
                  "GRACE",
                  "OVERTIME",
                  "CHECKOUT_REQUESTED",
                  "HOLD",
                  "BLOCKED",
                ] as SessionKind[]
              ).map((kind) => (
                <span key={kind} className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={cn("size-3 rounded-sm border", colors[kind])}
                  />
                  {statusLabel(kind)}
                </span>
              ))}
            </div>
            {rows.length === 0 ? (
              <PageEmptyState
                title={
                  query.data.rows.length
                    ? "No matching spots"
                    : "No parking resources"
                }
                description={
                  query.data.rows.length
                    ? "Choose another status or date."
                    : "Add parking resources in the property workspace."
                }
                action={{
                  label: "Property workspace",
                  href: `/provider/properties/${propertyId}`,
                }}
              />
            ) : view === "timeline" ? (
              <>
                <ReservationTimings
                  rows={rows}
                  onSelect={(row, segment) =>
                    setSelection({ propertyId, date, row, segment })
                  }
                />
                <Timeline
                  data={query.data}
                  rows={rows}
                  onSelect={(row, segment) =>
                    setSelection({ propertyId, date, row, segment })
                  }
                />
              </>
            ) : (
              <div className="divide-y border-y bg-white">
                {rows.map((row) => (
                  <section key={row.id} className="p-4">
                    <div className="flex flex-wrap justify-between gap-2">
                      <h2 className="font-semibold">{row.unitName}</h2>
                      <span className="text-sm text-slate-500">
                        {row.resourceName}
                        {row.resourceType === "SHARED_POOL"
                          ? ` · Capacity ${row.capacity}`
                          : ""}
                      </span>
                    </div>
                    <div className="mt-4 space-y-2">
                      {row.segments.map((segment) => (
                        <button
                          key={segment.id}
                          type="button"
                          onClick={() =>
                            setSelection({ propertyId, date, row, segment })
                          }
                          className={cn(
                            "flex min-h-11 w-full flex-wrap justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm",
                            colors[segment.kind],
                          )}
                        >
                          <span>
                            {segment.driverName ?? segment.label}
                            {segment.plate ? ` · ${segment.plate}` : ""}
                          </span>
                          <span>
                            {clock(segment.startAt)} - {clock(segment.endAt)} ·{" "}
                            {segment.label}
                          </span>
                        </button>
                      ))}
                      {row.segments.length === 0 && (
                        <p className="text-sm text-slate-500">
                          No reservations or cars recorded for this date.
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      {row.availability.map((interval, i) => (
                        <span
                          key={i}
                          className={cn(
                            "rounded-md px-3 py-2",
                            interval.availableCapacity
                              ? "bg-emerald-50 text-emerald-900"
                              : "bg-slate-100 text-slate-600",
                          )}
                        >
                          {clock(interval.startAt)} -{" "}
                          {interval.endAt === query.data!.dayEnd
                            ? "12:00 AM next day"
                            : clock(interval.endAt)}{" "}
                          · {interval.label}
                          {interval.availableCapacity
                            ? ` (${interval.availableCapacity})`
                            : ""}
                        </span>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        )
      )}
      <Sheet
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelection(null)}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {selected?.segment.bookingCode ?? "Spot activity"}
            </SheetTitle>
            <SheetDescription>
              {selected?.row.resourceName} · {selected?.row.unitName}
            </SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="space-y-5 px-4 pb-8">
              <span
                className={cn(
                  "inline-block rounded-md border px-3 py-1 text-sm",
                  colors[selected.segment.kind],
                )}
              >
                {selected.segment.label}
              </span>
              <dl className="space-y-4">
                {(selected.segment.bookingId
                  ? [
                      [
                        "Driver",
                        selected.segment.driverName ?? "Private occupancy",
                      ],
                      ["Vehicle", selected.segment.plate ?? "Not disclosed"],
                      [
                        "Scheduled arrival",
                        time(selected.segment.scheduledStartAt),
                      ],
                      [
                        "Scheduled departure",
                        time(selected.segment.scheduledEndAt),
                      ],
                      ["Actual check-in", time(selected.segment.checkedInAt)],
                      ["Grace ends", time(selected.segment.graceEndAt)],
                      [
                        "Entry opens",
                        time(selected.segment.entryGraceStartsAt),
                      ],
                      [
                        "Entry grace",
                        `${graceDuration(selected.segment.entryGraceStartsAt, selected.segment.scheduledStartAt) ?? "Not recorded"} min`,
                      ],
                      [
                        "Exit grace",
                        `${graceDuration(selected.segment.scheduledEndAt, selected.segment.graceEndAt) ?? "Not recorded"} min${selected.segment.overtimePolicyVersion !== 2 ? " (saved policy)" : ""}`,
                      ],
                      ["Actual checkout", time(selected.segment.checkedOutAt)],
                    ]
                  : [
                      ["Interval starts", time(selected.segment.startAt)],
                      ["Interval ends", time(selected.segment.endAt)],
                    ]
                ).map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-slate-500">{label}</dt>
                    <dd className="mt-1 break-words text-sm font-medium">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              {selected.segment.overtimePolicyVersion === 2 && (
                <p className="text-sm leading-6 text-slate-600">
                  Exit within 5 minutes is free. After that, overtime counts
                  from the scheduled departure, including the initial 5 minutes,
                  with a 2-minute allowance at guard checkout.
                </p>
              )}
              {selected.segment.bookingId &&
                selected.segment.overtimePolicyVersion !== 2 && (
                  <p className="text-sm leading-6 text-slate-600">
                    This reservation keeps its original saved exit grace and
                    overtime terms.
                  </p>
                )}
              {selected.segment.awaitingCheckout && (
                <p className="border-l-2 border-amber-500 bg-amber-50 p-3 text-sm text-amber-950">
                  Awaiting checkout. Departure is not confirmed.
                </p>
              )}
              {selected.segment.bookingId && (
                <Button
                  render={
                    <Link
                      href={`/provider/bookings/${selected.segment.bookingId}`}
                    />
                  }
                >
                  View booking
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </ProviderPage>
  );
}
function Timeline({
  data,
  rows,
  onSelect,
}: {
  data: SessionTimeline;
  rows: SessionRow[];
  onSelect: (row: SessionRow, segment: SessionSegment) => void;
}) {
  const now = Date.parse(data.serverNow),
    start = Date.parse(data.dayStart),
    end = Date.parse(data.dayEnd);
  return (
    <div
      className="overflow-x-auto rounded-lg border bg-white"
      tabIndex={0}
      aria-label="24 hour spot timeline"
    >
      <div className="min-w-[1200px]">
        <div className="sticky top-0 z-10 grid grid-cols-[190px_minmax(0,1fr)] border-b bg-white">
          <div className="sticky left-0 z-20 bg-white p-3 text-sm font-semibold">
            Spot / shared pool
          </div>
          <div className="relative h-12 border-l text-xs font-medium tabular-nums text-slate-600">
            {Array.from({ length: 13 }, (_, i) => (
              <span
                key={i}
                style={{ left: `${(i / 12) * 100}%` }}
                className={cn(
                  "absolute top-2 flex w-14 flex-col items-center whitespace-nowrap leading-4",
                  i === 0
                    ? ""
                    : i === 12
                      ? "-translate-x-full"
                      : "-translate-x-1/2",
                )}
              >
                <span>{timelineHour(new Date(start + i * 2 * 3600_000).toISOString())}</span>
                {i === 12 && <span className="text-[10px] font-normal text-slate-500">Next day</span>}
              </span>
            ))}
          </div>
        </div>
        {rows.map((row) => {
          const lanes = sessionLanes(row.segments);
          const laneCount = Math.max(1, ...lanes.map((item) => item.lane + 1));
          const graceLabels = [
            ...new Set(
              row.segments
                .filter((segment) => segment.bookingId)
                .map((segment) => {
                  const entry = graceDuration(
                    segment.entryGraceStartsAt,
                    segment.scheduledStartAt,
                  );
                  const exit = graceDuration(
                    segment.scheduledEndAt,
                    segment.graceEndAt,
                  );
                  return entry !== null && exit !== null
                    ? `Entry ${entry} min / Exit ${exit} min`
                    : null;
                })
                .filter(Boolean),
            ),
          ];
          return (
            <div
              key={row.id}
              className="grid grid-cols-[190px_minmax(0,1fr)] border-b last:border-0"
            >
              <div className="sticky left-0 z-20 border-r bg-white p-3">
                <strong className="block text-sm">{row.unitName}</strong>
                <span className="mt-1 block text-xs text-slate-500">
                  {row.resourceName}
                  {row.resourceType === "SHARED_POOL"
                    ? ` · ${row.capacity} spaces`
                    : ""}
                </span>
                {graceLabels.map((label) => (
                  <span
                    key={label}
                    className="mt-1 block text-[11px] text-amber-800"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div
                style={{ height: Math.max(80, laneCount * 48 + 28) }}
                className="relative bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(8.333%_-_1px),#e2e8f0_calc(8.333%_-_1px),#e2e8f0_8.333%)]"
              >
                {row.availability.map((interval, i) => (
                  <div
                    key={i}
                    style={timelinePosition(
                      interval.startAt,
                      interval.endAt,
                      data.dayStart,
                      data.dayEnd,
                    )}
                    className={cn(
                      "absolute bottom-0 h-5 overflow-hidden border-t text-[10px]",
                      interval.availableCapacity
                        ? "bg-emerald-50 text-emerald-900"
                        : "bg-slate-100 text-slate-500",
                    )}
                    title={`${clock(interval.startAt)} to ${clock(interval.endAt)} · ${interval.label} · ${interval.availableCapacity} free`}
                  >
                    {interval.availableCapacity
                      ? `${interval.availableCapacity} scheduled free`
                      : interval.label}
                  </div>
                ))}
                {lanes.map(({ segment, lane }) => (
                  <button
                    key={segment.id}
                    type="button"
                    style={{
                      ...timelinePosition(
                        segment.startAt,
                        segment.endAt,
                        data.dayStart,
                        data.dayEnd,
                      ),
                      top: 6 + lane * 48,
                    }}
                    onClick={() => onSelect(row, segment)}
                    aria-label={`${row.unitName}, ${segment.label}, ${segment.driverName ?? "Private occupancy"}, ${clock(segment.startAt)} to ${clock(segment.endAt)}`}
                    title={`${segment.label} · ${segment.plate ?? ""} · ${clock(segment.startAt)}–${clock(segment.endAt)}`}
                    className={cn(
                      "absolute h-10 overflow-hidden border text-left text-xs focus-visible:z-30 focus-visible:outline-2 focus-visible:outline-emerald-800",
                      segment.kind === "GRACE"
                        ? "rounded-none p-0"
                        : "rounded px-1.5",
                      colors[segment.kind],
                    )}
                  >
                    <span className="sr-only">
                      {segment.label} · {clock(segment.startAt)}–
                      {clock(segment.endAt)}
                    </span>
                    {segment.kind !== "GRACE" && (
                      <>
                        <span className="flex justify-between gap-1 whitespace-nowrap text-[10px] font-semibold tabular-nums">
                          <span>{clock(segment.startAt)}</span>
                          <span>{clock(segment.endAt)}</span>
                        </span>
                        <span className="block truncate text-[11px]">
                          {segment.plate ?? segment.label}
                        </span>
                      </>
                    )}
                  </button>
                ))}
                {now >= start && now < end && (
                  <div
                    className="pointer-events-none absolute inset-y-0 z-10 border-l-2 border-red-600"
                    style={{
                      left: `${((now - start) / (end - start)) * 100}%`,
                    }}
                  >
                    <span className="sr-only">
                      Current time {clock(data.serverNow)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReservationTimings({
  rows,
  onSelect,
}: {
  rows: SessionRow[];
  onSelect: (row: SessionRow, segment: SessionSegment) => void;
}) {
  const bookings = rows.flatMap((row) => {
    const seen = new Set<string>();
    return row.segments
      .filter((segment) => {
        if (!segment.bookingId || seen.has(segment.bookingId)) return false;
        seen.add(segment.bookingId);
        return true;
      })
      .map((segment) => ({ row, segment }));
  });
  if (!bookings.length) return null;
  return (
    <section aria-label="Reservation timings" className="space-y-3">
      <h2 className="text-base font-semibold">Reservation timings</h2>
      <div className="overflow-x-auto border-y bg-white">
        <table className="w-full min-w-[780px] text-left text-xs tabular-nums">
          <thead className="border-b bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3 font-medium">Spot / vehicle</th>
              <th className="p-3 font-medium text-amber-900">Entry grace</th>
              <th className="p-3 font-medium text-blue-900">Reserved</th>
              <th className="p-3 font-medium text-amber-900">
                Exit grace / free exit until
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {bookings.map(({ row, segment }) => (
              <tr key={`${row.id}:${segment.bookingId}`}>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => onSelect(row, segment)}
                    className="min-h-10 text-left text-sm font-medium text-emerald-900 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-emerald-800"
                  >
                    {row.unitName}
                    <span className="block text-xs font-normal text-slate-600">
                      {segment.plate ?? segment.bookingCode}
                    </span>
                  </button>
                </td>
                <td className="p-3">
                  <span className="block whitespace-nowrap font-medium">
                    {segment.entryGraceStartsAt
                      ? clock(segment.entryGraceStartsAt)
                      : "Not recorded"}{" "}
                    -{" "}
                    {segment.scheduledStartAt
                      ? clock(segment.scheduledStartAt)
                      : "Not recorded"}
                  </span>
                  <span className="mt-1 block text-amber-800">
                    {graceDuration(
                      segment.entryGraceStartsAt,
                      segment.scheduledStartAt,
                    ) ?? "-"}{" "}
                    min
                  </span>
                </td>
                <td className="p-3">
                  <span className="block whitespace-nowrap font-medium">
                    {segment.scheduledStartAt
                      ? clock(segment.scheduledStartAt)
                      : "Not recorded"}{" "}
                    -{" "}
                    {segment.scheduledEndAt
                      ? clock(segment.scheduledEndAt)
                      : "Not recorded"}
                  </span>
                  <span className="mt-1 block text-blue-800">
                    {segment.bookingCode}
                  </span>
                </td>
                <td className="p-3">
                  <span className="block whitespace-nowrap font-medium">
                    {segment.scheduledEndAt
                      ? clock(segment.scheduledEndAt)
                      : "Not recorded"}{" "}
                    -{" "}
                    {segment.graceEndAt
                      ? clock(segment.graceEndAt)
                      : "Not recorded"}
                  </span>
                  <span className="mt-1 block text-amber-800">
                    {graceDuration(
                      segment.scheduledEndAt,
                      segment.graceEndAt,
                    ) ?? "-"}{" "}
                    min
                    {segment.overtimePolicyVersion !== 2
                      ? " · Saved policy"
                      : ""}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
