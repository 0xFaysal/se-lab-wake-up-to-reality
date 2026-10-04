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
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { localClockTime } from "@/lib/operational-display";
import { availabilityEditorError, availabilityWindowInput, type AvailabilityWindow } from "@/lib/availability-editor";
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

  const [weeklyWindows, setWeeklyWindows] = useState<AvailabilityWindow[]>([]);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

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
    mutationFn: (windows: AvailabilityWindow[]) =>
      parkingResourcesApi.replaceAvailability(resource.id, windows.map(availabilityWindowInput)),
    onSuccess: () => {
      toast.success("Weekly availability schedule updated");
      void client.invalidateQueries({
        queryKey: queryKeys.availability.byResource(resource.id),
      });
      setShowScheduleDialog(false);
    },
    onError: (err) => setScheduleError(getApiErrorMessage(err)),
  });

  const handleOpenScheduleDialog = () => {
    if (!avQuery.data) return;
    setWeeklyWindows(avQuery.data.rules.filter((rule) => rule.isActive).map((rule) => availabilityWindowInput({
      dayOfWeek: rule.dayOfWeek, startLocalTime: localClockTime(rule.startLocalTime),
      endLocalTime: localClockTime(rule.endLocalTime), validFrom: rule.validFrom,
      validUntil: rule.validUntil ?? undefined,
    })));
    setScheduleError(null);
    setShowScheduleDialog(true);
  };

  const submitSchedule = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const windows = weeklyWindows.map((window, index) => ({ ...window,
      startLocalTime: String(fields.get(`start-${index}`) ?? window.startLocalTime),
      endLocalTime: String(fields.get(`end-${index}`) ?? window.endLocalTime),
      validFrom: String(fields.get(`from-${index}`) ?? window.validFrom),
      validUntil: String(fields.get(`until-${index}`) ?? window.validUntil ?? "") || undefined,
    }));
    const error = availabilityEditorError(windows);
    setScheduleError(error);
    if (!error) saveWeeklySchedule.mutate(windows);
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
                          {localClockTime(rule.startLocalTime)} – {localClockTime(rule.endLocalTime)}
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
                        disabled={!startDate || !endDate || endDate < startDate || addException.isPending}
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
      <Dialog open={showScheduleDialog} onOpenChange={(open) => { if (!saveWeeklySchedule.isPending) setShowScheduleDialog(open); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Weekly Hours</DialogTitle>
            <DialogDescription>
              Set active daily operating windows for {resource.displayName || resource.spotCode}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitSchedule} className="space-y-4">
            <fieldset disabled={saveWeeklySchedule.isPending} className="min-w-0 space-y-3">
              {DAY_LABELS.map((day, dayOfWeek) => (
                <section key={day} className="border-b pb-3 last:border-0" aria-label={`${day} windows`}>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-semibold">{day}</h4>
                    <Button type="button" variant="ghost" size="sm" aria-label={`Add ${day} window`}
                      disabled={weeklyWindows.length >= 50}
                      onClick={() => setWeeklyWindows((windows) => [...windows, { dayOfWeek, startLocalTime: "08:00", endLocalTime: "22:00",
                        validFrom: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" }) }])}>
                      <Plus className="size-4" /> Add window
                    </Button>
                  </div>
                  {!weeklyWindows.some((window) => window.dayOfWeek === dayOfWeek) ? <p className="text-xs text-muted-foreground">Closed</p> : null}
                  {weeklyWindows.map((window, index) => window.dayOfWeek === dayOfWeek ? (
                    <div key={index} className="mb-2 grid grid-cols-2 gap-2 border p-2 sm:grid-cols-[1fr_1fr_auto]">
                      <Input type="time" name={`start-${index}`} aria-label={`${day} window ${index + 1} opening`} required
                        value={window.startLocalTime} onChange={(e) => setWeeklyWindows((windows) => windows.map((item, i) => i === index ? { ...item, startLocalTime: e.target.value } : item))} />
                      <Input type="time" name={`end-${index}`} aria-label={`${day} window ${index + 1} closing`} required
                        value={window.endLocalTime} onChange={(e) => setWeeklyWindows((windows) => windows.map((item, i) => i === index ? { ...item, endLocalTime: e.target.value } : item))} />
                      <Button type="button" variant="ghost" size="icon" className="order-last col-span-2 justify-self-end text-red-600 sm:order-none sm:col-span-1" aria-label={`Remove ${day} window ${index + 1}`} title="Remove window"
                        onClick={() => setWeeklyWindows((windows) => windows.filter((_, i) => i !== index))}><Trash2 className="size-4" /></Button>
                      <label className="text-xs text-muted-foreground">From
                        <Input type="date" name={`from-${index}`} aria-label={`${day} window ${index + 1} valid from`} required value={window.validFrom}
                          onChange={(e) => setWeeklyWindows((windows) => windows.map((item, i) => i === index ? { ...item, validFrom: e.target.value } : item))} />
                      </label>
                      <label className="text-xs text-muted-foreground">Until (optional)
                        <Input type="date" name={`until-${index}`} aria-label={`${day} window ${index + 1} valid until`} value={window.validUntil ?? ""}
                          onChange={(e) => setWeeklyWindows((windows) => windows.map((item, i) => i === index ? { ...item, validUntil: e.target.value || undefined } : item))} />
                      </label>
                    </div>
                  ) : null)}
                </section>
              ))}
            </fieldset>
            {scheduleError ? <p role="alert" className="text-sm text-red-700">{scheduleError}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={saveWeeklySchedule.isPending} onClick={() => setShowScheduleDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={saveWeeklySchedule.isPending} className="bg-[#064E3B] text-white hover:bg-[#064E3B]/90">
                {saveWeeklySchedule.isPending ? <Loader2 className="mr-1 size-3.5 animate-spin" /> : null} Save Schedule
              </Button>
            </DialogFooter>
          </form>
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
