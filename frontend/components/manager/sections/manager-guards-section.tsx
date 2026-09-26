"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Loader2,
  Plus,
  ShieldCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { guardApi } from "@/lib/api/guard-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

const STATUS_COLORS: Record<string, string> = {
  PENDING_ACCEPTANCE: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  ENDED: "bg-slate-100 text-slate-400",
  CANCELLED: "bg-slate-100 text-slate-400",
};

function AssignShiftForm({
  propertyId,
  membershipId,
  onClose,
}: {
  propertyId: string;
  membershipId: string;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [shiftStart, setShiftStart] = useState("");
  const [shiftEnd, setShiftEnd] = useState("");

  const assign = useMutation({
    mutationFn: () =>
      guardApi.createAssignment(propertyId, {
        guardMembershipId: membershipId,
        shiftStart: new Date(shiftStart).toISOString(),
        shiftEnd: new Date(shiftEnd).toISOString(),
      }),
    onSuccess: () => {
      toast.success("Guard shift assigned");
      void client.invalidateQueries({
        queryKey: queryKeys.propertyGuards.byProperty(propertyId),
      });
      onClose();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold text-slate-700">Assign shift</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500">Shift start</label>
          <Input
            type="datetime-local"
            value={shiftStart}
            onChange={(e) => setShiftStart(e.target.value)}
            className="mt-1 h-8 text-xs"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500">Shift end</label>
          <Input
            type="datetime-local"
            value={shiftEnd}
            onChange={(e) => setShiftEnd(e.target.value)}
            className="mt-1 h-8 text-xs"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={!shiftStart || !shiftEnd || assign.isPending}
          onClick={() => assign.mutate()}
        >
          {assign.isPending && <Loader2 className="size-3 animate-spin" />}
          Assign shift
        </Button>
        <Button size="sm" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function ManagerGuardsSection({
  propertyId,
  canAdd,
  canAssign,
}: {
  propertyId: string;
  canAdd: boolean;
  canAssign: boolean;
}) {
  const client = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: queryKeys.propertyGuards.byProperty(propertyId),
    queryFn: () => guardApi.propertyMemberships(propertyId),
  });

  const invite = useMutation({
    mutationFn: () => guardApi.invite(propertyId, identifier.trim()),
    onSuccess: () => {
      toast.success("Guard invitation sent");
      void client.invalidateQueries({
        queryKey: queryKeys.propertyGuards.byProperty(propertyId),
      });
      setShowInvite(false);
      setIdentifier("");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  if (query.isPending) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="size-4 animate-spin" />
        Loading guards…
      </div>
    );
  }

  if (query.isError) {
    return (
      <p className="text-sm text-red-700">{getApiErrorMessage(query.error)}</p>
    );
  }

  const memberships = query.data ?? [];
  const active = memberships.filter((m) => m.status === "ACTIVE");
  const pending = memberships.filter((m) => m.status === "PENDING_ACCEPTANCE");

  return (
    <div className="space-y-4">
      {/* Invite form */}
      {canAdd && (
        <div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowInvite((v) => !v)}
          >
            <Plus className="size-3.5" />
            Invite Guard
          </Button>
          {showInvite && (
            <div className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex-1 min-w-48">
                <label className="text-xs font-semibold text-slate-700">
                  Email or phone
                </label>
                <Input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="guard@email.com or +8801XXXXXXXXX"
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <Button
                size="sm"
                disabled={!identifier.trim() || invite.isPending}
                onClick={() => invite.mutate()}
              >
                {invite.isPending && <Loader2 className="size-3 animate-spin" />}
                Send invite
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowInvite(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Pending guards */}
      {pending.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-700">
            Pending acceptance ({pending.length})
          </p>
          <div className="space-y-2">
            {pending.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Clock className="size-4 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {m.guard?.fullName ?? "Guard"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Invited {formatDateTime(m.invitedAt)}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active guards */}
      {active.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
            Active Guards ({active.length})
          </p>
          <div className="space-y-3">
            {active.map((m) => (
              <div
                key={m.id}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-emerald-50">
                      <ShieldCheck className="size-4 text-emerald-700" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {m.guard?.fullName ?? "Guard"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Joined{" "}
                        {m.joinedAt ? formatDateTime(m.joinedAt) : "—"}
                      </p>
                    </div>
                  </div>
                  {canAssign && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() =>
                        setAssigningId(assigningId === m.id ? null : m.id)
                      }
                    >
                      <Clock className="size-3.5" />
                      {assigningId === m.id ? "Cancel" : "Assign shift"}
                    </Button>
                  )}
                </div>

                {assigningId === m.id && canAssign && (
                  <AssignShiftForm
                    propertyId={propertyId}
                    membershipId={m.id}
                    onClose={() => setAssigningId(null)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {memberships.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center">
          <UserX className="size-8 text-slate-300" />
          <p className="text-sm text-slate-500">No guards in this Property.</p>
          {canAdd && (
            <p className="text-xs text-slate-400">
              Use the &ldquo;Invite Guard&rdquo; button above to add one.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
