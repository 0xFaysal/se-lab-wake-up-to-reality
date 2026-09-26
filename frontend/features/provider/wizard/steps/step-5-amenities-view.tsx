"use client";

import React, { useState } from "react";
import {
  Shield,
  ShieldCheck,
  KeyRound,
  Camera,
  Car,
  Bike,
  Zap,
  Lightbulb,
  CheckCircle2,
  Check,
  ArrowUpDown,
  Clock,
  Warehouse,
  UserCheck,
  Accessibility,
  Droplets,
  Armchair,
  Bath,
  Info,
  Sliders,
} from "lucide-react";
import { ListingWizardShell } from "../listing-wizard-shell";

interface AmenityItem {
  id: string;
  name: string;
  iconName: string;
  enabled: boolean;
}

interface SecurityItem {
  id: string;
  name: string;
  enabled: boolean;
}

const INITIAL_AMENITIES: AmenityItem[] = [
  { id: "covered", name: "Covered Parking", iconName: "warehouse", enabled: true },
  { id: "cctv", name: "CCTV Surveillance", iconName: "camera", enabled: true },
  { id: "guard", name: "On-Site Guard", iconName: "guard", enabled: true },
  { id: "ev", name: "EV Charging", iconName: "zap", enabled: true },
  { id: "lighting", name: "Lighting", iconName: "lightbulb", enabled: true },
  { id: "accessible", name: "Accessible Parking", iconName: "accessible", enabled: true },
  { id: "motorbike", name: "Motorbike Parking", iconName: "bike", enabled: true },
  { id: "carwash", name: "Car Wash", iconName: "droplets", enabled: false },
  { id: "waiting", name: "Waiting Area", iconName: "armchair", enabled: false },
  { id: "restroom", name: "Restroom Access", iconName: "bath", enabled: false },
  { id: "elevator", name: "Elevator Access", iconName: "elevator", enabled: true },
  { id: "247", name: "24/7 Access", iconName: "clock", enabled: true },
];

const INITIAL_SECURITY: SecurityItem[] = [
  { id: "cctv_mon", name: "CCTV Monitoring", enabled: true },
  { id: "guard_verif", name: "Guard Verification", enabled: true },
  { id: "qr_otp", name: "QR / OTP Entry Verification", enabled: true },
  { id: "gate_ctrl", name: "Controlled Gate Access", enabled: true },
  { id: "plate_verif", name: "Vehicle Plate Verification", enabled: true },
  { id: "emergency_contact", name: "Emergency Contact Available", enabled: true },
  { id: "fire_safety", name: "Fire Safety Equipment", enabled: true },
  { id: "night_lighting", name: "Night Lighting", enabled: true },
  { id: "visitor_log", name: "Visitor Log", enabled: false },
];

export function Step5AmenitiesView() {
  const [amenities, setAmenities] = useState<AmenityItem[]>(INITIAL_AMENITIES);
  const [securityItems, setSecurityItems] = useState<SecurityItem[]>(INITIAL_SECURITY);

  // Access Controls
  const [primaryEntry, setPrimaryEntry] = useState("QR Code");
  const [fallbackEntry, setFallbackEntry] = useState("OTP Verification");
  const [guardVerif, setGuardVerif] = useState(true);
  const [gateAccess, setGateAccess] = useState(true);
  const [plateMatch, setPlateMatch] = useState(true);
  const [exitVerif, setExitVerif] = useState(true);

  // Instructions
  const [driverInstructions, setDriverInstructions] = useState(
    "Show your booking QR code at Gate 2. The on-site guard will verify the booking and vehicle plate before entry. Follow signs to Basement Level B."
  );
  const [safetyNotes, setSafetyNotes] = useState(
    "Drive slowly on the basement ramp. Follow guard instructions and use marked pedestrian paths."
  );

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const toggleAmenity = (id: string) => {
    setAmenities((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newState = !item.enabled;
          showToast(`${item.name} turned ${newState ? "ON" : "OFF"}.`);
          return { ...item, enabled: newState };
        }
        return item;
      })
    );
  };

  const toggleSecurity = (id: string) => {
    setSecurityItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newState = !item.enabled;
          showToast(`${item.name} set to ${newState ? "ON" : "OFF"}.`);
          return { ...item, enabled: newState };
        }
        return item;
      })
    );
  };

  const selectedAmenitiesCount = amenities.filter((a) => a.enabled).length;
  const selectedSecurityCount = securityItems.filter((s) => s.enabled).length;

  const renderAmenityIcon = (iconName: string) => {
    switch (iconName) {
      case "warehouse":
        return <Warehouse className="size-4.5 text-slate-700" />;
      case "camera":
        return <Camera className="size-4.5 text-slate-700" />;
      case "guard":
        return <UserCheck className="size-4.5 text-slate-700" />;
      case "zap":
        return <Zap className="size-4.5 text-slate-700" />;
      case "lightbulb":
        return <Lightbulb className="size-4.5 text-slate-700" />;
      case "accessible":
        return <Accessibility className="size-4.5 text-slate-700" />;
      case "bike":
        return <Bike className="size-4.5 text-slate-700" />;
      case "droplets":
        return <Droplets className="size-4.5 text-slate-700" />;
      case "armchair":
        return <Armchair className="size-4.5 text-slate-700" />;
      case "bath":
        return <Bath className="size-4.5 text-slate-700" />;
      case "elevator":
        return <ArrowUpDown className="size-4.5 text-slate-700" />;
      case "clock":
        return <Clock className="size-4.5 text-slate-700" />;
      default:
        return <Sliders className="size-4.5 text-slate-700" />;
    }
  };

  return (
    <ListingWizardShell
      currentStep={5}
      stepTitle="Add Parking Space"
      stepSubtitle="Select the amenities, safety features, and access controls available at this parking property."
      nextStepTitle="Photos (6/7)"
      nextStepPath="/provider/properties/new/step-6"
      prevStepPath="/provider/properties/new/step-4"
      progressPercentage={71}
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
        {/* LEFT COLUMN: AMENITIES, SECURITY & ACCESS CONTROLS                */}
        {/* ================================================================= */}
        <div className="space-y-6">
          {/* SECTION 1: PARKING AMENITIES */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2.5">
                <Sliders className="size-4 text-[#064E3B]" />
                <h2 className="font-heading font-bold text-sm tracking-wide text-slate-900 uppercase">
                  Parking Amenities
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500 font-heading">
                {selectedAmenitiesCount} Selected of {amenities.length}
              </span>
            </div>

            {/* Grid of 12 Amenities (2 columns on desktop) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {amenities.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleAmenity(item.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                    item.enabled
                      ? "border-[#E5E7EB] bg-white hover:border-emerald-300 hover:shadow-2xs"
                      : "border-dashed border-[#E5E7EB] bg-slate-50/50 hover:bg-white text-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-8 rounded-lg flex items-center justify-center ${
                        item.enabled ? "bg-slate-100" : "bg-slate-100/60 opacity-60"
                      }`}
                    >
                      {renderAmenityIcon(item.iconName)}
                    </div>
                    <span
                      className={`text-xs font-bold font-heading ${
                        item.enabled ? "text-slate-900" : "text-slate-500"
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>

                  {/* Toggle Pill Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAmenity(item.id);
                    }}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold font-heading transition-colors ${
                      item.enabled
                        ? "bg-[#064E3B] text-white shadow-2xs"
                        : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {item.enabled ? "ON" : "OFF"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: ROW OF TWO SUB-CARDS (SECURITY & ACCESS CONTROLS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SUB-CARD A: SECURITY & SAFETY */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-2">
                    <Shield className="size-4 text-[#064E3B]" />
                    <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                      Security & Safety
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 font-heading">
                    Level: High
                  </span>
                </div>

                <div className="space-y-2.5">
                  {securityItems.map((sec) => (
                    <div
                      key={sec.id}
                      onClick={() => toggleSecurity(sec.id)}
                      className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50 transition cursor-pointer select-none"
                    >
                      <span
                        className={`text-xs font-medium ${
                          sec.enabled ? "text-slate-800 font-semibold" : "text-slate-400"
                        }`}
                      >
                        {sec.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSecurity(sec.id);
                        }}
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold font-heading transition-colors ${
                          sec.enabled
                            ? "bg-[#064E3B] text-white"
                            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        }`}
                      >
                        {sec.enabled ? "ON" : "OFF"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom verified standard */}
              <div className="mt-5 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium text-[11px]">
                  Standard Dhaka Commercial Grade
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-[#064E3B]">
                  <ShieldCheck className="size-3.5 text-[#064E3B]" />
                  Verified
                </span>
              </div>
            </div>

            {/* SUB-CARD B: ACCESS CONTROLS */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-2">
                    <KeyRound className="size-4 text-[#064E3B]" />
                    <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                      Access Controls
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 font-heading">
                    Enforced at Gate
                  </span>
                </div>

                {/* Dropdowns for entry methods */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Primary Entry Method
                    </label>
                    <select
                      value={primaryEntry}
                      onChange={(e) => setPrimaryEntry(e.target.value)}
                      className="w-full h-8.5 px-2 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-[#064E3B]"
                    >
                      <option value="QR Code">QR Code</option>
                      <option value="Plate Match">Plate Match</option>
                      <option value="RFID Card">RFID Card</option>
                      <option value="OTP Verification">OTP Verification</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Fallback Entry Method
                    </label>
                    <select
                      value={fallbackEntry}
                      onChange={(e) => setFallbackEntry(e.target.value)}
                      className="w-full h-8.5 px-2 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-[#064E3B]"
                    >
                      <option value="OTP Verification">OTP Verification</option>
                      <option value="SMS Passcode">SMS Passcode</option>
                      <option value="Security Call">Security Call</option>
                      <option value="Manual Guard Pass">Manual Guard Pass</option>
                    </select>
                  </div>
                </div>

                {/* 2x2 Enforced Toggles */}
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  <div className="p-2 rounded-lg border border-[#E5E7EB] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-medium">Guard Verification</span>
                      <span className="text-xs font-bold text-slate-900">Required</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGuardVerif(!guardVerif)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-heading ${
                        guardVerif ? "bg-[#064E3B] text-white" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {guardVerif ? "ON" : "OFF"}
                    </button>
                  </div>

                  <div className="p-2 rounded-lg border border-[#E5E7EB] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-medium">Gate Access</span>
                      <span className="text-xs font-bold text-slate-900">Controlled</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGateAccess(!gateAccess)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-heading ${
                        gateAccess ? "bg-[#064E3B] text-white" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {gateAccess ? "ON" : "OFF"}
                    </button>
                  </div>

                  <div className="p-2 rounded-lg border border-[#E5E7EB] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-medium">Vehicle Plate Match</span>
                      <span className="text-xs font-bold text-slate-900">Required</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPlateMatch(!plateMatch)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-heading ${
                        plateMatch ? "bg-[#064E3B] text-white" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {plateMatch ? "ON" : "OFF"}
                    </button>
                  </div>

                  <div className="p-2 rounded-lg border border-[#E5E7EB] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-medium">Exit Verification</span>
                      <span className="text-xs font-bold text-slate-900">Required</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExitVerif(!exitVerif)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-heading ${
                        exitVerif ? "bg-[#064E3B] text-white" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {exitVerif ? "ON" : "OFF"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Guard Flow Information Callout */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-900 block mb-0.5">Guard Flow:</span>
                Drivers scan QR at Gate 2. The guard verifies vehicle plate on the on-site guard portal before lifting the barrier.
              </div>
            </div>
          </div>

          {/* SECTION 3: DRIVER INSTRUCTIONS & SAFETY NOTES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DRIVER INSTRUCTIONS */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Car className="size-4 text-[#064E3B]" />
                  <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                    Driver Instructions
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {driverInstructions.length} / 500
                </span>
              </div>

              <textarea
                rows={4}
                value={driverInstructions}
                maxLength={500}
                onChange={(e) => setDriverInstructions(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#E5E7EB] text-xs leading-relaxed text-slate-800 bg-white focus:outline-none focus:border-[#064E3B] resize-none"
                placeholder="Enter gate directions, QR presentation requirements, and bay floor markings..."
              />

              <p className="text-[11px] text-slate-400 mt-2 font-medium">
                Displayed on the driver booking pass and confirmation view.
              </p>
            </div>

            {/* SAFETY NOTES */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Info className="size-4 text-[#064E3B]" />
                  <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                    Safety Notes
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 font-heading">
                  Optional
                </span>
              </div>

              <textarea
                rows={4}
                value={safetyNotes}
                maxLength={500}
                onChange={(e) => setSafetyNotes(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#E5E7EB] text-xs leading-relaxed text-slate-800 bg-white focus:outline-none focus:border-[#064E3B] resize-none"
                placeholder="Speed limits, clearance limits, pedestrian walkways, or basement safety precautions..."
              />

              <p className="text-[11px] text-slate-400 mt-2 font-medium">
                Shared with verified drivers to prevent property congestion.
              </p>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT SIDEBAR (320px): SUMMARIES, READINESS, PROGRESS, TIPS       */}
        {/* ================================================================= */}
        <aside className="space-y-4">
          {/* CARD 1: AMENITIES SUMMARY */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Sliders className="size-4 text-[#064E3B]" />
                <h3 className="font-heading font-bold text-xs tracking-wide text-slate-900 uppercase">
                  Amenities Summary
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Amenities Ready
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Selected Amenities</span>
                <span className="font-bold text-slate-900 font-heading">{selectedAmenitiesCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Security Features</span>
                <span className="font-bold text-slate-900 font-heading">{selectedSecurityCount}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-slate-600">24/7 Access</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1 font-heading">
                  <Check className="size-3 stroke-[3]" /> Yes
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Guard Available</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1 font-heading">
                  <Check className="size-3 stroke-[3]" /> Yes
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">CCTV</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1 font-heading">
                  <Check className="size-3 stroke-[3]" /> Yes
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">EV Charging</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1 font-heading">
                  <Check className="size-3 stroke-[3]" /> Yes
                </span>
              </div>
            </div>
          </div>

          {/* CARD 2: SECURITY READINESS */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-[#064E3B]" />
                <h3 className="font-heading font-bold text-xs tracking-wide text-slate-900 uppercase">
                  Security Readiness
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                High Security Setup
              </span>
            </div>

            {/* 2-Column Readiness Matrix */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">CCTV</span>
                <span className="font-bold text-emerald-800 text-[11px] font-heading">Configured</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">Guard</span>
                <span className="font-bold text-emerald-800 text-[11px] font-heading">Configured</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">QR / OTP</span>
                <span className="font-bold text-emerald-800 text-[11px] font-heading">Configured</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">Gate</span>
                <span className="font-bold text-emerald-800 text-[11px] font-heading">Configured</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">Vehicle</span>
                <span className="font-bold text-emerald-800 text-[11px] font-heading">Configured</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">Emergency</span>
                <span className="font-bold text-emerald-800 text-[11px] font-heading">Configured</span>
              </div>
            </div>
          </div>

          {/* CARD 3: LISTING PROGRESS */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                Listing Progress
              </span>
              <span className="font-heading font-extrabold text-xs text-[#064E3B]">
                71%
              </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-[#064E3B] rounded-full" style={{ width: "71%" }} />
            </div>

            <ul className="space-y-2 text-xs pt-1">
              <li className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-700" />
                  Property Details
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 font-heading">Completed</span>
              </li>
              <li className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-700" />
                  Location & Entrance
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 font-heading">Completed</span>
              </li>
              <li className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-700" />
                  Parking Spaces
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 font-heading">Completed</span>
              </li>
              <li className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-700" />
                  Availability & Pricing
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 font-heading">Completed</span>
              </li>
              <li className="flex items-center justify-between text-[#064E3B] font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-[#064E3B]" />
                  Amenities & Security
                </span>
                <span className="text-[11px] font-bold text-[#064E3B] font-heading">In Progress</span>
              </li>
              <li className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-slate-300" />
                  6. Photos
                </span>
                <span className="text-[11px] font-medium font-heading">Pending</span>
              </li>
              <li className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-slate-300" />
                  7. Review & Publish
                </span>
                <span className="text-[11px] font-medium font-heading">Pending</span>
              </li>
            </ul>
          </div>

          {/* CARD 4: SETUP TIPS */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-2.5">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E5E7EB]">
              <Lightbulb className="size-4 text-amber-500" />
              <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                Setup Tips
              </h3>
            </div>
            <div className="space-y-2 text-[11px] text-slate-600 leading-relaxed">
              <p>
                <strong className="text-slate-800 block">Accurate Amenities</strong>
                Only select features actually available on-site.
              </p>
              <p>
                <strong className="text-slate-800 block">Security Details</strong>
                Clearly mention entry and guard verification requirements.
              </p>
              <p>
                <strong className="text-slate-800 block">Driver Instructions</strong>
                Keep access directions short and gate-specific.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </ListingWizardShell>
  );
}
