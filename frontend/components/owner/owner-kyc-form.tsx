"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  UploadCloud,
  FileText,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Building,
  User,
  Clock,
  Loader2,
  FileCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ownerKycSchema, type OwnerKycFormValues } from "@/lib/validations/kyc";
import { cn } from "@/lib/utils";

type StepId = 1 | 2 | 3;

export function OwnerKycForm() {
  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [frontFileName, setFrontFileName] = useState<string | null>(null);
  const [backFileName, setBackFileName] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<OwnerKycFormValues>({
    resolver: zodResolver(ownerKycSchema),
    defaultValues: {
      legalName: "",
      idType: "SMART_NID",
      idNumber: "",
      dateOfBirth: "",
      propertyType: "RESIDENTIAL",
      tradeLicenseNumber: "",
      nidFrontUploaded: false,
      nidBackUploaded: false,
      agreeToDeclaration: false,
    },
  });

  const watchedIdType = useWatch({ control, name: "idType" });
  const watchedPropertyType = useWatch({ control, name: "propertyType" });
  const watchedFrontUploaded = useWatch({ control, name: "nidFrontUploaded" });
  const watchedBackUploaded = useWatch({ control, name: "nidBackUploaded" });
  const watchedAgree = useWatch({ control, name: "agreeToDeclaration" });

  async function handleNextStep() {
    let isValid = false;
    if (currentStep === 1) {
      isValid = await trigger(["legalName", "idType", "idNumber", "dateOfBirth"]);
    } else if (currentStep === 2) {
      isValid = await trigger(["propertyType", "tradeLicenseNumber"]);
    }

    if (isValid) {
      setCurrentStep((prev) => (prev + 1) as StepId);
    }
  }

  function handleFileSelect(side: "front" | "back", e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (side === "front") {
        setFrontFileName(file.name);
        setValue("nidFrontUploaded", true, { shouldValidate: true });
      } else {
        setBackFileName(file.name);
        setValue("nidBackUploaded", true, { shouldValidate: true });
      }
    }
  }

  function removeFile(side: "front" | "back") {
    if (side === "front") {
      setFrontFileName(null);
      setValue("nidFrontUploaded", false, { shouldValidate: true });
    } else {
      setBackFileName(null);
      setValue("nidBackUploaded", false, { shouldValidate: true });
    }
  }

  async function onSubmit(data: OwnerKycFormValues) {
    // Simulated submission delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitted(true);
  }

  if (isSubmitted) {
    return (
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-8 sm:p-12 text-center shadow-xs space-y-5">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
          <FileCheck className="size-8 text-[#064E3B]" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-foreground font-heading">
            KYC Application Submitted
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Your verification documents have been forwarded to the ParkEase Bangladesh compliance team.
          </p>
        </div>

        <div className="rounded-xl bg-[#f9f9ff] border border-[#E5E7EB] p-4 text-xs text-muted-foreground max-w-md mx-auto space-y-2">
          <div className="flex items-center justify-between">
            <span>Review SLA:</span>
            <span className="font-bold text-foreground">Within 24 business hours</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Reference ID:</span>
            <span className="font-mono font-bold text-foreground">KYC-{Date.now().toString().slice(-6)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Payout Status:</span>
            <span className="font-bold text-amber-700">Held pending verification</span>
          </div>
        </div>

        <div className="pt-2">
          <Button
            onClick={() => (window.location.href = "/owner/dashboard")}
            className="h-10 px-6 font-bold bg-[#064E3B] text-white hover:bg-[#003527] rounded-lg"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Required Warning Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-2xs">
        <AlertTriangle className="size-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-wider font-heading text-amber-950">
            Compliance Requirement
          </h3>
          <p className="text-xs font-medium leading-relaxed">
            <strong>Withdrawals are disabled until KYC is verified by ParkEase Admin.</strong> All host earnings will be securely held in your escrow balance and unlocked immediately upon approval.
          </p>
        </div>
      </div>

      {/* Multi-Step Card */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs">
        {/* Stepper Header */}
        <div className="grid grid-cols-3 border-b border-[#E5E7EB] text-center text-xs font-bold font-heading">
          <div
            className={cn(
              "flex items-center justify-center gap-2 py-3.5 border-r border-[#E5E7EB]",
              currentStep === 1
                ? "bg-[#064E3B]/8 text-[#064E3B] border-b-2 border-b-[#064E3B]"
                : currentStep > 1
                ? "text-emerald-700 bg-emerald-50/50"
                : "text-muted-foreground"
            )}
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-current text-[10px] text-white">
              {currentStep > 1 ? "✓" : "1"}
            </span>
            <span className="hidden sm:inline">1. Identity</span>
          </div>

          <div
            className={cn(
              "flex items-center justify-center gap-2 py-3.5 border-r border-[#E5E7EB]",
              currentStep === 2
                ? "bg-[#064E3B]/8 text-[#064E3B] border-b-2 border-b-[#064E3B]"
                : currentStep > 2
                ? "text-emerald-700 bg-emerald-50/50"
                : "text-muted-foreground"
            )}
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-current text-[10px] text-white">
              {currentStep > 2 ? "✓" : "2"}
            </span>
            <span className="hidden sm:inline">2. Property Type</span>
          </div>

          <div
            className={cn(
              "flex items-center justify-center gap-2 py-3.5",
              currentStep === 3
                ? "bg-[#064E3B]/8 text-[#064E3B] border-b-2 border-b-[#064E3B]"
                : "text-muted-foreground"
            )}
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-current text-[10px] text-white">
              3
            </span>
            <span className="hidden sm:inline">3. Upload Documents</span>
          </div>
        </div>

        {/* Stepper Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-6">
          {/* STEP 1: Personal & Government Identity */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground font-heading">
                  National Identity & Legal Details
                </h3>
                <p className="text-xs text-muted-foreground">
                  Please provide the exact name and identifier as printed on your government-issued ID.
                </p>
              </div>

              {/* Legal Name */}
              <div className="space-y-1.5">
                <Label htmlFor="legalName" className="text-xs font-bold text-foreground uppercase tracking-wider font-heading">
                  Full Legal Name (as per NID / Passport) *
                </Label>
                <Input
                  id="legalName"
                  placeholder="e.g. Mohammad Rahim Uddin"
                  className="h-10 text-sm rounded-lg bg-[#F9FAFB] focus:bg-white border-[#E5E7EB] focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
                  {...register("legalName")}
                />
                {errors.legalName && (
                  <p className="text-xs text-destructive font-medium">{errors.legalName.message}</p>
                )}
              </div>

              {/* ID Type Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground uppercase tracking-wider font-heading">
                  Identification Type *
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { type: "SMART_NID", label: "Smart NID (10-Digit)" },
                    { type: "NID", label: "National ID (13/17-Digit)" },
                    { type: "PASSPORT", label: "Bangladesh Passport" },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setValue("idType", item.type as any)}
                      className={cn(
                        "rounded-xl border p-3 text-center transition-all cursor-pointer",
                        watchedIdType === item.type
                          ? "border-[#064E3B] bg-[#064E3B]/8 text-[#064E3B] ring-2 ring-[#064E3B]/20 font-bold"
                          : "border-[#E5E7EB] bg-white text-muted-foreground hover:bg-muted/40 font-medium"
                      )}
                    >
                      <span className="text-xs block">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ID Number */}
                <div className="space-y-1.5">
                  <Label htmlFor="idNumber" className="text-xs font-bold text-foreground uppercase tracking-wider font-heading">
                    {watchedIdType === "PASSPORT" ? "Passport Number" : "NID Number"} *
                  </Label>
                  <Input
                    id="idNumber"
                    placeholder={
                      watchedIdType === "SMART_NID"
                        ? "e.g. 1928374650"
                        : watchedIdType === "PASSPORT"
                        ? "e.g. A01234567"
                        : "e.g. 19851234567890123"
                    }
                    className="h-10 text-sm rounded-lg bg-[#F9FAFB] focus:bg-white border-[#E5E7EB] focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
                    {...register("idNumber")}
                  />
                  {errors.idNumber && (
                    <p className="text-xs text-destructive font-medium">{errors.idNumber.message}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <Label htmlFor="dateOfBirth" className="text-xs font-bold text-foreground uppercase tracking-wider font-heading">
                    Date of Birth *
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    className="h-10 text-sm rounded-lg bg-[#F9FAFB] focus:bg-white border-[#E5E7EB] focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
                    {...register("dateOfBirth")}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-xs text-destructive font-medium">{errors.dateOfBirth.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Property & Business Details */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground font-heading">
                  Property Classification & Licensing
                </h3>
                <p className="text-xs text-muted-foreground">
                  Individual residential garage owners do not require a Trade License.
                </p>
              </div>

              {/* Property Type Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground uppercase tracking-wider font-heading">
                  Property Portfolio Type
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setValue("propertyType", "RESIDENTIAL")}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-all cursor-pointer",
                      watchedPropertyType === "RESIDENTIAL"
                        ? "border-[#064E3B] bg-[#064E3B]/8 text-[#064E3B] ring-2 ring-[#064E3B]/20"
                        : "border-[#E5E7EB] bg-white text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    <div className="font-bold text-sm text-foreground">Residential Garage / Driveway</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Private residential buildings, house garage bays, or apartment slots.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setValue("propertyType", "COMMERCIAL")}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-all cursor-pointer",
                      watchedPropertyType === "COMMERCIAL"
                        ? "border-[#064E3B] bg-[#064E3B]/8 text-[#064E3B] ring-2 ring-[#064E3B]/20"
                        : "border-[#E5E7EB] bg-white text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    <div className="font-bold text-sm text-foreground">Commercial / Dedicated Facility</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Commercial parking structures, corporate lots, or leased premises.
                    </p>
                  </button>
                </div>
              </div>

              {/* Trade License (Optional for Residential) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tradeLicenseNumber" className="text-xs font-bold text-foreground uppercase tracking-wider font-heading">
                    Trade License / TIN Number
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    {watchedPropertyType === "RESIDENTIAL" ? "Optional for residential hosts" : "Mandatory for commercial hosts"}
                  </span>
                </div>
                <Input
                  id="tradeLicenseNumber"
                  placeholder="e.g. TRAD/DNCC/123456/2026"
                  className="h-10 text-sm rounded-lg bg-[#F9FAFB] focus:bg-white border-[#E5E7EB] focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
                  {...register("tradeLicenseNumber")}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Document Uploads (Drag & Drop) */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground font-heading">
                  Document Verification Uploads
                </h3>
                <p className="text-xs text-muted-foreground">
                  Upload crisp, unobstructed photos or PDF scans of your {watchedIdType === "PASSPORT" ? "Passport" : "National ID"}. Max file size: 5MB per file.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Front Side Upload */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-foreground uppercase tracking-wider font-heading">
                    {watchedIdType === "PASSPORT" ? "Passport Info Page *" : "Front Side of NID *"}
                  </Label>

                  {!watchedFrontUploaded ? (
                    <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E5E7EB] bg-[#f9f9ff] p-6 text-center hover:border-[#064E3B]/50 hover:bg-[#064E3B]/4 transition-all cursor-pointer">
                      <UploadCloud className="size-8 text-[#064E3B] mb-2" />
                      <span className="text-xs font-bold text-foreground">Click or Drag & Drop photo</span>
                      <span className="text-[10px] text-muted-foreground mt-1">PNG, JPG, or PDF up to 5MB</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        className="hidden"
                        onChange={(e) => handleFileSelect("front", e)}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                      <div className="flex items-center gap-2.5 truncate">
                        <FileCheck className="size-5 text-emerald-700 shrink-0" />
                        <span className="text-xs font-semibold text-emerald-900 truncate">
                          {frontFileName || "Front_Document.jpg"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile("front")}
                        className="p-1 text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  )}
                  {errors.nidFrontUploaded && (
                    <p className="text-xs text-destructive font-medium">{errors.nidFrontUploaded.message}</p>
                  )}
                </div>

                {/* Back Side Upload */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-foreground uppercase tracking-wider font-heading">
                    {watchedIdType === "PASSPORT" ? "Passport Signature Page *" : "Back Side of NID *"}
                  </Label>

                  {!watchedBackUploaded ? (
                    <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E5E7EB] bg-[#f9f9ff] p-6 text-center hover:border-[#064E3B]/50 hover:bg-[#064E3B]/4 transition-all cursor-pointer">
                      <UploadCloud className="size-8 text-[#064E3B] mb-2" />
                      <span className="text-xs font-bold text-foreground">Click or Drag & Drop photo</span>
                      <span className="text-[10px] text-muted-foreground mt-1">PNG, JPG, or PDF up to 5MB</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        className="hidden"
                        onChange={(e) => handleFileSelect("back", e)}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                      <div className="flex items-center gap-2.5 truncate">
                        <FileCheck className="size-5 text-emerald-700 shrink-0" />
                        <span className="text-xs font-semibold text-emerald-900 truncate">
                          {backFileName || "Back_Document.jpg"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile("back")}
                        className="p-1 text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  )}
                  {errors.nidBackUploaded && (
                    <p className="text-xs text-destructive font-medium">{errors.nidBackUploaded.message}</p>
                  )}
                </div>
              </div>

              {/* Declaration Checkbox */}
              <div className="rounded-xl border border-[#E5E7EB] bg-[#f9f9ff] p-4 space-y-2">
                <div className="flex items-start gap-2.5">
                  <Checkbox
                    id="agreeToDeclaration"
                    checked={watchedAgree}
                    onCheckedChange={(checked) =>
                      setValue("agreeToDeclaration", checked === true, { shouldValidate: true })
                    }
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="agreeToDeclaration"
                    className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none"
                  >
                    I solemnly declare that all information and identity documents submitted are true, authentic, and represent my genuine legal identity in Bangladesh. I acknowledge that falsified submissions lead to immediate account termination.
                  </Label>
                </div>
                {errors.agreeToDeclaration && (
                  <p className="text-xs text-destructive font-medium">{errors.agreeToDeclaration.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-5">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep((prev) => (prev - 1) as StepId)}
                className="h-10 text-xs font-bold rounded-lg"
              >
                <ChevronLeft className="size-4 mr-1" />
                Previous
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="h-10 px-5 text-xs font-bold bg-[#064E3B] text-white hover:bg-[#003527] rounded-lg shadow-xs"
              >
                Next Step
                <ChevronRight className="size-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 px-6 text-xs font-bold bg-[#064E3B] text-white hover:bg-[#003527] rounded-lg shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Submitting Verification…
                  </>
                ) : (
                  <>
                    Submit KYC for Verification
                    <ShieldCheck className="size-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
