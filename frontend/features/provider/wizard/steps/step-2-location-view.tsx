"use client";

import React, { useState } from "react";
import {
  MapPin,
  CheckCircle2,
  Navigation,
  Crosshair,
  Building,
  Info,
  Eye,
  Sliders,
  Lightbulb,
  Compass,
  Check,
} from "lucide-react";
import { ListingWizardShell } from "../listing-wizard-shell";

export function Step2LocationView() {
  // Form State
  const [division, setDivision] = useState("Dhaka");
  const [city, setCity] = useState("Dhaka");
  const [area, setArea] = useState("Gulshan-2");
  const [streetAddress, setStreetAddress] = useState("Road 12, Block C");
  const [buildingName, setBuildingName] = useState("Residential Building, Gulshan");
  const [postalCode, setPostalCode] = useState("1212");
  const [landmark, setLandmark] = useState("Near Gulshan Circle 2");

  // Entrance Details
  const [entranceName, setEntranceName] = useState("Main Gate");
  const [accessPointType, setAccessPointType] = useState("Main Gate");
  const [gateLabel, setGateLabel] = useState("Gate 2");
  const [floorLevel, setFloorLevel] = useState("Basement B");
  const [instructions, setInstructions] = useState(
    "Enter through Gate 2 beside the main building lobby. Follow the basement ramp to Level B where the on-site guard will scan your booking QR pass."
  );

  // Pin coordinates
  const [coords, setCoords] = useState({ lat: "23.7925° N", lng: "90.4078° E" });
  const [pinPosition, setPinPosition] = useState({ x: 52, y: 48 });

  const handleRecenter = () => {
    setPinPosition({ x: 52, y: 48 });
  };

  const handleUseCurrent = () => {
    setCoords({ lat: "23.7928° N", lng: "90.4075° E" });
    setPinPosition({ x: 50, y: 46 });
  };

  return (
    <ListingWizardShell
      currentStep={2}
      stepTitle="Add Parking Space"
      stepSubtitle="Set the exact location drivers will use to find and enter your property."
      nextStepTitle="Parking Spaces"
      nextStepPath="/provider/properties/new/step-3"
      prevStepPath="/provider/properties"
      progressPercentage={29}
    >
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
        {/* ================================================================== */}
        {/* MAIN FORM AREA (LEFT COLUMN)                                       */}
        {/* ================================================================== */}
        <div className="space-y-6">
          {/* 1. PROPERTY ADDRESS CARD */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold font-heading text-xs sm:text-sm">
                <MapPin className="size-4 text-[#064E3B]" />
                <span className="uppercase tracking-wider">PROPERTY ADDRESS</span>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Gulshan-2, Dhaka North
              </span>
            </div>

            {/* Inputs Grid */}
            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Division
                  </label>
                  <input
                    type="text"
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] bg-[#fcfcfd] text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] bg-[#fcfcfd] text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Area / Neighborhood *
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] bg-[#fcfcfd] text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] bg-[#fcfcfd] text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Building / Property
                  </label>
                  <input
                    type="text"
                    value={buildingName}
                    onChange={(e) => setBuildingName(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] bg-[#fcfcfd] text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] bg-[#fcfcfd] text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Landmark
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] bg-[#fcfcfd] text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                <Info className="size-3.5 text-slate-400 shrink-0" />
                <span>Use the exact address drivers should follow when navigating to your parking location.</span>
              </div>
            </div>
          </div>

          {/* 2. PIN YOUR PARKING LOCATION CARD */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold font-heading text-xs sm:text-sm">
                <Compass className="size-4 text-[#064E3B]" />
                <span className="uppercase tracking-wider">PIN YOUR PARKING LOCATION</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUseCurrent}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-[11px] font-semibold text-slate-700 transition cursor-pointer"
                >
                  <Crosshair className="size-3 text-[#064E3B]" />
                  <span>Use Current</span>
                </button>
                <button
                  type="button"
                  onClick={handleRecenter}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-[11px] font-semibold text-slate-700 transition cursor-pointer"
                >
                  <Navigation className="size-3 text-[#064E3B]" />
                  <span>Recenter</span>
                </button>
              </div>
            </div>

            {/* Interactive Mock Map Canvas */}
            <div className="relative h-64 sm:h-72 w-full rounded-xl overflow-hidden border border-slate-200 bg-[#e6eef5] shadow-inner select-none cursor-crosshair">
              {/* Map grid streets svg background */}
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                {/* Major avenues */}
                <line x1="0" y1="120" x2="100%" y2="120" stroke="#cbd5e1" strokeWidth="20" />
                <line x1="160" y1="0" x2="160" y2="100%" stroke="#cbd5e1" strokeWidth="22" />
                <line x1="380" y1="0" x2="380" y2="100%" stroke="#cbd5e1" strokeWidth="18" />
                <line x1="0" y1="210" x2="100%" y2="210" stroke="#cbd5e1" strokeWidth="16" />

                {/* Road centerlines */}
                <line x1="0" y1="120" x2="100%" y2="120" stroke="#ffffff" strokeWidth="2" strokeDasharray="6 6" />
                <line x1="160" y1="0" x2="160" y2="100%" stroke="#ffffff" strokeWidth="2" strokeDasharray="6 6" />

                {/* Building blocks */}
                <rect x="25" y="20" width="115" height="85" rx="6" fill="#d9e2ec" />
                <rect x="180" y="20" width="180" height="85" rx="6" fill="#d9e2ec" />
                <rect x="400" y="20" width="180" height="85" rx="6" fill="#d9e2ec" />
                <rect x="25" y="145" width="115" height="50" rx="6" fill="#d9e2ec" />
                <rect x="180" y="145" width="180" height="50" rx="6" fill="#cbd5e1" />
                <rect x="400" y="145" width="180" height="50" rx="6" fill="#d9e2ec" />
              </svg>

              {/* Road names */}
              <span className="absolute left-8 top-[113px] text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Road 12
              </span>
              <span className="absolute left-[175px] top-[148px] text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                Gulshan-2 Circle
              </span>
              <span className="absolute left-[410px] top-[152px] text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Block C
              </span>

              {/* Circle intersection node */}
              <div className="absolute left-[150px] top-[110px] size-5 rounded-full bg-slate-400/80 border-2 border-white flex items-center justify-center pointer-events-none" />

              {/* Green Pin Marker */}
              <div
                style={{ left: `${pinPosition.x}%`, top: `${pinPosition.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center cursor-pointer transition-all hover:scale-105 group"
                onClick={() => setPinPosition({ x: 52, y: 48 })}
              >
                <div className="px-2.5 py-1 rounded-full bg-[#064E3B] text-white text-[10px] font-bold shadow-md flex items-center gap-1.5 whitespace-nowrap">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Entrance Gate 2</span>
                </div>
                <div className="size-3.5 rotate-45 bg-[#064E3B] -mt-1.5 shadow-sm" />
                <div className="size-2 rounded-full bg-emerald-900/60 blur-[1px] mt-0.5" />
              </div>

              {/* Floating Coordinate Bar at bottom */}
              <div className="absolute bottom-3 left-3 right-3 sm:right-auto bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-xl p-2.5 shadow-md flex items-center gap-3 text-xs">
                <span className="text-slate-700 font-mono font-semibold">
                  Entrance Pin: <strong className="text-slate-900">{coords.lat}, {coords.lng}</strong>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200 flex items-center gap-1">
                  <Check className="size-3 text-emerald-600" />
                  Entrance Aligned
                </span>
              </div>
            </div>

            {/* Subtext info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-1 pt-1">
              <span className="italic">
                *Drag the pin to the exact parking entrance location, not the property center.*
              </span>
              <span className="font-semibold text-slate-600">
                Auto-verified against Dhaka GIS
              </span>
            </div>
          </div>

          {/* 3. DRIVER ENTRANCE DETAILS CARD */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold font-heading text-xs sm:text-sm">
                <Building className="size-4 text-[#064E3B]" />
                <span className="uppercase tracking-wider">DRIVER ENTRANCE DETAILS</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Gate & Level Specified
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Entrance Name *
                  </label>
                  <input
                    type="text"
                    value={entranceName}
                    onChange={(e) => setEntranceName(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] bg-[#fcfcfd] text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Access Point Type
                  </label>
                  <input
                    type="text"
                    value={accessPointType}
                    onChange={(e) => setAccessPointType(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] bg-[#fcfcfd] text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Gate Label
                  </label>
                  <input
                    type="text"
                    value={gateLabel}
                    onChange={(e) => setGateLabel(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] bg-[#fcfcfd] text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Floor / Level
                  </label>
                  <input
                    type="text"
                    value={floorLevel}
                    onChange={(e) => setFloorLevel(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-lg border border-[#E5E7EB] bg-[#fcfcfd] text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Entrance Instructions for Driver *
                </label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E5E7EB] bg-[#fcfcfd] text-xs text-slate-900 leading-relaxed focus:outline-none focus:border-[#064E3B]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* RIGHT SIDEBAR (TIPS & PROGRESS - 320PX)                            */}
        {/* ================================================================== */}
        <div className="space-y-5">
          {/* 1. LOCATION VERIFICATION */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold font-heading text-slate-900">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>LOCATION VERIFICATION</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Location Ready
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-700">
              <div className="flex items-center gap-1.5">
                <Check className="size-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                <span className="text-[11px]">Street address entered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="size-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                <span className="text-[11px]">Map pin selected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="size-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                <span className="text-[11px]">Entrance specified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="size-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                <span className="text-[11px]">Area confirmed</span>
              </div>
            </div>
          </div>

          {/* 2. DRIVER LOCATION PREVIEW */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold font-heading text-slate-900">
                <Eye className="size-4 text-[#064E3B]" />
                <span>DRIVER LOCATION PREVIEW</span>
              </div>
              <button
                type="button"
                onClick={() => alert("Previewing full driver navigation mockup...")}
                className="text-[11px] font-semibold text-[#064E3B] hover:underline"
              >
                Preview on Map
              </button>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-[#fcfcfd] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 font-heading">
                  {buildingName}
                </h4>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                  Covered
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {streetAddress}, {area}, Dhaka {postalCode}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Landmark:</span>
                  <strong className="text-slate-800">{landmark}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Entrance:</span>
                  <strong className="text-slate-800">{gateLabel} • {floorLevel}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* 3. LISTING PROGRESS */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold font-heading text-slate-900">
                <Sliders className="size-4 text-[#064E3B]" />
                <span>LISTING PROGRESS</span>
              </div>
              <span className="text-xs font-bold text-[#064E3B] font-heading">
                29% Complete
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-800 font-medium">
                <Check className="size-3.5 text-emerald-600 stroke-[3]" />
                <span>Property Details</span>
                <span className="text-[10px] text-emerald-700 font-bold ml-auto">Completed</span>
              </div>

              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <span className="size-2 rounded-full bg-emerald-600" />
                <span>Location & Pin</span>
                <span className="text-[10px] text-slate-500 font-semibold ml-auto">In Progress</span>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <span className="size-1.5 rounded-full bg-slate-300" />
                <span>Parking Spaces (Slots & Sizes)</span>
                <span className="text-[10px] ml-auto">Pending</span>
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

          {/* 4. TIPS FOR ACCURATE LOCATION */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold font-heading text-slate-900 border-b border-slate-100 pb-2.5">
              <Lightbulb className="size-4 text-amber-500" />
              <span>TIPS FOR ACCURATE LOCATION</span>
            </div>

            <ul className="space-y-2 text-[11px] text-slate-600 leading-relaxed">
              <li>
                <strong className="text-slate-900">• Exact Map Pin:</strong> Place the pin at the actual parking entrance gate.
              </li>
              <li>
                <strong className="text-slate-900">• Clear Landmark:</strong> Add a nearby recognizable spot (e.g. Circle 2).
              </li>
              <li>
                <strong className="text-slate-900">• Entrance Instructions:</strong> Clarify ramp directions or gate number.
              </li>
              <li>
                <strong className="text-slate-900">• Avoid Confusion:</strong> Do not pin property center if entrance is on a side road.
              </li>
            </ul>
          </div>

          {/* Draft Saved Real-Time Tag */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Draft Saved: Preserved in real time.</span>
            </div>
            <span className="text-slate-400">Just now</span>
          </div>
        </div>
      </div>
    </ListingWizardShell>
  );
}
