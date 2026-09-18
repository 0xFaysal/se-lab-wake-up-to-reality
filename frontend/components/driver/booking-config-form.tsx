"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  Car,
  Plus,
  ShieldCheck,
  Info,
  Loader2,
  ArrowRight,
  Sparkles,
  MapPin,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  bookingConfigSchema,
  type BookingConfigFormValues,
} from "@/lib/validations/booking";
import { vehicleApi } from "@/lib/api/vehicle-api";
import { queryKeys } from "@/lib/query-keys";
import { formatBDTFromPaisa, toUtcFromBangladeshLocal, vehicleLabels } from "@/lib/formatters";
import type { PublicPropertyDetailDto, PublicPropertyOfferDto } from "@/lib/api/marketplace-types";
import type { VehicleType } from "@/lib/api/api-types";
import { cn } from "@/lib/utils";

interface BookingConfigFormProps {
  property: PublicPropertyDetailDto;
  initialValues: {
    date: string;
    checkInTime: string;
    checkOutTime: string;
    vehicleType?: VehicleType;
  };
}

export function BookingConfigForm({ property, initialValues }: BookingConfigFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState("");

  const offers = property.offers;
  const defaultOffer = offers[0];

  // Fetch saved vehicles
  const vehiclesQuery = useQuery({
    queryKey: queryKeys.vehicles.all,
    queryFn: vehicleApi.list,
  });

  const vehicles = vehiclesQuery.data ?? [];

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingConfigFormValues>({
    resolver: zodResolver(bookingConfigSchema),
    defaultValues: {
      date: initialValues.date,
      checkInTime: initialValues.checkInTime,
      checkOutTime: initialValues.checkOutTime,
      listingId: defaultOffer?.listingId ?? "",
      vehicleId: vehicles[0]?.id ?? "",
      isNewVehicle: false,
      newRegistrationNumber: "",
      newVehicleType: (initialValues.vehicleType as "SEDAN" | "SUV" | "MOTORCYCLE" | "MICROBUS") ?? "SEDAN",
      newBrand: "",
      newModel: "",
      newColor: "",
    },
  });

  const watchedDate = useWatch({ control, name: "date" });
  const watchedCheckIn = useWatch({ control, name: "checkInTime" });
  const watchedCheckOut = useWatch({ control, name: "checkOutTime" });
  const watchedListingId = useWatch({ control, name: "listingId" });
  const watchedVehicleId = useWatch({ control, name: "vehicleId" });
  const watchedIsNew = useWatch({ control, name: "isNewVehicle" });

  const selectedOffer = useMemo(
    () => offers.find((o) => o.listingId === watchedListingId) ?? defaultOffer,
    [offers, watchedListingId, defaultOffer]
  );

  // Dynamic Duration & Price Calculation
  const calculation = useMemo(() => {
    if (!watchedCheckIn || !watchedCheckOut) {
      return { hours: 1, baseAmountPaisa: 0, platformFeePaisa: 0, totalPaisa: 0 };
    }

    const [inH = 9, inM = 0] = watchedCheckIn.split(":").map(Number);
    const [outH = 10, outM = 0] = watchedCheckOut.split(":").map(Number);

    const startMinutes = inH * 60 + inM;
    const endMinutes = outH * 60 + outM;
    const diffMinutes = Math.max(15, endMinutes - startMinutes);
    const hours = Math.max(0.5, Math.ceil((diffMinutes / 60) * 2) / 2); // Round to nearest 0.5 hr

    const ratePaisa = Number(selectedOffer?.pricePerHourPaisa ?? 6000);
    const basePaisa = Math.round(hours * ratePaisa);
    const platformFeePaisa = Math.round(basePaisa * 0.05); // 5% platform fee
    const totalPaisa = basePaisa + platformFeePaisa;

    return {
      hours,
      baseAmountPaisa: basePaisa,
      platformFeePaisa,
      totalPaisa,
    };
  }, [watchedCheckIn, watchedCheckOut, selectedOffer]);

  // Vehicle mutation for new vehicle inline
  const createVehicleMutation = useMutation({
    mutationFn: vehicleApi.create,
    onSuccess: (newVehicle) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
      return newVehicle;
    },
  });

  async function onSubmit(data: BookingConfigFormValues) {
    setSubmitError("");
    try {
      let finalVehicleId = data.vehicleId;
      let finalVehicleType = data.newVehicleType;

      if (data.isNewVehicle) {
        const created = await createVehicleMutation.mutateAsync({
          vehicleType: data.newVehicleType,
          registrationNumber: data.newRegistrationNumber?.trim() || "",
          brand: data.newBrand?.trim() || "Private",
          model: data.newModel?.trim() || "Vehicle",
          color: data.newColor?.trim() || "White",
        });
        finalVehicleId = created.id;
        finalVehicleType = created.vehicleType;
      } else {
        const found = vehicles.find((v) => v.id === finalVehicleId);
        if (found) {
          finalVehicleType = found.vehicleType;
        }
      }

      const startAtUtc = toUtcFromBangladeshLocal(data.date, data.checkInTime);
      const endAtUtc = toUtcFromBangladeshLocal(data.date, data.checkOutTime);

      const checkoutQuery = new URLSearchParams({
        startAt: startAtUtc,
        endAt: endAtUtc,
        vehicleType: finalVehicleType,
        vehicleId: finalVehicleId,
        listingId: data.listingId,
      });

      // Proceed to the 5-minute Hold & Checkout page
      router.push(`/parking/${property.id}?${checkoutQuery.toString()}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to prepare booking. Please try again.";
      setSubmitError(message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {submitError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700"
        >
          {submitError}
        </div>
      )}

      {/* 1. Schedule & Duration Card */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
          <Calendar className="size-4 text-[#064E3B]" />
          <h2 className="text-base font-bold text-foreground font-heading">
            1. Select Parking Date & Time
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Date Picker */}
          <div className="space-y-1.5">
            <Label htmlFor="date" className="text-xs font-bold text-foreground uppercase tracking-wider font-heading">
              Booking Date
            </Label>
            <Input
              id="date"
              type="date"
              className="h-10 text-sm rounded-lg bg-[#F9FAFB] focus:bg-white border-[#E5E7EB] focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
              {...register("date")}
            />
            {errors.date && (
              <p className="text-xs text-destructive font-medium">{errors.date.message}</p>
            )}
          </div>

          {/* Check-In Time */}
          <div className="space-y-1.5">
            <Label htmlFor="checkInTime" className="text-xs font-bold text-foreground uppercase tracking-wider font-heading">
              Arrival Time
            </Label>
            <div className="relative">
              <Input
                id="checkInTime"
                type="time"
                className="h-10 text-sm rounded-lg bg-[#F9FAFB] focus:bg-white border-[#E5E7EB] focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
                {...register("checkInTime")}
              />
              <Clock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            </div>
            {errors.checkInTime && (
              <p className="text-xs text-destructive font-medium">{errors.checkInTime.message}</p>
            )}
          </div>

          {/* Check-Out Time */}
          <div className="space-y-1.5">
            <Label htmlFor="checkOutTime" className="text-xs font-bold text-foreground uppercase tracking-wider font-heading">
              Expected Departure
            </Label>
            <div className="relative">
              <Input
                id="checkOutTime"
                type="time"
                className="h-10 text-sm rounded-lg bg-[#F9FAFB] focus:bg-white border-[#E5E7EB] focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
                {...register("checkOutTime")}
              />
              <Clock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            </div>
            {errors.checkOutTime && (
              <p className="text-xs text-destructive font-medium">{errors.checkOutTime.message}</p>
            )}
          </div>
        </div>

        {/* Duration badge */}
        <div className="flex items-center justify-between rounded-lg bg-[#064E3B]/6 border border-[#064E3B]/15 px-4 py-2.5 text-xs text-[#064E3B]">
          <span className="font-semibold">Estimated Parking Duration:</span>
          <span className="font-extrabold text-sm">{calculation.hours} hour{calculation.hours === 1 ? "" : "s"}</span>
        </div>
      </div>

      {/* 2. Choose Space Offer Card */}
      {offers.length > 1 && (
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
            <Sparkles className="size-4 text-[#064E3B]" />
            <h2 className="text-base font-bold text-foreground font-heading">
              2. Choose Space Offer
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {offers.map((offer) => {
              const isSelected = watchedListingId === offer.listingId;
              return (
                <div
                  key={offer.listingId}
                  onClick={() => setValue("listingId", offer.listingId)}
                  className={cn(
                    "cursor-pointer rounded-xl border p-4 transition-all",
                    isSelected
                      ? "border-[#064E3B] bg-[#064E3B]/5 ring-2 ring-[#064E3B]/20"
                      : "border-[#E5E7EB] bg-white hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-foreground font-heading">{offer.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {offer.resourceType === "SHARED_POOL" ? "Shared parking bay" : "Dedicated spot"}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#064E3B]">
                      {formatBDTFromPaisa(offer.pricePerHourPaisa)}/hr
                    </span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {offer.isCovered && (
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        Covered
                      </span>
                    )}
                    {offer.hasGuard && (
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                        Guard
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Select or Add Vehicle Card */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div className="flex items-center gap-2">
            <Car className="size-4 text-[#064E3B]" />
            <h2 className="text-base font-bold text-foreground font-heading">
              {offers.length > 1 ? "3." : "2."} Vehicle Details
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setValue("isNewVehicle", !watchedIsNew)}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#064E3B] hover:underline cursor-pointer"
          >
            {watchedIsNew ? "Select from saved vehicles" : "+ Add new license plate"}
          </button>
        </div>

        {!watchedIsNew ? (
          /* Saved Vehicles Dropdown */
          <div className="space-y-2">
            <Label htmlFor="vehicleId" className="text-xs font-bold text-foreground uppercase tracking-wider font-heading">
              Select Saved Vehicle
            </Label>

            {vehiclesQuery.isPending ? (
              <div className="flex h-10 items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Loading your registered vehicles…
              </div>
            ) : vehicles.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#E5E7EB] bg-[#f9f9ff] p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  No saved vehicles found. Add your license plate to proceed.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setValue("isNewVehicle", true)}
                  className="mt-2 rounded-lg text-xs"
                >
                  <Plus className="size-3.5 mr-1" />
                  Add License Plate
                </Button>
              </div>
            ) : (
              <select
                id="vehicleId"
                className="h-11 w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm focus:border-[#064E3B] focus:bg-white focus:ring-1 focus:ring-[#064E3B]"
                {...register("vehicleId")}
              >
                <option value="">Select a registered vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNumber} — {v.brand} {v.model} ({vehicleLabels[v.vehicleType]})
                  </option>
                ))}
              </select>
            )}

            {errors.vehicleId && (
              <p className="text-xs text-destructive font-medium">{errors.vehicleId.message}</p>
            )}
          </div>
        ) : (
          /* Inline New Vehicle Form */
          <div className="space-y-4 rounded-xl border border-[#064E3B]/20 bg-[#064E3B]/4 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#064E3B] uppercase tracking-wider font-heading">
                New License Plate Registration
              </span>
              <span className="text-[11px] text-muted-foreground">Will be saved to your account</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="newRegistrationNumber" className="text-xs font-bold text-foreground">
                  License Plate / Registration No. *
                </Label>
                <Input
                  id="newRegistrationNumber"
                  placeholder="e.g. Dhaka Metro-GA 11-2233"
                  className="h-10 text-sm rounded-lg bg-white border-[#E5E7EB] focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
                  {...register("newRegistrationNumber")}
                />
                {errors.newRegistrationNumber && (
                  <p className="text-xs text-destructive font-medium">
                    {errors.newRegistrationNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newVehicleType" className="text-xs font-bold text-foreground">
                  Vehicle Type
                </Label>
                <select
                  id="newVehicleType"
                  className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
                  {...register("newVehicleType")}
                >
                  <option value="SEDAN">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="MOTORCYCLE">Motorcycle</option>
                  <option value="MICROBUS">Microbus</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newBrand" className="text-xs font-medium text-muted-foreground">
                  Make / Brand (Optional)
                </Label>
                <Input
                  id="newBrand"
                  placeholder="e.g. Toyota"
                  className="h-10 text-sm rounded-lg bg-white border-[#E5E7EB]"
                  {...register("newBrand")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newModel" className="text-xs font-medium text-muted-foreground">
                  Model & Color (Optional)
                </Label>
                <Input
                  id="newModel"
                  placeholder="e.g. Corolla, Silver"
                  className="h-10 text-sm rounded-lg bg-white border-[#E5E7EB]"
                  {...register("newModel")}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Dynamic Price Estimation Block */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-[#064E3B]" />
            <h2 className="text-base font-bold text-foreground font-heading">
              Estimated Price Breakdown
            </h2>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {calculation.hours} hr booking
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>
              Base Hourly Rate ({calculation.hours} hrs × {formatBDTFromPaisa(selectedOffer?.pricePerHourPaisa ?? 6000)}/hr)
            </span>
            <span className="font-semibold text-foreground">
              {formatBDTFromPaisa(calculation.baseAmountPaisa)}
            </span>
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <span>Platform Service Fee (5%)</span>
            <span className="font-semibold text-foreground">
              {formatBDTFromPaisa(calculation.platformFeePaisa)}
            </span>
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <span>Security Deposit</span>
            <span className="font-semibold text-emerald-700">৳0 (Waived)</span>
          </div>

          <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-3 text-sm">
            <span className="font-bold text-foreground font-heading">
              Total Estimated Charge
            </span>
            <span className="text-xl font-extrabold text-[#064E3B] font-heading">
              {formatBDTFromPaisa(calculation.totalPaisa)}
            </span>
          </div>
        </div>

        {/* 15-min Traffic Grace Period Notice */}
        <div className="flex items-start gap-2.5 rounded-lg bg-amber-50/80 border border-amber-200/80 p-3 text-xs text-amber-900">
          <Info className="size-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>15-Minute Dhaka Traffic Grace Period:</strong> You will not be charged overtime if you exit within 15 minutes after your scheduled departure time.
          </p>
        </div>
      </div>

      {/* 5. Deep Emerald CTA Button */}
      <Button
        type="submit"
        disabled={isSubmitting || createVehicleMutation.isPending}
        className="w-full h-12 text-sm font-bold bg-[#064E3B] text-white hover:bg-[#003527] rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
      >
        {isSubmitting || createVehicleMutation.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Preparing 5-Minute Hold Checkout…
          </>
        ) : (
          <>
            Proceed to Checkout
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}
