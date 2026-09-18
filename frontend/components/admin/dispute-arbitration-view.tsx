"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  User,
  Building2,
  Clock,
  Car,
  FileText,
  DollarSign,
  CheckCircle2,
  XCircle,
  Split,
  Eye,
  Loader2,
  ArrowRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  disputeArbitrationSchema,
  type DisputeArbitrationFormValues,
} from "@/lib/validations/admin";
import { cn } from "@/lib/utils";
import { formatBDTFromPaisa } from "@/lib/formatters";

interface DisputeCase {
  id: string;
  bookingCode: string;
  amountPaisa: number;
  category: string;
  createdAt: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED";
  driver: {
    fullName: string;
    phone: string;
    vehiclePlate: string;
    vehicleModel: string;
    rating: number;
    complaintText: string;
    evidencePhotos: string[];
    requestedRemedy: string;
  };
  owner: {
    fullName: string;
    propertyName: string;
    address: string;
    guardOnDuty: string;
    gateEntryRecorded: string;
    counterStatement: string;
    evidencePhotos: string[];
    isVerified: boolean;
  };
}

const SAMPLE_DISPUTES: DisputeCase[] = [
  {
    id: "DSP-8821",
    bookingCode: "BK-90214",
    amountPaisa: 24000, // ৳240
    category: "SPOT_OCCUPIED_ON_ARRIVAL",
    createdAt: "2026-09-18T04:15:00Z",
    status: "OPEN",
    driver: {
      fullName: "Tanvir Hasan",
      phone: "+880 1712-345678",
      vehiclePlate: "Dhaka Metro-GA 11-2233",
      vehicleModel: "Toyota Corolla (White)",
      rating: 4.9,
      complaintText:
        "I arrived at the Dhanmondi residential garage at 09:10 AM as booked. Another private vehicle was already parked in the assigned slot A-3. The security guard was unhelpful and stated he had no orders to move the resident car. I waited 20 minutes and had to park elsewhere.",
      evidencePhotos: [
        "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80",
      ],
      requestedRemedy: "Full refund of ৳240 booking fee.",
    },
    owner: {
      fullName: "Mohammad Rahim Uddin",
      propertyName: "Dhanmondi Lakeview Residential Garage",
      address: "Road 27 (Old), Dhanmondi R/A, Dhaka",
      guardOnDuty: "Abdur Rashid (Morning Shift)",
      gateEntryRecorded: "09:08 AM Entry Scan",
      counterStatement:
        "The driver entered the premises but parked outside the reserved slot bay. The guard instructed him to wait 2 minutes while the previous owner cleared the bay, but the driver became impatient and left abruptly. Our bay was fully clear by 09:14 AM.",
      evidencePhotos: [
        "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80",
      ],
      isVerified: true,
    },
  },
  {
    id: "DSP-8819",
    bookingCode: "BK-89402",
    amountPaisa: 32000, // ৳320
    category: "GUARD_ENTRY_REFUSAL",
    createdAt: "2026-09-17T14:30:00Z",
    status: "UNDER_REVIEW",
    driver: {
      fullName: "Ayesha Siddiqua",
      phone: "+880 1819-987654",
      vehiclePlate: "Dhaka Metro-KHA 44-5566",
      vehicleModel: "Honda Vezel (Blue)",
      rating: 5.0,
      complaintText:
        "Presented my valid ParkEase 4-digit OTP at the gate. The security guard claimed the system was down and refused to open the gate bar, demanding ৳100 cash baksheesh. I refused and left.",
      evidencePhotos: [
        "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=80",
      ],
      requestedRemedy: "Full ৳320 refund + compensation.",
    },
    owner: {
      fullName: "Farzana Chowdhury",
      propertyName: "Gulshan 2 Commercial Parking Tower",
      address: "Road 103, Gulshan 2, Dhaka",
      guardOnDuty: "Nurul Islam (Day Shift)",
      gateEntryRecorded: "No system check-in",
      counterStatement:
        "The security guard's device had a temporary Wi-Fi reconnection issue for 5 minutes. No extortion was solicited. The property management sincerely apologizes for the guard misunderstanding.",
      evidencePhotos: [
        "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800&auto=format&fit=crop&q=80",
      ],
      isVerified: true,
    },
  },
];

export function DisputeArbitrationView() {
  const [selectedCaseId, setSelectedCaseId] = useState<string>("DSP-8821");
  const [resolutionResult, setResolutionResult] = useState<string | null>(null);

  const selectedCase =
    SAMPLE_DISPUTES.find((d) => d.id === selectedCaseId) || SAMPLE_DISPUTES[0]!;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DisputeArbitrationFormValues>({
    resolver: zodResolver(disputeArbitrationSchema),
    defaultValues: {
      action: "REFUND_DRIVER",
      adminNotes: "",
      splitPercentageDriver: 50,
    },
  });

  const watchedAction = watch("action");
  const watchedSplit = watch("splitPercentageDriver");

  async function onSubmit(data: DisputeArbitrationFormValues) {
    // Simulated arbitration resolution
    await new Promise((resolve) => setTimeout(resolve, 1200));

    let summary = "";
    if (data.action === "REFUND_DRIVER") {
      summary = `Case ${selectedCase.id} resolved: Full 100% refund of ${formatBDTFromPaisa(
        selectedCase.amountPaisa
      )} credited to ${selectedCase.driver.fullName}. Transaction reversed.`;
    } else if (data.action === "RELEASE_OWNER") {
      summary = `Case ${selectedCase.id} resolved: Driver claim dismissed. Full funds of ${formatBDTFromPaisa(
        selectedCase.amountPaisa
      )} released to property owner ${selectedCase.owner.fullName}.`;
    } else {
      summary = `Case ${selectedCase.id} resolved: Split settlement executed (${watchedSplit}% Driver / ${
        100 - watchedSplit
      }% Host).`;
    }

    setResolutionResult(summary);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 mb-2">
            <Scale className="size-3.5 text-amber-700" />
            <span>Super Admin Dispute Arbitration Tribunal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading">
            Dispute Arbitration Center
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Conduct bilateral evidence arbitration between Commuters and Property Hosts under ParkEase Trust Safeguards.
          </p>
        </div>

        {/* Dispute Selector Tabs */}
        <div className="flex items-center gap-2">
          {SAMPLE_DISPUTES.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setSelectedCaseId(item.id);
                setResolutionResult(null);
              }}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-bold transition-all cursor-pointer",
                selectedCaseId === item.id
                  ? "border-[#064E3B] bg-[#064E3B] text-white shadow-xs"
                  : "border-[#E5E7EB] bg-white text-muted-foreground hover:bg-muted/40"
              )}
            >
              <span>{item.id}</span>
              <span className="ml-1.5 opacity-80">({formatBDTFromPaisa(item.amountPaisa)})</span>
            </button>
          ))}
        </div>
      </div>

      {resolutionResult && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950 flex items-start gap-3 shadow-xs">
          <CheckCircle2 className="size-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <strong className="block font-bold text-emerald-900 font-heading">
              Arbitration Judgment Finalized & Implemented
            </strong>
            <p className="leading-relaxed">{resolutionResult}</p>
          </div>
        </div>
      )}

      {/* Case Meta Bar */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <Badge className="bg-amber-600 text-white font-bold text-[11px]">
            {selectedCase.category.replaceAll("_", " ")}
          </Badge>
          <span className="font-mono font-bold text-foreground">
            Booking Ref: {selectedCase.bookingCode}
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            Lodged: {new Date(selectedCase.createdAt).toLocaleString("en-BD")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Escrow Amount:</span>
          <span className="text-base font-extrabold text-[#064E3B] font-heading">
            {formatBDTFromPaisa(selectedCase.amountPaisa)}
          </span>
        </div>
      </div>

      {/* SPLIT VIEW: Driver Left vs Owner Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: DRIVER'S COMPLAINT & EVIDENCE */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <div className="flex items-center gap-2">
              <User className="size-4 text-blue-700" />
              <h2 className="text-sm font-bold text-foreground font-heading">
                Driver Claim & Evidence
              </h2>
            </div>
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800 text-[10px]">
              Complainant
            </Badge>
          </div>

          {/* Driver Profile Card */}
          <div className="rounded-lg bg-[#f9f9ff] border border-[#E5E7EB] p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <strong className="font-bold text-foreground">{selectedCase.driver.fullName}</strong>
              <span className="text-muted-foreground font-mono">{selectedCase.driver.phone}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1">
                <Car className="size-3.5 text-muted-foreground" />
                {selectedCase.driver.vehicleModel}
              </span>
              <span className="font-mono font-semibold text-foreground">
                {selectedCase.driver.vehiclePlate}
              </span>
            </div>
          </div>

          {/* Driver Statement */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-heading">
              Driver&apos;s Sworn Statement
            </Label>
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-xs leading-relaxed text-slate-800">
              &quot;{selectedCase.driver.complaintText}&quot;
            </div>
          </div>

          {/* Evidence Photos */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-heading">
              Uploaded Photographic Evidence
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {selectedCase.driver.evidencePhotos.map((photo, i) => (
                <div
                  key={i}
                  className="relative aspect-video overflow-hidden rounded-lg border border-[#E5E7EB] bg-slate-100 group"
                >
                  <Image
                    src={photo}
                    alt="Driver Evidence"
                    fill
                    unoptimized
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                    <Eye className="size-4 mr-1" />
                    Enlarge Evidence
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Requested Remedy */}
          <div className="rounded-lg bg-blue-50/60 border border-blue-200/80 p-3 text-xs text-blue-900 flex items-center justify-between">
            <span className="font-semibold">Remedy Requested:</span>
            <span className="font-bold">{selectedCase.driver.requestedRemedy}</span>
          </div>
        </div>

        {/* RIGHT COLUMN: OWNER'S COUNTER-STATEMENT & EVIDENCE */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-[#064E3B]" />
              <h2 className="text-sm font-bold text-foreground font-heading">
                Host Defense & Gate Log
              </h2>
            </div>
            <Badge className="bg-[#064E3B] text-white text-[10px] font-bold">
              Respondent Host
            </Badge>
          </div>

          {/* Owner Profile Card */}
          <div className="rounded-lg bg-[#f9f9ff] border border-[#E5E7EB] p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <strong className="font-bold text-foreground">{selectedCase.owner.fullName}</strong>
              <Badge variant="outline" className="border-emerald-200 text-emerald-800 text-[10px]">
                Verified Host
              </Badge>
            </div>
            <div className="text-muted-foreground truncate">{selectedCase.owner.propertyName}</div>
            <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-[#E5E7EB]/60">
              <span>Guard On Duty: {selectedCase.owner.guardOnDuty}</span>
              <span className="font-mono text-foreground font-semibold">
                {selectedCase.owner.gateEntryRecorded}
              </span>
            </div>
          </div>

          {/* Owner Statement */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-heading">
              Host&apos;s Formal Counter-Statement
            </Label>
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-xs leading-relaxed text-slate-800">
              &quot;{selectedCase.owner.counterStatement}&quot;
            </div>
          </div>

          {/* Owner Evidence Photos */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-heading">
              Host Telemetry / CCTV Evidence
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {selectedCase.owner.evidencePhotos.map((photo, i) => (
                <div
                  key={i}
                  className="relative aspect-video overflow-hidden rounded-lg border border-[#E5E7EB] bg-slate-100 group"
                >
                  <Image
                    src={photo}
                    alt="Host Evidence"
                    fill
                    unoptimized
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                    <Eye className="size-4 mr-1" />
                    Enlarge CCTV
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-emerald-50/60 border border-emerald-200/80 p-3 text-xs text-emerald-950 flex items-center justify-between">
            <span className="font-semibold">Host Position:</span>
            <span className="font-bold">Requests dismissal & release of parking earnings</span>
          </div>
        </div>
      </div>

      {/* ARBITRATION ACTION PANEL */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div className="flex items-center gap-2">
            <Scale className="size-4 text-[#064E3B]" />
            <h2 className="text-base font-bold text-foreground font-heading">
              Arbitration Ruling & Remedy Execution
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            Disputed Value: {formatBDTFromPaisa(selectedCase.amountPaisa)}
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Action Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-foreground font-heading">
              Select Binding Ruling *
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Refund Driver */}
              <button
                type="button"
                onClick={() => setValue("action", "REFUND_DRIVER")}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all cursor-pointer",
                  watchedAction === "REFUND_DRIVER"
                    ? "border-blue-600 bg-blue-50/80 text-blue-950 ring-2 ring-blue-500/20"
                    : "border-[#E5E7EB] bg-white hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <XCircle className="size-4 text-blue-700" />
                  Refund Driver
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  100% refund of {formatBDTFromPaisa(selectedCase.amountPaisa)} to driver. Host payout cancelled.
                </p>
              </button>

              {/* Option 2: Release to Owner */}
              <button
                type="button"
                onClick={() => setValue("action", "RELEASE_OWNER")}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all cursor-pointer",
                  watchedAction === "RELEASE_OWNER"
                    ? "border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20"
                    : "border-[#E5E7EB] bg-white hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="size-4 text-emerald-700" />
                  Release Funds to Owner
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Dismiss driver claim. Full payment credited to property host balance.
                </p>
              </button>

              {/* Option 3: Split Resolution */}
              <button
                type="button"
                onClick={() => setValue("action", "SPLIT_RESOLUTION")}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all cursor-pointer",
                  watchedAction === "SPLIT_RESOLUTION"
                    ? "border-amber-600 bg-amber-50/80 text-amber-950 ring-2 ring-amber-500/20"
                    : "border-[#E5E7EB] bg-white hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Split className="size-4 text-amber-700" />
                  Split Resolution
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Partial financial compromise (50/50 balance split between parties).
                </p>
              </button>
            </div>
          </div>

          {/* Split percentage slider if split selected */}
          {watchedAction === "SPLIT_RESOLUTION" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-amber-900">
                <span>Driver Refund: {watchedSplit}%</span>
                <span>Host Release: {100 - watchedSplit}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={90}
                step={5}
                value={watchedSplit}
                onChange={(e) => setValue("splitPercentageDriver", Number(e.target.value))}
                className="w-full accent-[#064E3B]"
              />
            </div>
          )}

          {/* Mandatory Admin Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="adminNotes" className="text-xs font-bold uppercase tracking-wider text-foreground font-heading">
              Admin Arbitration Notes & Legal Findings *
            </Label>
            <Textarea
              id="adminNotes"
              placeholder="Detail the factual findings, evidence evaluation, and policy reasons for this binding ruling..."
              rows={3}
              className="text-xs rounded-lg bg-[#F9FAFB] focus:bg-white border-[#E5E7EB] focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
              {...register("adminNotes")}
            />
            {errors.adminNotes && (
              <p className="text-xs text-destructive font-medium">{errors.adminNotes.message}</p>
            )}
          </div>

          {/* Submit Decision Button */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Info className="size-3.5 text-muted-foreground" />
              Arbitration decisions immediately execute ledger balance adjustments and notify both users.
            </span>

            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "h-11 px-6 text-xs font-bold text-white rounded-lg shadow-sm transition-all flex items-center gap-2",
                watchedAction === "REFUND_DRIVER"
                  ? "bg-blue-700 hover:bg-blue-800"
                  : watchedAction === "RELEASE_OWNER"
                  ? "bg-[#064E3B] hover:bg-[#003527]"
                  : "bg-amber-700 hover:bg-amber-800"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Executing Arbitration Judgment…
                </>
              ) : (
                <>
                  {watchedAction === "REFUND_DRIVER" && "Execute Refund to Driver"}
                  {watchedAction === "RELEASE_OWNER" && "Execute Release to Owner"}
                  {watchedAction === "SPLIT_RESOLUTION" && "Execute Split Resolution"}
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
