"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Edit2,
  Loader2,
  PauseCircle,
  PlayCircle,
  Tag,
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
import { listingsApi } from "@/lib/api/listings-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { queryKeys } from "@/lib/query-keys";
import type { ParkingListingDto } from "@/lib/api/marketplace-types";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  PAUSED: "bg-amber-100 text-amber-800",
  DRAFT: "bg-slate-100 text-slate-600",
  SUSPENDED: "bg-red-100 text-red-700",
  ENDED: "bg-slate-100 text-slate-400",
};

function paisaToTaka(paisa: string): string {
  return (Number(paisa) / 100).toFixed(2);
}

function EditPriceForm({
  listing,
  onClose,
}: {
  listing: ParkingListingDto;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [price, setPrice] = useState(paisaToTaka(listing.pricePerHourPaisa));

  const update = useMutation({
    mutationFn: () =>
      listingsApi.update(listing.id, {
        pricePerHourPaisa: String(Math.round(parseFloat(price) * 100)),
      }),
    onSuccess: () => {
      toast.success("Price updated");
      void client.invalidateQueries({ queryKey: queryKeys.listings.root });
      onClose();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
      <Tag className="size-4 shrink-0 text-emerald-700" />
      <span className="text-xs font-semibold text-slate-700">৳ per hour</span>
      <Input
        type="number"
        min="0"
        step="0.01"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="h-8 w-24 text-sm"
      />
      <Button
        size="sm"
        disabled={update.isPending}
        onClick={() => update.mutate()}
      >
        {update.isPending && <Loader2 className="size-3 animate-spin" />}
        Save
      </Button>
      <Button size="sm" variant="outline" onClick={onClose}>
        Cancel
      </Button>
    </div>
  );
}

function ListingCard({
  listing,
  canManage,
  canPrice,
  resourceIds,
}: {
  listing: ParkingListingDto;
  canManage: boolean;
  canPrice: boolean;
  resourceIds: string[]; // empty = whole property
}) {
  const client = useQueryClient();
  const [editingPrice, setEditingPrice] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"activate" | "pause" | null>(null);

  const mutate = useMutation({
    mutationFn: (action: "activate" | "pause") =>
      action === "activate"
        ? listingsApi.activate(listing.id)
        : listingsApi.pause(listing.id),
    onSuccess: (_, action) => {
      toast.success(action === "activate" ? "Listing activated" : "Listing paused");
      void client.invalidateQueries({ queryKey: queryKeys.listings.root });
      setConfirmAction(null);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err));
      setConfirmAction(null);
    },
  });

  // Check resource scope — empty resourceIds means whole property (allowed)
  const inScope =
    resourceIds.length === 0 ||
    (listing.parkingSpotId
      ? resourceIds.includes(listing.parkingSpotId)
      : true);

  if (!inScope) return null;

  const statusColor = STATUS_COLORS[listing.status] ?? "bg-slate-100 text-slate-600";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900 text-sm">{listing.title}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            ৳{paisaToTaka(listing.pricePerHourPaisa)}/hr ·{" "}
            {listing.allowedVehicleTypes.join(", ")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusColor}`}
          >
            {listing.status}
          </span>
          {canManage && listing.status === "ACTIVE" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => setConfirmAction("pause")}
            >
              <PauseCircle className="size-3" />
              Pause
            </Button>
          )}
          {canManage && listing.status === "PAUSED" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              onClick={() => setConfirmAction("activate")}
            >
              <PlayCircle className="size-3" />
              Activate
            </Button>
          )}
          {canPrice && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => setEditingPrice((v) => !v)}
            >
              <Edit2 className="size-3" />
              Price
            </Button>
          )}
        </div>
      </div>

      {editingPrice && (
        <EditPriceForm listing={listing} onClose={() => setEditingPrice(false)} />
      )}

      {/* Confirm dialog */}
      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "activate" ? "Activate" : "Pause"} this listing?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "activate"
                ? `"${listing.title}" will become visible to drivers and accept new bookings.`
                : `"${listing.title}" will stop accepting new bookings but existing ones remain unaffected.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={mutate.isPending}
              onClick={() => confirmAction && mutate.mutate(confirmAction)}
            >
              {mutate.isPending && <Loader2 className="size-4 animate-spin" />}
              {confirmAction === "activate" ? "Activate" : "Pause"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function ManagerListingsSection({
  propertyId,
  resourceIds,
  canManage,
  canPrice,
}: {
  propertyId: string;
  resourceIds: string[];
  canManage: boolean;
  canPrice: boolean;
}) {
  const query = useQuery({
    queryKey: queryKeys.listings.all({ propertyId }),
    queryFn: listingsApi.list,
  });

  if (query.isPending) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="size-4 animate-spin" />
        Loading listings…
      </div>
    );
  }

  if (query.isError) {
    return (
      <p className="text-sm text-red-700">{getApiErrorMessage(query.error)}</p>
    );
  }

  // Filter listings to those belonging to resources in scope
  // (whole-property delegation = resourceIds.length === 0 = show all)
  const listings = (query.data ?? []).filter(
    (l) =>
      resourceIds.length === 0 ||
      resourceIds.includes(l.parkingSpotId),
  );

  if (listings.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No listings found for this Property in your delegated scope.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <CheckCircle2 className="size-3.5 text-emerald-600" />
        {listings.length} listing{listings.length !== 1 ? "s" : ""} in scope
        {canManage && " · You can activate and pause listings"}
        {canPrice && " · You can edit prices"}
      </div>
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          canManage={canManage}
          canPrice={canPrice}
          resourceIds={resourceIds}
        />
      ))}
    </div>
  );
}
