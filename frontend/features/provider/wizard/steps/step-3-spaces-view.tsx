"use client";

import React, { useState } from "react";
import {
  Building2,
  Car,
  Plus,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Lightbulb,
  Check,
  X,
  Zap,
  Accessibility,
  Video,
} from "lucide-react";
import { ListingWizardShell } from "../listing-wizard-shell";

export interface ParkingSpaceItem {
  id: string;
  spaceId: string;
  type: string;
  level: string;
  size: "Standard" | "Large" | "Compact";
  features: string;
  featuresType: "covered" | "cctv" | "ev" | "accessible";
  status: "Available" | "Maintenance" | "Reserved";
}

const INITIAL_SPACES: ParkingSpaceItem[] = [
  {
    id: "sp-1",
    spaceId: "B-01",
    type: "Standard",
    level: "Basement B",
    size: "Standard",
    features: "Covered",
    featuresType: "covered",
    status: "Available",
  },
  {
    id: "sp-2",
    spaceId: "B-02",
    type: "SUV",
    level: "Basement B",
    size: "Large",
    features: "Covered",
    featuresType: "covered",
    status: "Available",
  },
  {
    id: "sp-3",
    spaceId: "B-03",
    type: "Standard",
    level: "Basement B",
    size: "Standard",
    features: "Covered • CCTV",
    featuresType: "cctv",
    status: "Available",
  },
  {
    id: "sp-4",
    spaceId: "B-04",
    type: "Standard",
    level: "Basement B",
    size: "Standard",
    features: "EV Charging",
    featuresType: "ev",
    status: "Available",
  },
  {
    id: "sp-5",
    spaceId: "B-05",
    type: "Motorbike",
    level: "Ground",
    size: "Compact",
    features: "Covered",
    featuresType: "covered",
    status: "Available",
  },
  {
    id: "sp-6",
    spaceId: "B-06",
    type: "Accessible",
    level: "Ground",
    size: "Large",
    features: "Accessible Route",
    featuresType: "accessible",
    status: "Available",
  },
];

export function Step3SpacesView() {
  const [spaces, setSpaces] = useState<ParkingSpaceItem[]>(INITIAL_SPACES);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Default configuration
  const [defaultLevel, setDefaultLevel] = useState("Basement B");
  const [parkingType, setParkingType] = useState("Covered");
  const [vehicleType, setVehicleType] = useState("Car (Sedan / SUV)");
  const [defaultStatus, setDefaultStatus] = useState("Available");
  const [applyDefaults, setApplyDefaults] = useState(true);

  // Space rules toggles
  const [rules, setRules] = useState({
    allowSuv: true,
    allowEv: true,
    guardVerification: true,
    motorbikeBooking: true,
    accessibleBooking: true,
    qrOtpRequired: true,
  });

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<ParkingSpaceItem | null>(null);
  const [newSpaceId, setNewSpaceId] = useState("");
  const [newSpaceType, setNewSpaceType] = useState("Standard");
  const [newSpaceLevel, setNewSpaceLevel] = useState("Basement B");
  const [newSpaceSize, setNewSpaceSize] = useState<"Standard" | "Large" | "Compact">("Standard");
  const [newSpaceFeatures, setNewSpaceFeatures] = useState("Covered");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleToggleRule = (key: keyof typeof rules) => {
    setRules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAutoGenerate = () => {
    setSpaces((prev) =>
      prev.map((s, idx) => ({
        ...s,
        spaceId: `B-0${idx + 1}`,
      }))
    );
    showToast("Space IDs auto-sequenced successfully.");
  };

  const handleAddSpace = (e: React.FormEvent) => {
    e.preventDefault();
    const generatedId = newSpaceId.trim() || `B-0${spaces.length + 1}`;
    const newSpace: ParkingSpaceItem = {
      id: `sp-${Date.now()}`,
      spaceId: generatedId,
      type: newSpaceType,
      level: newSpaceLevel,
      size: newSpaceSize,
      features: newSpaceFeatures,
      featuresType: newSpaceFeatures.toLowerCase().includes("ev")
        ? "ev"
        : newSpaceFeatures.toLowerCase().includes("accessible")
        ? "accessible"
        : newSpaceFeatures.toLowerCase().includes("cctv")
        ? "cctv"
        : "covered",
      status: "Available",
    };

    setSpaces((prev) => [...prev, newSpace]);
    setIsAddModalOpen(false);
    setNewSpaceId("");
    showToast(`Space ${generatedId} added to listing.`);
  };

  const handleEditSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpace) return;

    setSpaces((prev) =>
      prev.map((s) => (s.id === editingSpace.id ? editingSpace : s))
    );
    showToast(`Space ${editingSpace.spaceId} updated.`);
    setEditingSpace(null);
  };

  return (
    <ListingWizardShell
      currentStep={3}
      stepTitle="Add Parking Space"
      stepSubtitle="Define the parking spaces drivers can reserve at this property."
      nextStepTitle="Availability & Pricing"
      nextStepPath="/provider/properties/new/step-4"
      prevStepPath="/provider/properties/new/step-2"
      progressPercentage={43}
    >
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-24 right-8 z-50 bg-[#064E3B] text-white text-xs font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
          <Check className="size-4 text-emerald-300" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
        {/* ================================================================== */}
        {/* MAIN FORM AREA (LEFT COLUMN)                                       */}
        {/* ================================================================== */}
        <div className="space-y-6">
          {/* 1. METRICS ROW (2 CARDS SIDE-BY-SIDE) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: PARKING CAPACITY */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold font-heading text-xs uppercase tracking-wider">
                  <Building2 className="size-4 text-[#064E3B]" />
                  <span>PARKING CAPACITY</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Capacity Valid
                </span>
              </div>

              {/* 3 Stat blocks */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    TOTAL
                  </span>
                  <span className="text-2xl font-extrabold text-slate-900 font-heading block mt-0.5">
                    8
                  </span>
                  <span className="text-[10px] text-slate-400">Total Bays</span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-[#064E3B] block">
                    RESERVABLE
                  </span>
                  <span className="text-2xl font-extrabold text-[#064E3B] font-heading block mt-0.5">
                    {spaces.length}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium">Public Slots</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    RESERVED
                  </span>
                  <span className="text-2xl font-extrabold text-slate-900 font-heading block mt-0.5">
                    2
                  </span>
                  <span className="text-[10px] text-slate-400">Provider Use</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
                <span className="text-slate-400">ⓘ</span>
                <span>Reservable spaces will be visible to drivers when published.</span>
              </p>
            </div>

            {/* Card 2: SPACE TYPES */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold font-heading text-xs uppercase tracking-wider">
                  <Car className="size-4 text-[#064E3B]" />
                  <span>SPACE TYPES</span>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {spaces.length} Configured
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-slate-700 font-medium">
                    <span className="size-2 rounded-full bg-emerald-600" />
                    Standard Car
                  </span>
                  <strong className="text-slate-900">
                    {spaces.filter((s) => s.type === "Standard").length} spaces
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-slate-700 font-medium">
                    <span className="size-2 rounded-full bg-teal-600" />
                    SUV / Large Vehicle
                  </span>
                  <strong className="text-slate-900">
                    {spaces.filter((s) => s.type === "SUV").length} spaces
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-slate-700 font-medium">
                    <span className="size-2 rounded-full bg-amber-500" />
                    Motorbike
                  </span>
                  <strong className="text-slate-900">
                    {spaces.filter((s) => s.type === "Motorbike").length} spaces
                  </strong>
                </div>
              </div>

              {/* Specialty tags row */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Specialty Tags:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  1 EV • 1 Accessible
                </span>
              </div>
            </div>
          </div>

          {/* 2. PARKING SPACES TABLE CARD */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="size-6 rounded-lg bg-[#064E3B] text-white font-bold text-xs flex items-center justify-center font-heading">
                    P
                  </span>
                  <h3 className="text-sm sm:text-base font-bold font-heading text-slate-900">
                    PARKING SPACES
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Create and configure individual reservable spaces.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleAutoGenerate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
                >
                  <RefreshCw className="size-3.5" />
                  <span>Auto-Generate IDs</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
                >
                  <Plus className="size-3.5 stroke-[2.5]" />
                  <span>+ Add Parking Space</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-slate-50/75 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Space ID</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Level / Zone</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Features</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {spaces.map((sp) => (
                    <tr key={sp.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-heading">
                        {sp.spaceId}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {sp.type}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {sp.level}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {sp.size}
                      </td>
                      <td className="py-3.5 px-4">
                        {sp.featuresType === "ev" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Zap className="size-3" />
                            {sp.features}
                          </span>
                        ) : sp.featuresType === "accessible" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                            <Accessibility className="size-3" />
                            {sp.features}
                          </span>
                        ) : sp.featuresType === "cctv" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            <Video className="size-3 text-slate-500" />
                            {sp.features}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                            {sp.features}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
                          <span className="size-1.5 rounded-full bg-emerald-600" />
                          Available
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingSpace(sp)}
                          className="text-xs font-semibold text-[#064E3B] hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-3.5 bg-slate-50/70 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2">
              <div className="flex items-center gap-2 font-medium text-emerald-900">
                <Check className="size-4 text-emerald-600 stroke-[2.5]" />
                <span>All {spaces.length} Space IDs verified unique within Residential Building, Gulshan.</span>
              </div>
              <span className="text-slate-400 text-[11px]">
                Showing {spaces.length} of {spaces.length} reservable bays
              </span>
            </div>
          </div>

          {/* 3. BOTTOM ROW (2 CARDS SIDE-BY-SIDE) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: DEFAULT SPACE CONFIGURATION */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold font-heading text-xs uppercase tracking-wider border-b border-slate-100 pb-2.5">
                <Sliders className="size-4 text-[#064E3B]" />
                <span>DEFAULT SPACE CONFIGURATION</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    DEFAULT LEVEL
                  </label>
                  <select
                    value={defaultLevel}
                    onChange={(e) => setDefaultLevel(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] bg-[#fcfcfd] font-medium text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  >
                    <option value="Basement B">Basement B</option>
                    <option value="Basement A">Basement A</option>
                    <option value="Ground">Ground</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    PARKING TYPE
                  </label>
                  <select
                    value={parkingType}
                    onChange={(e) => setParkingType(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] bg-[#fcfcfd] font-medium text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  >
                    <option value="Covered">Covered</option>
                    <option value="Open Air">Open Air</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    VEHICLE TYPE
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] bg-[#fcfcfd] font-medium text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  >
                    <option value="Car (Sedan / SUV)">Car (Sedan / SUV)</option>
                    <option value="Motorbike">Motorbike</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    DEFAULT STATUS
                  </label>
                  <select
                    value={defaultStatus}
                    onChange={(e) => setDefaultStatus(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] bg-[#fcfcfd] font-medium text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  >
                    <option value="Available">Available</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyDefaults}
                    onChange={(e) => setApplyDefaults(e.target.checked)}
                    className="size-4 rounded text-[#064E3B] focus:ring-[#064E3B] border-slate-300"
                  />
                  <span>Apply these defaults when adding new spaces</span>
                </label>
              </div>
            </div>

            {/* Card 2: SPACE RULES & VERIFICATION */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold font-heading text-xs uppercase tracking-wider border-b border-slate-100 pb-2.5">
                <ShieldCheck className="size-4 text-[#064E3B]" />
                <span>SPACE RULES & VERIFICATION</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">Allow SUV Booking</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={rules.allowSuv}
                      onClick={() => handleToggleRule("allowSuv")}
                      className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        rules.allowSuv ? "bg-[#064E3B]" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-3.5 transform rounded-full bg-white shadow-sm transition ${
                          rules.allowSuv ? "translate-x-3.5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">Allow EV Vehicles</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={rules.allowEv}
                      onClick={() => handleToggleRule("allowEv")}
                      className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        rules.allowEv ? "bg-[#064E3B]" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-3.5 transform rounded-full bg-white shadow-sm transition ${
                          rules.allowEv ? "translate-x-3.5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">Guard Verification</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={rules.guardVerification}
                      onClick={() => handleToggleRule("guardVerification")}
                      className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        rules.guardVerification ? "bg-[#064E3B]" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-3.5 transform rounded-full bg-white shadow-sm transition ${
                          rules.guardVerification ? "translate-x-3.5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">Motorbike Booking</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={rules.motorbikeBooking}
                      onClick={() => handleToggleRule("motorbikeBooking")}
                      className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        rules.motorbikeBooking ? "bg-[#064E3B]" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-3.5 transform rounded-full bg-white shadow-sm transition ${
                          rules.motorbikeBooking ? "translate-x-3.5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">Accessible Booking</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={rules.accessibleBooking}
                      onClick={() => handleToggleRule("accessibleBooking")}
                      className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        rules.accessibleBooking ? "bg-[#064E3B]" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-3.5 transform rounded-full bg-white shadow-sm transition ${
                          rules.accessibleBooking ? "translate-x-3.5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">QR / OTP Required</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={rules.qrOtpRequired}
                      onClick={() => handleToggleRule("qrOtpRequired")}
                      className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        rules.qrOtpRequired ? "bg-[#064E3B]" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-3.5 transform rounded-full bg-white shadow-sm transition ${
                          rules.qrOtpRequired ? "translate-x-3.5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-medium text-right">
                Enforced via on-site Guard Portal
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* RIGHT SIDEBAR (TIPS & PROGRESS - 320PX)                            */}
        {/* ================================================================== */}
        <div className="space-y-5">
          {/* 1. LISTING PROGRESS */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold font-heading text-slate-900">
                <Sliders className="size-4 text-[#064E3B]" />
                <span>LISTING PROGRESS</span>
              </div>
              <span className="text-xs font-bold text-[#064E3B] font-heading">
                43% Complete
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-800 font-medium">
                <Check className="size-3.5 text-emerald-600 stroke-[3]" />
                <span>Property Details</span>
                <span className="text-[10px] text-emerald-700 font-bold ml-auto">Completed</span>
              </div>

              <div className="flex items-center gap-2 text-slate-800 font-medium">
                <Check className="size-3.5 text-emerald-600 stroke-[3]" />
                <span>Location & Map Pin</span>
                <span className="text-[10px] text-emerald-700 font-bold ml-auto">Completed</span>
              </div>

              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <span className="size-2 rounded-full bg-emerald-600" />
                <span>Parking Spaces</span>
                <span className="text-[10px] text-slate-500 font-semibold ml-auto">In Progress</span>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <span className="size-1.5 rounded-full bg-slate-300" />
                <span>Availability & Pricing</span>
                <span className="text-[10px] ml-auto">Pending</span>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <span className="size-1.5 rounded-full bg-slate-300" />
                <span>Amenities & Security</span>
                <span className="text-[10px] ml-auto">Pending</span>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <span className="size-1.5 rounded-full bg-slate-300" />
                <span>Photos</span>
                <span className="text-[10px] ml-auto">Pending</span>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <span className="size-1.5 rounded-full bg-slate-300" />
                <span>Review & Publish</span>
                <span className="text-[10px] ml-auto">Pending</span>
              </div>
            </div>
          </div>

          {/* 2. CAPACITY SUMMARY */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold font-heading text-slate-900">
                <Building2 className="size-4 text-[#064E3B]" />
                <span>CAPACITY SUMMARY</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Verified
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Spaces</span>
                <strong className="text-slate-900">8</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold text-[#064E3B]">Reservable</span>
                <strong className="text-[#064E3B] font-bold">{spaces.length}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Property Use</span>
                <strong className="text-slate-900">2</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Covered Spaces</span>
                <strong className="text-slate-900">6</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">EV Supported</span>
                <strong className="text-slate-900">1</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Accessible</span>
                <strong className="text-slate-900">1</strong>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-[11px] text-emerald-900 font-medium flex items-center gap-1.5">
              <Check className="size-3.5 text-emerald-600 stroke-[2.5]" />
              <span>Capacity configuration is valid.</span>
            </div>
          </div>

          {/* 3. TIPS FOR PARKING SPACES */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold font-heading text-slate-900 border-b border-slate-100 pb-2.5">
              <Lightbulb className="size-4 text-amber-500" />
              <span>TIPS FOR PARKING SPACES</span>
            </div>

            <ul className="space-y-2 text-[11px] text-slate-600 leading-relaxed">
              <li>
                <strong className="text-slate-900">• Unique IDs:</strong> Give each space a distinct ID (e.g. B-01).
              </li>
              <li>
                <strong className="text-slate-900">• Correct Size:</strong> Mark SUV bays accurately to prevent overhang.
              </li>
              <li>
                <strong className="text-slate-900">• Vehicle Compatibility:</strong> Allow only vehicle types that safely fit.
              </li>
              <li>
                <strong className="text-slate-900">• Special Features:</strong> Highlight EV chargers or accessible spaces.
              </li>
            </ul>
          </div>

          {/* Draft Saved Real-Time Tag */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Draft Saved: Changes preserved automatically.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODAL: ADD PARKING SPACE                                             */}
      {/* ==================================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold font-heading text-slate-900">
                Add Parking Space
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAddSpace} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Space ID *</label>
                <input
                  type="text"
                  placeholder={`e.g. B-0${spaces.length + 1}`}
                  value={newSpaceId}
                  onChange={(e) => setNewSpaceId(e.target.value)}
                  className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] text-slate-900 focus:outline-none focus:border-[#064E3B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={newSpaceType}
                    onChange={(e) => setNewSpaceType(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] bg-white text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  >
                    <option value="Standard">Standard</option>
                    <option value="SUV">SUV</option>
                    <option value="Motorbike">Motorbike</option>
                    <option value="Accessible">Accessible</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Level / Zone</label>
                  <input
                    type="text"
                    value={newSpaceLevel}
                    onChange={(e) => setNewSpaceLevel(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Size</label>
                  <select
                    value={newSpaceSize}
                    onChange={(e) => setNewSpaceSize(e.target.value as ParkingSpaceItem["size"])}
                    className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] bg-white text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Large">Large</option>
                    <option value="Compact">Compact</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Features</label>
                  <select
                    value={newSpaceFeatures}
                    onChange={(e) => setNewSpaceFeatures(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] bg-white text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  >
                    <option value="Covered">Covered</option>
                    <option value="Covered • CCTV">Covered • CCTV</option>
                    <option value="EV Charging">EV Charging</option>
                    <option value="Accessible Route">Accessible Route</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#E5E7EB] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#064E3B] text-white font-semibold hover:bg-[#064E3B]/90"
                >
                  Add Space
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: EDIT PARKING SPACE                                            */}
      {/* ==================================================================== */}
      {editingSpace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold font-heading text-slate-900">
                Edit Space {editingSpace.spaceId}
              </h3>
              <button
                type="button"
                onClick={() => setEditingSpace(null)}
                className="size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleEditSpace} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Space ID</label>
                <input
                  type="text"
                  value={editingSpace.spaceId}
                  onChange={(e) =>
                    setEditingSpace({ ...editingSpace, spaceId: e.target.value })
                  }
                  className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] text-slate-900 focus:outline-none focus:border-[#064E3B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={editingSpace.type}
                    onChange={(e) =>
                      setEditingSpace({ ...editingSpace, type: e.target.value })
                    }
                    className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] bg-white text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  >
                    <option value="Standard">Standard</option>
                    <option value="SUV">SUV</option>
                    <option value="Motorbike">Motorbike</option>
                    <option value="Accessible">Accessible</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Level</label>
                  <input
                    type="text"
                    value={editingSpace.level}
                    onChange={(e) =>
                      setEditingSpace({ ...editingSpace, level: e.target.value })
                    }
                    className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Size</label>
                  <select
                    value={editingSpace.size}
                    onChange={(e) =>
                      setEditingSpace({
                        ...editingSpace,
                        size: e.target.value as ParkingSpaceItem["size"],
                      })
                    }
                    className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] bg-white text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Large">Large</option>
                    <option value="Compact">Compact</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Features</label>
                  <input
                    type="text"
                    value={editingSpace.features}
                    onChange={(e) =>
                      setEditingSpace({ ...editingSpace, features: e.target.value })
                    }
                    className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSpace(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#E5E7EB] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#064E3B] text-white font-semibold hover:bg-[#064E3B]/90"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ListingWizardShell>
  );
}
