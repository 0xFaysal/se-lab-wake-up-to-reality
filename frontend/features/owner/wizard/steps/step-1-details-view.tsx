"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";
import { ListingWizardShell } from "../listing-wizard-shell";

export function Step1DetailsView() {
  const router = useRouter();
  const [propertyTitle, setPropertyTitle] = useState("Residential Building, Gulshan");
  const [propertyCategory, setPropertyCategory] = useState("Residential Building");
  const [facilityStructure, setFacilityStructure] = useState("Basement Garage");
  const [parkingLevels, setParkingLevels] = useState("Basement B (Level -1)");
  const [city, setCity] = useState("Dhaka");
  const [areaZone, setAreaZone] = useState("Gulshan-2");
  const [landmark, setLandmark] = useState("Near Gulshan Circle 2");
  const [description, setDescription] = useState(
    "Secure underground parking in Gulshan-2 with 24/7 security guard, wide two-way ramp access, well-lit bays, and elevator access to the main lobby."
  );
  const [ownershipType, setOwnershipType] = useState("Individual Owner");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleNext = () => {
    if (!propertyTitle.trim()) {
      showToast("Please enter a property title.");
      return;
    }
    router.push("/owner/properties/new/step-2");
  };

  return (
    <ListingWizardShell
      currentStep={1}
      stepTitle="Add Parking Space"
      stepSubtitle="Enter the basic information and identity of your parking facility."
      nextStepTitle="Location"
      nextStepPath="/owner/properties/new/step-2"
      prevStepPath="/owner/properties"
      progressPercentage={14}
      onNext={handleNext}
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
        {/* LEFT COLUMN: PROPERTY DETAILS FORM                                */}
        {/* ================================================================= */}
        <div className="space-y-6">
          {/* HEADER ROW */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs">
            <div>
              <h2 className="font-heading font-extrabold text-base text-slate-900">
                Property Details & Identification
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Provide the listing name and physical facility configuration for drivers.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 font-heading">
              <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
              Step 1 of 7
            </span>
          </div>

          {/* SECTION 1: BASIC IDENTIFICATION */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E5E7EB]">
              <Building2 className="size-4 text-[#064E3B]" />
              <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                Property Identification
              </h3>
            </div>

            {/* Property Title Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 font-heading">
                Listing Title / Building Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={propertyTitle}
                onChange={(e) => setPropertyTitle(e.target.value)}
                placeholder="e.g. Residential Building, Gulshan or Concord Tower Parking"
                className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
              />
              <p className="text-[11px] text-slate-400 mt-1 font-medium">
                Use a recognizable name that drivers can spot easily upon arrival.
              </p>
            </div>

            {/* Category & Structure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-heading">
                  Property Category
                </label>
                <select
                  value={propertyCategory}
                  onChange={(e) => setPropertyCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-[#064E3B]"
                >
                  <option value="Residential Building">Residential Building</option>
                  <option value="Commercial Complex">Commercial Complex</option>
                  <option value="Shopping Mall / Retail">Shopping Mall / Retail</option>
                  <option value="Mixed-Use Building">Mixed-Use Building</option>
                  <option value="Private Plot / Open Lot">Private Plot / Open Lot</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-heading">
                  Facility Structure
                </label>
                <select
                  value={facilityStructure}
                  onChange={(e) => setFacilityStructure(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-[#064E3B]"
                >
                  <option value="Basement Garage">Basement Garage (Underground)</option>
                  <option value="Covered Ground Level">Covered Ground Level</option>
                  <option value="Multi-Storey Garage">Multi-Storey Garage</option>
                  <option value="Open-Air Paved Lot">Open-Air Paved Lot</option>
                  <option value="Automated Mechanical">Automated Mechanical</option>
                </select>
              </div>
            </div>

            {/* Parking Levels */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 font-heading">
                Parking Floors / Levels Available
              </label>
              <input
                type="text"
                value={parkingLevels}
                onChange={(e) => setParkingLevels(e.target.value)}
                placeholder="e.g. Basement B (Level -1) or Ground Floor Bays 1-10"
                className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-[#064E3B]"
              />
            </div>
          </div>

          {/* SECTION 2: AREA & LANDMARK CONTEXT */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E5E7EB]">
              <MapPin className="size-4 text-[#064E3B]" />
              <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                City & Neighborhood Zone
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-heading">
                  Metropolitan City
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-[#064E3B]"
                >
                  <option value="Dhaka">Dhaka</option>
                  <option value="Chittagong">Chittagong</option>
                  <option value="Sylhet">Sylhet</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-heading">
                  Primary Zone / Thana
                </label>
                <select
                  value={areaZone}
                  onChange={(e) => setAreaZone(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-[#064E3B]"
                >
                  <option value="Gulshan-2">Gulshan-2</option>
                  <option value="Gulshan-1">Gulshan-1</option>
                  <option value="Banani">Banani</option>
                  <option value="Dhanmondi">Dhanmondi</option>
                  <option value="Motijheel">Motijheel</option>
                  <option value="Uttara">Uttara</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 font-heading">
                Notable Landmark Nearby
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Near Gulshan Circle 2 or Opposite Westin Hotel"
                className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-[#064E3B]"
              />
            </div>
          </div>

          {/* SECTION 3: DESCRIPTION & OWNERSHIP */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-[#064E3B]" />
                <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                  Property Overview & Description
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {description.length} / 400
              </span>
            </div>

            <textarea
              rows={4}
              value={description}
              maxLength={400}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl border border-[#E5E7EB] text-xs leading-relaxed text-slate-800 bg-white focus:outline-none focus:border-[#064E3B] resize-none"
              placeholder="Highlight garage entrance accessibility, ramp slope, security standards, and surroundings..."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-heading">
                  Ownership & Management Type
                </label>
                <select
                  value={ownershipType}
                  onChange={(e) => setOwnershipType(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-[#064E3B]"
                >
                  <option value="Individual Owner">Individual Property Owner</option>
                  <option value="Building Management Committee">Building Management Committee</option>
                  <option value="Commercial Operator">Commercial Parking Operator</option>
                  <option value="Corporate Facility">Corporate Facility</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <ShieldCheck className="size-6 text-[#064E3B] shrink-0" />
                <div className="text-[11px] text-slate-600 leading-snug">
                  <strong className="text-slate-900 block font-heading">Verified Host Program</strong>
                  Holdings and utility bills will be verified during Step 7 review.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT SIDEBAR (320px): SUMMARY, PROGRESS, TIPS                    */}
        {/* ================================================================= */}
        <aside className="space-y-4">
          {/* CARD 1: LISTING PROGRESS 14% */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                Listing Progress
              </span>
              <span className="font-heading font-extrabold text-xs text-[#064E3B]">
                14%
              </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-[#064E3B] rounded-full" style={{ width: "14%" }} />
            </div>

            <ul className="space-y-2 text-xs pt-1">
              <li className="flex items-center justify-between text-[#064E3B] font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-[#064E3B]" />
                  1. Property Details
                </span>
                <span className="text-[11px] font-bold text-[#064E3B] font-heading">In Progress</span>
              </li>
              <li className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-slate-300" />
                  2. Location
                </span>
                <span className="text-[11px] font-medium font-heading">Pending</span>
              </li>
              <li className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-slate-300" />
                  3. Parking Spaces
                </span>
                <span className="text-[11px] font-medium font-heading">Pending</span>
              </li>
              <li className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-slate-300" />
                  4. Availability & Pricing
                </span>
                <span className="text-[11px] font-medium font-heading">Pending</span>
              </li>
              <li className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-slate-300" />
                  5. Amenities & Security
                </span>
                <span className="text-[11px] font-medium font-heading">Pending</span>
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

          {/* CARD 2: PROPERTY IDENTITY SNAPSHOT */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                Profile Snapshot
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Draft
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="font-bold text-slate-900 font-heading">{propertyCategory}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Structure:</span>
                <span className="font-medium text-slate-800">{facilityStructure}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Zone:</span>
                <span className="font-medium text-slate-800">{areaZone}, {city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ownership:</span>
                <span className="font-medium text-slate-800">{ownershipType}</span>
              </div>
            </div>
          </div>

          {/* CARD 3: SETUP TIPS */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-2.5">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E5E7EB]">
              <Lightbulb className="size-4 text-amber-500" />
              <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                Naming Tips
              </h3>
            </div>
            <div className="space-y-2 text-[11px] text-slate-600 leading-relaxed">
              <p>
                <strong className="text-slate-800 block">Clear Building Name</strong>
                Drivers look for familiar building signs and road numbers when arriving.
              </p>
              <p>
                <strong className="text-slate-800 block">Accurate Structure</strong>
                Helps SUV and EV owners verify underground ramp and clearance compatibility.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </ListingWizardShell>
  );
}
