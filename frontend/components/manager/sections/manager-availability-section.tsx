"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CalendarX,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parkingResourcesApi } from "@/lib/api/parking-resources-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { queryKeys } from "@/lib/query-keys";
import type { ParkingResourceDto } from "@/lib/api/marketplace-types";

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function ResourceAvailability({ resource }: { resource: ParkingResourceDto }) {
  const [expanded, setExpanded] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const client = useQueryClient();

  const avQuery = useQuery({
    queryKey: queryKeys.availability.byResource(resource.id),
    queryFn: () => parkingResourcesApi.availability(resource.id),
    enabled: expanded,
  });

  const addException = useMutation({
    mutationFn: () =>
      parkingResourcesApi.addException(resource.id, {
        startsAt: new Date(`${startDate}T00:00:00+06:00`).toISOString(),
        endsAt: new Date(`${endDate}T23:59:59+06:00`).toISOString(),
        exceptionType: "BLOCKED",
        reason: reason || undefined,
      }),
    onSuccess: () => {
      toast.success("Blocked period added");
      void client.invalidateQueries({
        queryKey: queryKeys.availability.byResource(resource.id),
      });
      setShowBlock(false);
      setStartDate("");
      setEndDate("");
      setReason("");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <button
        className="flex w-full items-center justify-between p-4 text-sm font-semibold text-slate-900 hover:bg-slate-50"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="flex items-center gap-2">
          <Calendar className="size-4 text-emerald-700" />
          {resource.displayName ?? resource.spotCode ?? "Parking resource"}
        </span>
        <ChevronDown
          className={`size-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-4">
          {avQuery.isPending ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin" />
              Loading schedule…
            </div>
          ) : avQuery.isError ? (
            <p className="text-sm text-red-700">
              {getApiErrorMessage(avQuery.error)}
            </p>
          ) : (
            <>
              {/* Rules */}
              {avQuery.data?.rules && avQuery.data.rules.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Weekly Schedule
                  </p>
                  <div className="space-y-1.5">
                    {avQuery.data.rules.map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-xs"
                      >
                        <span className="font-medium text-slate-700">
                          {DAY_LABELS[rule.dayOfWeek]}
                        </span>
                        <span className="text-slate-500">
                          {rule.startLocalTime} – {rule.endLocalTime}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            rule.isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {rule.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  No weekly schedule defined.
                </p>
              )}

              {/* Exceptions */}
              {avQuery.data?.exceptions && avQuery.data.exceptions.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Exceptions
                  </p>
                  <div className="space-y-1.5">
                    {avQuery.data.exceptions.map((ex) => (
                      <div
                        key={ex.id}
                        className="flex flex-wrap items-center gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs"
                      >
                        <CalendarX className="size-3.5 text-amber-700" />
                        <span className="font-medium text-amber-800">
                          {ex.exceptionType === "BLOCKED"
                            ? "Blocked"
                            : "Special open"}
                        </span>
                        <span className="text-slate-600">
                          {new Date(ex.startsAt).toLocaleDateString()} –{" "}
                          {new Date(ex.endsAt).toLocaleDateString()}
                        </span>
                        {ex.reason && (
                          <span className="italic text-slate-500">
                            {ex.reason}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add block */}
              <div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowBlock((v) => !v)}
                  className="text-xs"
                >
                  <CalendarX className="size-3.5" />
                  Block a period
                </Button>

                {showBlock && (
                  <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-700">
                      Block availability
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-500">Start date</label>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="mt-1 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">End date</label>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="mt-1 h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">
                        Reason (optional)
                      </label>
                      <Input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. Maintenance, Private event"
                        className="mt-1 h-8 text-xs"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={!startDate || !endDate || addException.isPending}
                        onClick={() => addException.mutate()}
                      >
                        {addException.isPending && (
                          <Loader2 className="size-3 animate-spin" />
                        )}
                        Block period
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowBlock(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function ManagerAvailabilitySection({
  resources,
}: {
  resources: ParkingResourceDto[];
}) {
  if (resources.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No resources available to configure. Add parking resources first.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Select a resource to view its schedule and block unavailable periods.
      </p>
      {resources.map((resource) => (
        <ResourceAvailability key={resource.id} resource={resource} />
      ))}
    </div>
  );
}
