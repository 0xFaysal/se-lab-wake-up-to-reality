"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CalendarX,
  ChevronDown,
  Clock,
  Edit2,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { parkingResourcesApi } from "@/lib/api/parking-resources-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { queryKeys } from "@/lib/query-keys";
import type { ParkingResourceDto, AvailabilityRuleInput } from "@/lib/api/marketplace-types";

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function ResourceAvailability({
  resource,
  canManage,
}: {
  resource: ParkingResourceDto;
  canManage: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  // Exception form states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  // Weekly schedule edit states (day 0 to 6)
  const [weeklyDays, setWeeklyDays] = useState<
    Array<{ dayOfWeek: number; active: boolean; start: string; end: string }>
  >(() =>
    DAY_LABELS.map((_, i) => ({
      dayOfWeek: i,
      active: i !== 5, // Active except Friday by default
      start: "08:00",
      end: "22:00",
    })),
  );

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

  const removeException = useMutation({
    mutationFn: (exceptionId: string) =>
      parkingResourcesApi.removeException(exceptionId),
    onSuccess: () => {
      toast.success("Exception removed");
      void client.invalidateQueries({
        queryKey: queryKeys.availability.byResource(resource.id),
      });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const saveWeeklySchedule = useMutation({
    mutationFn: () => {
      const activeRules: AvailabilityRuleInput[] = weeklyDays
        .filter((d) => d.active)
        .map((d) => ({
          dayOfWeek: d.dayOfWeek,
          startLocalTime: d.start,
          endLocalTime: d.end,
          validFrom: new Date().toISOString(),
        }));

      return parkingResourcesApi.replaceAvailability(resource.id, activeRules);
    },
    onSuccess: () => {
      toast.success("Weekly availability schedule updated");
      void client.invalidateQueries({
        queryKey: queryKeys.availability.byResource(resource.id),
      });
      setShowScheduleDialog(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const handleOpenScheduleDialog = () => {
    if (avQuery.data?.rules && avQuery.data.rules.length > 0) {
      const updated = DAY_LABELS.map((_, i) => {
        const found = avQuery.data.rules.find((r) => r.dayOfWeek === i && r.isActive);
        return {
          dayOfWeek: i,
          active: Boolean(found),
          start: found?.startLocalTime || "08:00",
          end: found?.endLocalTime || "22:00",
        };
      });
      setWeeklyDays(updated);
    }
    setShowScheduleDialog(true);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <button
        className="flex w-full items-center justify-between p-4 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="flex items-center gap-2">
          <Calendar className="size-4 text-emerald-700" />
          {resource.displayName ?? resource.spotCode ?? "Parking resource"}
          <span className="text-xs font-normal text-slate-500">
            ({resource.resourceType === "FIXED_SPACE" ? "Fixed Space" : "Shared Pool"})
          </span>
        </span>
        <ChevronDown
          className={`size-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/50">
          {avQuery.isPending ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin" />
              Loading schedule…
            </div>
          ) : avQuery.isError ? (
            <p className="text-sm text-red-700">{getApiErrorMessage(avQuery.error)}</p>
          ) : (
            <>
              {/* Weekly Schedule Header & Action */}
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Weekly Operating Schedule
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Configured operating hours for recurring driver bookings.
                    </p>
                  </div>
                  {canManage && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 border-slate-300"
                      onClick={handleOpenScheduleDialog}
                    >
                      <Edit2 className="size-3" />
                      Configure Schedule
                    </Button>
                  )}
                </div>

                {avQuery.data?.rules && avQuery.data.rules.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {avQuery.data.rules.map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-xs border border-slate-100"
                      >
                        <span className="font-semibold text-slate-800">
                          {DAY_LABELS[rule.dayOfWeek]}
                        </span>
                        <span className="text-slate-600 font-mono">
                          {rule.startLocalTime} – {rule.endLocalTime}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    No weekly schedule defined. Add hours to allow regular driver reservations.
                  </p>
                )}
              </div>

              {/* Date Exceptions */}
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Date Exceptions &amp; Blocked Periods
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Specific dates blocked for maintenance, events, or private use.
                    </p>
                  </div>
                  {canManage && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 text-amber-700 border-amber-300 hover:bg-amber-50"
                      onClick={() => setShowBlock((v) => !v)}
                    >
                      <CalendarX className="size-3" />
                      Block Dates
                    </Button>
                  )}
                </div>

                {avQuery.data?.exceptions && avQuery.data.exceptions.length > 0 ? (
                  <div className="space-y-2">
                    {avQuery.data.exceptions.map((ex) => (
                      <div
                        key={ex.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CalendarX className="size-3.5 text-amber-700" />
                          <span className="font-bold text-amber-900">
                            {ex.exceptionType === "BLOCKED" ? "Blocked Period" : "Special Open"}
                          </span>
                          <span className="text-slate-700">
                            {new Date(ex.startsAt).toLocaleDateString()} –{" "}
                            {new Date(ex.endsAt).toLocaleDateString()}
                          </span>
                          {ex.reason && (
                            <span className="italic text-slate-500">({ex.reason})</span>
                          )}
                        </div>

                        {canManage && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => removeException.mutate(ex.id)}
                            disabled={removeException.isPending}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No date exceptions configured.</p>
                )}

                {/* Add Block Period Form */}
                {showBlock && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/60 p-4 space-y-3">
                    <h5 className="text-xs font-bold text-amber-950">Add Blocked Period</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">Start Date</label>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="mt-1 h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">End Date</label>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="mt-1 h-8 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">
                        Reason (e.g. Facility Maintenance)
                      </label>
                      <Input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Maintenance, private booking, etc."
                        className="mt-1 h-8 text-xs bg-white"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                      <Button size="sm" variant="outline" onClick={() => setShowBlock(false)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={!startDate || !endDate || addException.isPending}
                        onClick={() => addException.mutate()}
                        className="bg-amber-700 text-white hover:bg-amber-800"
                      >
                        {addException.isPending && (
                          <Loader2 className="size-3 animate-spin mr-1" />
                        )}
                        Confirm Block
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Configure Weekly Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Weekly Hours</DialogTitle>
            <DialogDescription>
              Set active daily operating windows for {resource.displayName || resource.spotCode}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 py-2">
            {weeklyDays.map((d, index) => (
              <div
                key={d.dayOfWeek}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 p-2.5 text-xs bg-white"
              >
                <label className="flex items-center gap-2 font-semibold text-slate-800 w-28">
                  <Checkbox
                    checked={d.active}
                    onCheckedChange={(checked) => {
                      const copy = [...weeklyDays];
                      copy[index]!.active = Boolean(checked);
                      setWeeklyDays(copy);
                    }}
                  />
                  {DAY_LABELS[d.dayOfWeek]}
                </label>

                {d.active ? (
                  <div className="flex items-center gap-1.5 font-mono">
                    <Input
                      type="time"
                      value={d.start}
                      onChange={(e) => {
                        const copy = [...weeklyDays];
                        copy[index]!.start = e.target.value;
                        setWeeklyDays(copy);
                      }}
                      className="h-7 w-24 text-xs p-1"
                    />
                    <span>–</span>
                    <Input
                      type="time"
                      value={d.end}
                      onChange={(e) => {
                        const copy = [...weeklyDays];
                        copy[index]!.end = e.target.value;
                        setWeeklyDays(copy);
                      }}
                      className="h-7 w-24 text-xs p-1"
                    />
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Closed</span>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button
              disabled={saveWeeklySchedule.isPending}
              onClick={() => saveWeeklySchedule.mutate()}
              className="bg-[#064E3B] text-white hover:bg-[#064E3B]/90"
            >
              {saveWeeklySchedule.isPending && (
                <Loader2 className="size-3.5 animate-spin mr-1" />
              )}
              Save Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ManagerAvailabilitySection({
  resources,
  canManage = true,
}: {
  resources: ParkingResourceDto[];
  canManage?: boolean;
}) {
  if (resources.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center">
        <Clock className="mx-auto size-7 text-slate-300" />
        <p className="mt-2 text-sm font-semibold text-slate-700">No resources available</p>
        <p className="mt-1 text-xs text-slate-500">
          Create or assign parking resources first to configure operating hours.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Expand any resource below to inspect and manage its weekly hours and date exceptions.
      </p>
      {resources.map((resource) => (
        <ResourceAvailability key={resource.id} resource={resource} canManage={canManage} />
      ))}
    </div>
  );
}
