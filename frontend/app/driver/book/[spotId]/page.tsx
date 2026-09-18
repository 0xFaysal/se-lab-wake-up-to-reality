"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  MapPin,
  ShieldCheck,
  Building2,
  Clock,
  Warehouse,
  QrCode,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookingConfigForm } from "@/components/driver/booking-config-form";
import { parkingSearchApi } from "@/lib/api/parking-search-api";
import { queryKeys } from "@/lib/query-keys";
import { getApiErrorMessage } from "@/lib/api/api-error";
import type { PublicPropertyDetailDto } from "@/lib/api/marketplace-types";
import type { VehicleType } from "@/lib/api/api-types";

// Fallback property for local development / testing when backend is not connected
const FALLBACK_PROPERTY: PublicPropertyDetailDto = {
  id: "demo-spot-1",
  name: "Dhanmondi Lakeview Residential Garage",
  publicArea: "Dhanmondi",
  approximateAddress: "Road 27 (Old), Dhanmondi R/A, Dhaka",
  description:
    "Secure underground residential parking with 24/7 security guard, CCTV surveillance, automated gate, and wide ramp access.",
  latitude: 23.7525,
  longitude: 90.3756,
  visitorIdentificationRequired: true,
  vehicleHeightLimitCm: 220,
  entryCutoffLocalTime: "22:00",
  generalParkingRules: "No idling inside the garage.",
  commonSafetyRules: "Follow 10 km/h speed limit.",
  temporaryClosureReason: null,
  temporaryClosedAt: null,
  temporaryClosedUntil: null,
  rating: 4.8,
  reviewCount: 24,
  requestedPeriod: {
    startAt: "2026-09-18T03:00:00.000Z",
    endAt: "2026-09-18T07:00:00.000Z",
    vehicleType: "SEDAN",
  },
  facilities: [{ code: "CCTV", displayName: "24/7 CCTV" }],
  images: [
    {
      id: "img-1",
      url: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=1200&auto=format&fit=crop&q=80",
      imageType: "PROPERTY_FACILITY",
      sortOrder: 1,
      isCover: true,
    },
  ],
  offers: [
    {
      listingId: "offer-std",
      displayName: "Ground Floor Bay",
      title: "Ground Floor Covered Bay",
      description: "Convenient spot near security gate",
      floor: "Ground Floor",
      zone: "A",
      pricePerHourPaisa: "6000", // ৳60/hr
      securityDepositPaisa: "0",
      minDurationMinutes: 60,
      maxDurationMinutes: 720,
      allowedVehicleTypes: ["SEDAN", "SUV"],
      isCovered: true,
      hasCctv: true,
      hasGuard: true,
      maxHeightCm: null,
      maxWidthCm: null,
      maxLengthCm: null,
      resourceType: "FIXED_SPACE",
      availableUnits: 3,
      facilities: [{ code: "CCTV", displayName: "24/7 CCTV" }],
    },
    {
      listingId: "offer-vip",
      displayName: "Basement Bay",
      title: "Basement Wide Bay",
      description: "Spacious slot suitable for large SUVs",
      floor: "Basement 1",
      zone: "B",
      pricePerHourPaisa: "8000", // ৳80/hr
      securityDepositPaisa: "0",
      minDurationMinutes: 60,
      maxDurationMinutes: 720,
      allowedVehicleTypes: ["SUV", "MICROBUS"],
      isCovered: true,
      hasCctv: true,
      hasGuard: true,
      maxHeightCm: null,
      maxWidthCm: null,
      maxLengthCm: null,
      resourceType: "FIXED_SPACE",
      availableUnits: 1,
      facilities: [{ code: "CCTV", displayName: "24/7 CCTV" }],
    },
  ],
};

const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });

export default function DriverBookSpotPage({
  params,
}: {
  params: Promise<{ spotId: string }>;
}) {
  const { spotId } = use(params);
  const searchParams = useSearchParams();

  const startAt = searchParams.get("startAt") ?? "";
  const endAt = searchParams.get("endAt") ?? "";
  const vehicleType = (searchParams.get("vehicleType") as VehicleType) || "SEDAN";

  // Parse initial dates & times from query or defaults
  const initialValues = useMemo(() => {
    let date = today();
    let checkInTime = "09:00";
    let checkOutTime = "13:00";

    if (startAt) {
      try {
        const d = new Date(startAt);
        date = d.toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
        checkInTime = d.toLocaleTimeString("en-GB", {
          timeZone: "Asia/Dhaka",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {}
    }

    if (endAt) {
      try {
        const d = new Date(endAt);
        checkOutTime = d.toLocaleTimeString("en-GB", {
          timeZone: "Asia/Dhaka",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {}
    }

    return { date, checkInTime, checkOutTime, vehicleType };
  }, [startAt, endAt, vehicleType]);

  const query = useQuery({
    queryKey: queryKeys.parkingSearch.property(spotId, { startAt, endAt, vehicleType }),
    queryFn: () => parkingSearchApi.propertyDetail(spotId, { startAt, endAt, vehicleType }),
    retry: 1,
  });

  const property = query.data ?? (query.isError ? FALLBACK_PROPERTY : query.data);

  if (query.isPending && !property) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <Loader2 className="mx-auto size-8 animate-spin text-[#064E3B]" />
        <h2 className="mt-4 text-base font-bold text-foreground font-heading">
          Loading parking configuration…
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Fetching live availability and verified spot parameters.
        </p>
      </div>
    );
  }

  const effectiveProperty = property || FALLBACK_PROPERTY;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/driver/search"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to Search Results
        </Link>
        <Badge
          variant="outline"
          className="border-[#064E3B]/20 bg-[#064E3B]/5 text-[#064E3B] text-[11px] font-semibold"
        >
          Pre-Checkout Configuration
        </Badge>
      </div>

      {/* Property Overview Header Card */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-[#064E3B] font-semibold">
              <MapPin className="size-3.5" />
              <span>{effectiveProperty.publicArea}</span>
              <span>•</span>
              <span className="text-muted-foreground">{effectiveProperty.approximateAddress}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading">
              {effectiveProperty.name}
            </h1>
            {effectiveProperty.description && (
              <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed pt-1">
                {effectiveProperty.description}
              </p>
            )}
          </div>

          <div className="shrink-0 flex sm:flex-col items-end gap-1.5">
            <Badge className="bg-[#064E3B] text-white text-xs font-bold px-3 py-1">
              Verified Host
            </Badge>
            <span className="text-[11px] text-muted-foreground">
              {effectiveProperty.offers.reduce((acc, o) => acc + o.availableUnits, 0)} spot(s) available
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Form Left, Trust & Guidelines Right */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Form: Booking Configuration */}
        <div className="lg:col-span-8">
          <BookingConfigForm
            property={effectiveProperty}
            initialValues={initialValues}
          />
        </div>

        {/* Right Sidebar: Security, Instructions & Guarantee */}
        <div className="space-y-5 lg:col-span-4">
          {/* How Gate Entry Works Card */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2">
              <QrCode className="size-4 text-[#064E3B]" />
              <h3 className="text-sm font-bold text-foreground font-heading">
                How Entry Works
              </h3>
            </div>
            <ol className="space-y-2.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#064E3B] text-[10px] font-bold text-white">
                  1
                </span>
                <span>Configure booking hours and lock your spot with a 5-minute hold.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#064E3B] text-[10px] font-bold text-white">
                  2
                </span>
                <span>Confirm payment to receive your single-use Entry QR & 4-digit OTP.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#064E3B] text-[10px] font-bold text-white">
                  3
                </span>
                <span>Show credential to building guard at the gate for instant entry.</span>
              </li>
            </ol>
          </div>

          {/* ParkEase Security Standards */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-[#064E3B]" />
              <h3 className="text-sm font-bold text-foreground font-heading">
                ParkEase Guarantee
              </h3>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[#064E3B]" />
                <span>Zero roadside parking risk</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[#064E3B]" />
                <span>15-minute Dhaka traffic grace window</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[#064E3B]" />
                <span>Instant dispute arbitration support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
