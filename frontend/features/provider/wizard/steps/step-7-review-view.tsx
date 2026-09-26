"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Check,
  MapPin,
  Car,
  DollarSign,
  ShieldCheck,
  Zap,
  Camera,
  ArrowLeft,
  ExternalLink,
  Eye,
  Rocket,
  Lightbulb,
} from "lucide-react";
import { ListingWizardShell } from "../listing-wizard-shell";

const REVIEW_PHOTOS = [
  { label: "Cover", title: "Property Exterior", src: "/assets/parking-hero-bay.jpg" },
  { label: "Entrance", title: "Gate 2 Entrance", src: "/assets/garage-entrance.jpg" },
  { label: "Basement", title: "Level B Bays", src: "/assets/safety-garage.jpg" },
  { label: "Bay B-04", title: "EV Bay B-04", src: "/assets/parking-ev-charger.jpg" },
  { label: "Ramp", title: "Ramp Access", src: "/assets/auth-gate.jpg" },
  { label: "Guard Point", title: "Security Gate", src: "/assets/parking-guard-booth.jpg" },
];

export function Step7ReviewView() {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handlePublish = () => {
    if (!confirmed) {
      showToast("Please confirm authorization checkbox before publishing.");
      return;
    }
    setIsPublishing(true);
    showToast("Publishing listing to Dhaka marketplace...");
    setTimeout(() => {
      router.push("/provider/properties/new/success");
    }, 900);
  };

  return (
    <ListingWizardShell
      currentStep={7}
      stepTitle="Add Parking Space"
      stepSubtitle="Check the details below before making your parking space available to drivers."
      nextStepTitle="Publish Listing"
      nextStepPath="/provider/properties/new/success"
      prevStepPath="/provider/properties/new/step-6"
      progressPercentage={100}
    >
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-8 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-top-2 border border-slate-700">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* ================================================================= */}
        {/* LEFT COLUMN: REVIEW GRIDS, PHOTOS, PREVIEW & CONFIRMATION         */}
        {/* ================================================================= */}
        <div className="space-y-6">
          {/* HEADER ROW WITH READY BADGES */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <h2 className="font-heading font-extrabold text-base text-slate-900">
                Review Your Parking Listing
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-[#064E3B] border border-emerald-300 font-heading">
                Ready to Publish
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 font-heading">
              <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
              All 7 Steps Verified
            </span>
          </div>

          {/* 2X2 SUMMARY GRIDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. PROPERTY & LOCATION */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-[#064E3B]" />
                    <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                      Property & Location
                    </h3>
                  </div>
                  <Link
                    href="/provider/properties/new/step-2"
                    className="text-xs font-bold text-[#064E3B] hover:underline flex items-center gap-0.5"
                  >
                    Edit →
                  </Link>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Property:</span>
                    <span className="font-bold text-slate-900 font-heading">Residential Building</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Address:</span>
                    <span className="font-medium text-slate-800">Road 12, Block C, Gulshan-2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Landmark:</span>
                    <span className="font-medium text-slate-800">Near Gulshan Circle 2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Entrance:</span>
                    <span className="font-medium text-slate-800">Gate 2 · Basement B</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Access:</span>
                    <span className="font-medium text-slate-800">Main Gate · Ramp Entry</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-semibold text-emerald-700 text-[11px] font-heading">
                  <Check className="size-3 stroke-[3]" /> Map Pin Placed
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[10px] font-heading">
                  Gulshan Zone
                </span>
              </div>
            </div>

            {/* 2. PARKING CAPACITY */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-2">
                    <Car className="size-4 text-[#064E3B]" />
                    <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                      Parking Capacity
                    </h3>
                  </div>
                  <Link
                    href="/provider/properties/new/step-3"
                    className="text-xs font-bold text-[#064E3B] hover:underline flex items-center gap-0.5"
                  >
                    Edit →
                  </Link>
                </div>

                {/* 3 Metric Blocks */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 block font-medium">Total Bays</span>
                    <span className="font-heading font-extrabold text-sm text-slate-900">8</span>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                    <span className="text-[10px] text-emerald-800 block font-medium">Reservable</span>
                    <span className="font-heading font-extrabold text-sm text-[#064E3B]">6</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 block font-medium">Provider Use</span>
                    <span className="font-heading font-extrabold text-sm text-slate-900">2</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Covered Bays:</span>
                    <span className="font-medium text-slate-800">6 Bays (Basement B)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">EV Supported:</span>
                    <span className="font-medium text-slate-800">1 Dedicated Space</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Accessible Bay:</span>
                    <span className="font-medium text-slate-800">1 Ground Level Space</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-semibold text-emerald-700 text-[11px] font-heading">
                  <Check className="size-3 stroke-[3]" /> Space IDs Generated
                </span>
                <span className="font-mono text-[11px] font-bold text-slate-700">
                  B-01 to B-06
                </span>
              </div>
            </div>

            {/* 3. AVAILABILITY & PRICING */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-2">
                    <DollarSign className="size-4 text-[#064E3B]" />
                    <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                      Availability & Pricing
                    </h3>
                  </div>
                  <Link
                    href="/provider/properties/new/step-4"
                    className="text-xs font-bold text-[#064E3B] hover:underline flex items-center gap-0.5"
                  >
                    Edit →
                  </Link>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Base Hourly Rate:</span>
                    <span className="font-bold text-[#064E3B] font-heading">৳ 50 / hour</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Daily Maximum:</span>
                    <span className="font-bold text-slate-900 font-heading">৳ 400 / day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Security Deposit:</span>
                    <span className="font-medium text-slate-800">৳ 200 (Auto-refunded)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Operating Schedule:</span>
                    <span className="font-medium text-slate-800 text-[11px]">Mon–Thu (8A–10P) · Fri (8A–11P)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Weekend Access:</span>
                    <span className="font-bold text-emerald-700">24 Hours (Sat–Sun)</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-semibold text-amber-700 text-[11px] font-heading">
                  <Zap className="size-3 text-amber-600 fill-amber-500" /> Peak Pricing Active
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[10px]">
                  +20% Fri/Sat Evenings
                </span>
              </div>
            </div>

            {/* 4. AMENITIES & SECURITY */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-[#064E3B]" />
                    <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                      Amenities & Security
                    </h3>
                  </div>
                  <Link
                    href="/provider/properties/new/step-5"
                    className="text-xs font-bold text-[#064E3B] hover:underline flex items-center gap-0.5"
                  >
                    Edit →
                  </Link>
                </div>

                {/* Badges row */}
                <div className="flex flex-wrap gap-1 mb-2.5">
                  {["Covered", "CCTV", "On-Site Guard", "EV Charging", "Night Lighting", "Accessible", "24/7 Access"].map((b) => (
                    <span key={b} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">
                      {b}
                    </span>
                  ))}
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Security Grade:</span>
                    <span className="font-bold text-emerald-800 text-[11px] font-heading">High Security Setup</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Entry Verification:</span>
                    <span className="font-medium text-slate-800">QR Code / OTP Fallback</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Guard Verification:</span>
                    <span className="font-medium text-slate-800">Enforced at Gate 2</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-semibold text-emerald-700 text-[11px] font-heading">
                  <Check className="size-3 stroke-[3]" /> Instructions Added
                </span>
                <span className="text-slate-500 text-[11px]">
                  Basement Ramp Note
                </span>
              </div>
            </div>
          </div>

          {/* SECTION: UPLOADED PHOTOS PREVIEW ROW */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Camera className="size-4 text-[#064E3B]" />
                <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                  Uploaded Photos
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  {REVIEW_PHOTOS.length} Photos
                </span>
              </div>
              <Link
                href="/provider/properties/new/step-6"
                className="text-xs font-bold text-[#064E3B] hover:underline flex items-center gap-0.5"
              >
                Edit Photos →
              </Link>
            </div>

            {/* Horizontal thumbnail scroll/grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {REVIEW_PHOTOS.map((item, idx) => (
                <div key={idx} className="relative h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group">
                  <Image src={item.src} alt={item.title} fill className="object-cover group-hover:scale-105 transition duration-200" />
                  <span className={`absolute bottom-1 left-1 px-1.5 py-0.2 rounded text-[9px] font-bold font-heading shadow-xs ${
                    idx === 0 ? "bg-[#064E3B] text-white" : "bg-black/60 text-white backdrop-blur-xs"
                  }`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION: DRIVER LISTING PREVIEW (SEARCH RESULT CARD MOCKUP) */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                  Driver Listing Preview
                </h3>
                <p className="text-[11px] text-slate-400">How drivers see this in search results</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="text-xs font-bold text-[#064E3B] hover:underline flex items-center gap-1 cursor-pointer"
              >
                Preview Full Listing
                <ExternalLink className="size-3" />
              </button>
            </div>

            {/* Search result card mockup */}
            <div className="border border-[#E5E7EB] rounded-xl p-3 flex flex-col sm:flex-row gap-4 bg-slate-50/50 hover:bg-white transition">
              <div className="relative w-full sm:w-44 h-28 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                <Image
                  src="/assets/parking-hero-bay.jpg"
                  alt="Search Card Thumbnail"
                  fill
                  className="object-cover"
                />
                <span className="absolute bottom-1.5 left-1.5 bg-black/75 text-white text-[10px] font-bold px-1.5 py-0.5 rounded font-heading">
                  ৳ 50 / hr
                </span>
              </div>

              <div className="flex-1 flex flex-col justify-between py-0.5">
                <div>
                  <div className="flex items-start justify-between">
                    <h4 className="font-heading font-bold text-sm text-slate-900">
                      Residential Building, Gulshan
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-[#064E3B]">
                      New Listing
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Road 12, Block C, Gulshan-2, Dhaka · Near Circle 2
                  </p>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {["Covered", "CCTV", "Guard Verified", "EV Support"].map((pill) => (
                      <span key={pill} className="px-2 py-0.5 rounded text-[10px] bg-white border border-slate-200 text-slate-700 font-medium">
                        {pill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-[#064E3B] flex items-center gap-1 font-heading">
                    <span className="size-2 rounded-full bg-emerald-600" />
                    Open Today · 6 Spaces Reservable
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Standard & SUV Bays
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CONFIRMATION CHECKBOX BOX */}
          <div
            onClick={() => setConfirmed(!confirmed)}
            className={`p-4 rounded-xl border-2 transition cursor-pointer select-none flex items-start gap-3 ${
              confirmed
                ? "border-[#064E3B] bg-emerald-50/40"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div
              className={`size-5 rounded flex items-center justify-center shrink-0 mt-0.5 transition ${
                confirmed ? "bg-[#064E3B] text-white" : "border border-slate-300 bg-white"
              }`}
            >
              {confirmed && <Check className="size-3.5 stroke-[3]" />}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 font-heading leading-tight">
                I confirm that the information provided is accurate and that I am authorized to list this parking property.
              </p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                By publishing, you agree to ParkEase BD Terms of Service, host guidelines, and applicable marketplace safety policies.
              </p>
            </div>
          </div>

          {/* Bottom Footnote Badge */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span>ParkEase Verified Listing</span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT SIDEBAR (320px): READINESS, PUBLISH SUMMARY, TIPS           */}
        {/* ================================================================= */}
        <aside className="space-y-4">
          {/* CARD 1: LISTING READINESS 100% */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                Listing Readiness
              </span>
              <span className="font-heading font-extrabold text-xs text-[#064E3B]">
                100%
              </span>
            </div>

            {/* Ready banner */}
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold font-heading flex items-center gap-2">
              <CheckCircle2 className="size-4 text-[#064E3B] shrink-0" />
              <span>Ready to Publish to Marketplace</span>
            </div>

            {/* 6 Checklist items in 2 columns */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs pt-1">
              <div className="flex items-center gap-1.5 text-slate-700">
                <Check className="size-3 text-emerald-600 stroke-[3]" />
                <span className="text-[11px] font-medium">Property Details</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <Check className="size-3 text-emerald-600 stroke-[3]" />
                <span className="text-[11px] font-medium">Location & Pin</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <Check className="size-3 text-emerald-600 stroke-[3]" />
                <span className="text-[11px] font-medium">Parking Spaces</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <Check className="size-3 text-emerald-600 stroke-[3]" />
                <span className="text-[11px] font-medium">Availability</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <Check className="size-3 text-emerald-600 stroke-[3]" />
                <span className="text-[11px] font-medium">Pricing & Rules</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <Check className="size-3 text-emerald-600 stroke-[3]" />
                <span className="text-[11px] font-medium">Amenities</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <Check className="size-3 text-emerald-600 stroke-[3]" />
                <span className="text-[11px] font-medium">Security Gate</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <Check className="size-3 text-emerald-600 stroke-[3]" />
                <span className="text-[11px] font-medium">6 Photos</span>
              </div>
            </div>
          </div>

          {/* CARD 2: PUBLISH SUMMARY */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                Publish Summary
              </h3>
              <span className="text-[10px] font-semibold text-slate-400">Active Profile</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Property:</span>
                <span className="font-bold text-slate-900 font-heading">Residential Building</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reservable Bays:</span>
                <span className="font-bold text-[#064E3B] font-heading">6 Spaces</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hourly Rate:</span>
                <span className="font-bold text-slate-900 font-heading">৳ 50 / hr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Daily Cap:</span>
                <span className="font-medium text-slate-800 font-heading">৳ 400</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Security Deposit:</span>
                <span className="font-medium text-slate-800 font-heading">৳ 200</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Schedule:</span>
                <span className="font-medium text-slate-800 text-[11px]">Weekdays + 24H Wknd</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Access Gate:</span>
                <span className="font-medium text-slate-800 text-[11px]">Gate 2 · Guard On-Duty</span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-center text-[11px] font-bold text-emerald-800 font-heading">
              All Required Information Complete
            </div>
          </div>

          {/* CARD 3: BEFORE YOU PUBLISH */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-2.5">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E5E7EB]">
              <Lightbulb className="size-4 text-amber-500" />
              <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                Before You Publish
              </h3>
            </div>
            <div className="space-y-2 text-[11px] text-slate-600 leading-relaxed">
              <p>
                <strong className="text-slate-800 block">Accurate Information</strong>
                Double-check rates, operating hours, and gate entry details for drivers.
              </p>
              <p>
                <strong className="text-slate-800 block">Driver Readiness</strong>
                Confirm that Gate 2 is accessible and on-site staff can verify booking QR passes.
              </p>
              <p>
                <strong className="text-slate-800 block">Provider Responsibility</strong>
                Keep slot availability up-to-date through your Provider Portal at all times.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* OVERRIDE STICKY FOOTER ACTIONS (CUSTOM PUBLISH BUTTON) */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] px-4 sm:px-8 flex items-center justify-between z-40 shadow-lg">
        {/* Left: Back Button */}
        <Link
          href="/provider/properties/new/step-6"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition font-heading"
        >
          <ArrowLeft className="size-3.5" />
          Back to Photos
        </Link>

        {/* Center: Save & Exit */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/provider/properties")}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 font-heading"
          >
            Save & Exit
          </button>

          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition font-heading"
          >
            <Eye className="size-3.5" />
            Preview Listing
          </button>
        </div>

        {/* Right: Massive Deep Emerald Publish Parking Space Button */}
        <button
          type="button"
          disabled={isPublishing}
          onClick={handlePublish}
          className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#064E3B] text-white text-xs font-bold transition shadow-sm hover:bg-[#064E3B]/90 font-heading cursor-pointer ${
            isPublishing ? "opacity-75 cursor-wait" : ""
          }`}
        >
          <Rocket className="size-4" />
          {isPublishing ? "Publishing Space..." : "Publish Parking Space"}
        </button>
      </div>

      {/* MODAL: PREVIEW LISTING DETAILS */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] max-w-lg w-full p-6 space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-heading font-bold text-sm text-slate-900">
                Driver Marketplace Preview
              </h3>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="relative h-48 w-full rounded-xl overflow-hidden bg-slate-100">
              <Image
                src="/assets/parking-hero-bay.jpg"
                alt="Marketplace Listing"
                fill
                className="object-cover"
              />
              <span className="absolute bottom-2 left-2 bg-black/80 text-white font-bold text-xs px-2.5 py-1 rounded-md font-heading">
                ৳ 50 / hr
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-bold text-base text-slate-900">
                  Residential Building, Gulshan
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Road 12, Block C, Gulshan-2, Dhaka · Near Circle 2
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Available Slots:</span>
                <span className="font-bold text-slate-900">6 Spaces Reservable</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Entry Verification:</span>
                <span className="font-bold text-slate-900">QR Code at Gate 2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Daily Maximum:</span>
                <span className="font-bold text-slate-900">৳ 400 / day</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-lg bg-[#064E3B] text-white text-xs font-bold hover:bg-[#064E3B]/90"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </ListingWizardShell>
  );
}
