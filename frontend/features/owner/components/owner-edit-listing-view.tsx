"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Car,
  Clock,
  ShieldCheck,
  Camera,
  Save,
  CheckCircle2,
  Check,
  Sliders,
  DollarSign,
  Plus,
  Eye,
  Info,
  ExternalLink,
  Edit,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Compass,
  Zap,
} from "lucide-react";

interface EditListingViewProps {
  propertyId: string;
}

export function OwnerEditListingView({ propertyId }: EditListingViewProps) {
  const router = useRouter();

  // Navigation anchors
  const [activeAnchor, setActiveAnchor] = useState<string>("property");

  // Section 1: Property Information
  const [propertyName, setPropertyName] = useState("Residential Building, Gulshan");
  const [propertyType, setPropertyType] = useState("Residential Building");
  const [propertyDesc, setPropertyDesc] = useState(
    "Secure covered parking inside a residential building in Gulshan with gated entry, CCTV, and guard support."
  );
  const [operatingMode, setOperatingMode] = useState("Self Managed");
  const [parkingType, setParkingType] = useState("Covered (Basement)");

  // Section 2: Location & Access
  const [areaNeighborhood, setAreaNeighborhood] = useState("Gulshan-2");
  const [streetAddress, setStreetAddress] = useState("Road 12, Block C");
  const [landmark, setLandmark] = useState("Near Gulshan Circle 2");
  const [entranceName, setEntranceName] = useState("Main Gate");
  const [gateLabel, setGateLabel] = useState("Gate 2");
  const [floorLevel, setFloorLevel] = useState("Basement B");
  const [entranceInstructions, setEntranceInstructions] = useState(
    "Enter through Gate 2 beside the main lobby and follow the ramp to Basement B."
  );

  // Section 4: Availability & Pricing (Modified state)
  const [hourlyRate, setHourlyRate] = useState(50);
  const [dailyMax, setDailyMax] = useState(400);
  const [securityDeposit, setSecurityDeposit] = useState(200);
  const [peakPricing, setPeakPricing] = useState("+20%");
  const [isPricingModified, setIsPricingModified] = useState(true);

  // Section 5: Amenities (12 toggles)
  const [amenities, setAmenities] = useState([
    { id: "covered", label: "Covered Parking", enabled: true },
    { id: "cctv", label: "CCTV Coverage", enabled: true },
    { id: "guard", label: "On-Site Guard", enabled: true },
    { id: "ev", label: "EV Charging", enabled: true },
    { id: "lighting", label: "Lighting", enabled: true },
    { id: "accessible", label: "Accessible Bay", enabled: true },
    { id: "motorbike", label: "Motorbike Spot", enabled: true },
    { id: "247", label: "24/7 Access", enabled: true },
    { id: "guard_verif", label: "Guard Verification", enabled: true },
    { id: "qr_otp", label: "QR / OTP Entry", enabled: true },
    { id: "plate_match", label: "Plate Match", enabled: true },
    { id: "controlled_gate", label: "Controlled Gate", enabled: true },
  ]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const toggleAmenity = (id: string) => {
    setAmenities((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
    showToast("Amenity toggle updated.");
  };

  const handleSave = () => {
    setIsSaving(true);
    showToast("Saving listing updates...");
    setTimeout(() => {
      setIsSaving(false);
      setIsPricingModified(false);
      showToast("Listing changes saved and published live!");
      router.push(`/owner/properties/${propertyId}`);
    }, 800);
  };

  const scrollToSection = (id: string) => {
    setActiveAnchor(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto pb-32">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-8 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-top-2 border border-slate-700">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. TOP HEADER & BREADCRUMBS                                          */}
      {/* ==================================================================== */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 font-medium">
          <Link href="/owner/properties" className="hover:text-slate-900 hover:underline">
            My Listings
          </Link>
          <span className="text-slate-300">›</span>
          <Link href={`/owner/properties/${propertyId}`} className="hover:text-slate-900 hover:underline">
            Residential Building, Gulshan
          </Link>
          <span className="text-slate-300">›</span>
          <span className="text-slate-800 font-semibold">Edit Listing</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight">
                Edit Listing
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 font-heading">
                <span className="size-1.5 rounded-full bg-emerald-600" />
                Active
              </span>
              {isPricingModified && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5 font-heading animate-pulse">
                  <span className="size-1.5 rounded-full bg-amber-600" />
                  1 Unsaved Change
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Update your parking property information, pricing, availability, spaces, amenities, and access settings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/owner/properties/${propertyId}`}
              className="px-3.5 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs font-heading"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#064E3B] text-white text-xs font-bold hover:bg-[#064E3B]/90 transition shadow-2xs font-heading cursor-pointer"
            >
              <Save className="size-3.5" />
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. STICKY HORIZONTAL ANCHOR NAVIGATION BAR                           */}
      {/* ==================================================================== */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md rounded-xl border border-[#E5E7EB] p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => scrollToSection("sec-property")}
          className={`px-3 py-2 rounded-lg text-xs font-bold font-heading flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
            activeAnchor === "property"
              ? "bg-[#064E3B] text-white shadow-2xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Building2 className="size-3.5" />
          <span>Property</span>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection("sec-location")}
          className={`px-3 py-2 rounded-lg text-xs font-bold font-heading flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
            activeAnchor === "location"
              ? "bg-[#064E3B] text-white shadow-2xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <MapPin className="size-3.5" />
          <span>Location</span>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection("sec-spaces")}
          className={`px-3 py-2 rounded-lg text-xs font-bold font-heading flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
            activeAnchor === "spaces"
              ? "bg-[#064E3B] text-white shadow-2xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Car className="size-3.5" />
          <span>Parking Spaces</span>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection("sec-pricing")}
          className={`px-3 py-2 rounded-lg text-xs font-bold font-heading flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
            activeAnchor === "pricing"
              ? "bg-[#064E3B] text-white shadow-2xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Clock className="size-3.5" />
          <span>Availability & Pricing</span>
          {isPricingModified && <span className="size-1.5 rounded-full bg-amber-500" />}
        </button>

        <button
          type="button"
          onClick={() => scrollToSection("sec-amenities")}
          className={`px-3 py-2 rounded-lg text-xs font-bold font-heading flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
            activeAnchor === "amenities"
              ? "bg-[#064E3B] text-white shadow-2xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <ShieldCheck className="size-3.5" />
          <span>Amenities & Security</span>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection("sec-photos")}
          className={`px-3 py-2 rounded-lg text-xs font-bold font-heading flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
            activeAnchor === "photos"
              ? "bg-[#064E3B] text-white shadow-2xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Camera className="size-3.5" />
          <span>Photos</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 3. MAIN WORKSPACE 2-COLUMN GRID (LEFT FORMS, RIGHT SIDEBAR)          */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* ------------------------------------------------------------------ */}
        {/* LEFT COLUMN: EDIT SECTIONS 1 TO 6                                  */}
        {/* ------------------------------------------------------------------ */}
        <div className="space-y-6">
          {/* SECTION 1: PROPERTY INFORMATION */}
          <section id="sec-property" className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4 scroll-mt-28">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2.5">
                <span className="size-6 rounded-md bg-emerald-100 text-[#064E3B] font-bold text-xs flex items-center justify-center font-heading">
                  1
                </span>
                <h2 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                  Property Information
                </h2>
              </div>
              <button
                type="button"
                onClick={() => showToast("Property information section saved.")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-xs font-bold text-slate-700 font-heading"
              >
                <Save className="size-3" />
                Save Section
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-heading">
                  Property Name
                </label>
                <input
                  type="text"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-[#064E3B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-heading">
                  Property Type
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-[#064E3B]"
                >
                  <option value="Residential Building">Residential Building</option>
                  <option value="Commercial Complex">Commercial Complex</option>
                  <option value="Mixed-Use Building">Mixed-Use Building</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 font-heading">
                Property Description
              </label>
              <textarea
                rows={3}
                value={propertyDesc}
                onChange={(e) => setPropertyDesc(e.target.value)}
                className="w-full p-3 rounded-lg border border-[#E5E7EB] text-xs leading-relaxed text-slate-800 bg-white focus:outline-none focus:border-[#064E3B]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-heading">
                  Operating Mode
                </label>
                <select
                  value={operatingMode}
                  onChange={(e) => setOperatingMode(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-[#064E3B]"
                >
                  <option value="Self Managed">Self Managed</option>
                  <option value="Full Service Managed">Full Service Managed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-heading">
                  Parking Type
                </label>
                <select
                  value={parkingType}
                  onChange={(e) => setParkingType(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-[#064E3B]"
                >
                  <option value="Covered (Basement)">Covered (Basement)</option>
                  <option value="Covered (Ground)">Covered (Ground)</option>
                  <option value="Open Air">Open Air</option>
                </select>
              </div>
            </div>
          </section>

          {/* SECTION 2: LOCATION & ACCESS */}
          <section id="sec-location" className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4 scroll-mt-28">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2.5">
                <span className="size-6 rounded-md bg-emerald-100 text-[#064E3B] font-bold text-xs flex items-center justify-center font-heading">
                  2
                </span>
                <h2 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                  Location & Access
                </h2>
              </div>
              <button
                type="button"
                onClick={() => showToast("Opening interactive map pin selector...")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-xs font-bold text-slate-700 font-heading cursor-pointer"
              >
                <Compass className="size-3" />
                Edit Map Pin
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-heading">
                  Area / Neighborhood
                </label>
                <input
                  type="text"
                  value={areaNeighborhood}
                  onChange={(e) => setAreaNeighborhood(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-[#064E3B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-heading">
                  Street Address
                </label>
                <input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-[#064E3B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-heading">
                  Landmark
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-[#064E3B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-heading">
                  Entrance Name
                </label>
                <input
                  type="text"
                  value={entranceName}
                  onChange={(e) => setEntranceName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-[#064E3B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-heading">
                  Gate Label
                </label>
                <input
                  type="text"
                  value={gateLabel}
                  onChange={(e) => setGateLabel(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-[#064E3B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-heading">
                  Floor / Level
                </label>
                <input
                  type="text"
                  value={floorLevel}
                  onChange={(e) => setFloorLevel(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-[#064E3B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-heading">
                  Entrance Instructions
                </label>
                <input
                  type="text"
                  value={entranceInstructions}
                  onChange={(e) => setEntranceInstructions(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-[#064E3B]"
                />
              </div>

              {/* Map Pin Block */}
              <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-emerald-100 text-[#064E3B] flex items-center justify-center">
                    <MapPin className="size-4" />
                  </div>
                  <div>
                    <span className="font-heading font-bold text-xs text-slate-900 block">Map Pin Set</span>
                    <span className="text-[10px] text-slate-500 font-mono">23.7937° N, 90.4136° E</span>
                  </div>
                </div>
                <ExternalLink className="size-3.5 text-slate-400" />
              </div>
            </div>
          </section>

          {/* SECTION 3: PARKING SPACES */}
          <section id="sec-spaces" className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4 scroll-mt-28">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#E5E7EB] gap-3">
              <div className="flex items-center gap-2.5">
                <span className="size-6 rounded-md bg-emerald-100 text-[#064E3B] font-bold text-xs flex items-center justify-center font-heading">
                  3
                </span>
                <h2 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                  Parking Spaces
                </h2>
              </div>

              {/* Stats & Actions */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500">
                  <span>Total: <strong className="text-slate-900">8</strong></span>
                  <span>·</span>
                  <span>Reservable: <strong className="text-[#064E3B]">6</strong></span>
                  <span>·</span>
                  <span>Owner/Staff: <strong className="text-slate-900">2</strong></span>
                  <span>·</span>
                  <span>Available Now: <strong className="text-emerald-700">5</strong></span>
                </div>

                <Link
                  href="/owner/properties/new/step-3"
                  className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-xs font-bold text-slate-700 font-heading"
                >
                  Manage Spaces
                </Link>
                <button
                  type="button"
                  onClick={() => showToast("Opening space generator modal...")}
                  className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-xs font-bold text-slate-700 font-heading flex items-center gap-1"
                >
                  <Plus className="size-3" />
                  Add Space
                </button>
              </div>
            </div>

            {/* Grid of 6 Spaces */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { bay: "B-01", type: "Standard", status: "Available", occupied: false },
                { bay: "B-02", type: "SUV", status: "Available", occupied: false },
                { bay: "B-03", type: "Standard", status: "Occupied", occupied: true },
                { bay: "B-04", type: "EV Spot", status: "Available", occupied: false },
                { bay: "B-05", type: "Motorbike", status: "Available", occupied: false },
                { bay: "B-06", type: "Accessible", status: "Available", occupied: false },
              ].map((s) => (
                <div
                  key={s.bay}
                  className={`p-3 rounded-xl border text-center ${
                    s.occupied
                      ? "border-blue-300 bg-blue-50/50"
                      : "border-[#E5E7EB] bg-white"
                  }`}
                >
                  <span className="font-heading font-extrabold text-sm text-slate-900 block">{s.bay}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{s.type}</span>
                  <span
                    className={`mt-2 inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      s.occupied ? "bg-blue-100 text-blue-800" : "bg-emerald-50 text-emerald-800"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 4: AVAILABILITY & PRICING */}
          <section id="sec-pricing" className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4 scroll-mt-28">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2.5">
                <span className="size-6 rounded-md bg-emerald-100 text-[#064E3B] font-bold text-xs flex items-center justify-center font-heading">
                  4
                </span>
                <h2 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                  Availability & Pricing
                </h2>
                {isPricingModified && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    ● Modified
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/owner/properties/new/step-4"
                  className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-xs font-bold text-slate-700 font-heading"
                >
                  Edit Schedule
                </Link>
                <Link
                  href="/owner/properties/new/step-4"
                  className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-xs font-bold text-slate-700 font-heading"
                >
                  Edit Pricing
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-heading">
                  Base Hourly Rate
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">৳</span>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => {
                      setHourlyRate(Number(e.target.value));
                      setIsPricingModified(true);
                    }}
                    className="w-full h-10 pl-7 pr-3 rounded-lg border-2 border-amber-400 bg-amber-50/20 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  />
                </div>
                <span className="text-[10px] text-amber-700 font-semibold block mt-1">Per vehicle/hour</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-heading">
                  Daily Maximum
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">৳</span>
                  <input
                    type="number"
                    value={dailyMax}
                    onChange={(e) => setDailyMax(Number(e.target.value))}
                    className="w-full h-10 pl-7 pr-3 rounded-lg border border-[#E5E7EB] text-xs font-bold text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-medium block mt-1">Cap for 24h</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-heading">
                  Security Deposit
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">৳</span>
                  <input
                    type="number"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                    className="w-full h-10 pl-7 pr-3 rounded-lg border border-[#E5E7EB] text-xs font-bold text-slate-900 focus:outline-none focus:border-[#064E3B]"
                  />
                </div>
                <span className="text-[10px] text-emerald-700 font-medium block mt-1">Auto-refunded</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-heading">
                  Peak Pricing
                </label>
                <div className="h-10 px-3 rounded-lg border border-[#E5E7EB] bg-slate-50 flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-800">Enabled</span>
                  <span className="font-bold text-[#064E3B]">{peakPricing}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium block mt-1">15 min grace period</span>
              </div>
            </div>
          </section>

          {/* SECTION 5: AMENITIES & SECURITY */}
          <section id="sec-amenities" className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4 scroll-mt-28">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2.5">
                <span className="size-6 rounded-md bg-emerald-100 text-[#064E3B] font-bold text-xs flex items-center justify-center font-heading">
                  5
                </span>
                <h2 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                  Amenities & Security Features
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500 font-heading">
                All 12 Features Enabled
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {amenities.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleAmenity(item.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between transition cursor-pointer select-none ${
                    item.enabled
                      ? "border-[#E5E7EB] bg-white hover:border-emerald-300"
                      : "border-dashed border-[#E5E7EB] bg-slate-50/50 opacity-60"
                  }`}
                >
                  <span className="text-xs font-bold text-slate-800 font-heading truncate pr-2">
                    {item.label}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.enabled ? "bg-[#064E3B] text-white" : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {item.enabled ? "ON" : "OFF"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 6: LISTING PHOTOS */}
          <section id="sec-photos" className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4 scroll-mt-28">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2.5">
                <span className="size-6 rounded-md bg-emerald-100 text-[#064E3B] font-bold text-xs flex items-center justify-center font-heading">
                  6
                </span>
                <h2 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                  Listing Photos
                </h2>
                <span className="text-xs text-slate-400">6 Uploaded Photos</span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/owner/properties/new/step-6"
                  className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-xs font-bold text-slate-700 font-heading"
                >
                  Manage Photos
                </Link>
                <Link
                  href="/owner/properties/new/step-6"
                  className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-xs font-bold text-slate-700 font-heading flex items-center gap-1"
                >
                  <Sparkles className="size-3" />
                  Change Cover Photo
                </Link>
              </div>
            </div>

            {/* 6 Photo Thumbnails */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { src: "/assets/parking-hero-bay.jpg", label: "Cover" },
                { src: "/assets/garage-entrance.jpg", label: "Entrance" },
                { src: "/assets/safety-garage.jpg", label: "Basement B" },
                { src: "/assets/parking-ev-charger.jpg", label: "Bay B-04" },
                { src: "/assets/auth-gate.jpg", label: "Ramp Entry" },
                { src: "/assets/parking-guard-booth.jpg", label: "Guard Point" },
              ].map((p, idx) => (
                <div key={idx} className="relative h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
                  <Image src={p.src} alt={p.label} fill className="object-cover group-hover:scale-105 transition duration-200" />
                  <span className={`absolute bottom-1 left-1 px-1.5 py-0.2 rounded text-[9px] font-bold ${
                    idx === 0 ? "bg-[#064E3B] text-white" : "bg-black/60 text-white backdrop-blur-xs"
                  }`}>
                    {p.label}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* RIGHT 360px SIDEBAR: STATUS, UNSAVED CHANGES, PREVIEW, INFO        */}
        {/* ------------------------------------------------------------------ */}
        <aside className="space-y-4">
          {/* CARD 1: LISTING STATUS */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                Listing Status
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 font-heading">
                <span className="size-1.5 rounded-full bg-emerald-600" />
                Healthy
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Visibility:</span>
                <span className="font-bold text-slate-900 font-heading">Public & Searchable</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Bookings:</span>
                <span className="font-bold text-[#064E3B] font-heading">Accepting Bookings</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Pricing Mode:</span>
                <span className="font-medium text-slate-800 font-heading">Configured (৳ 50/hr)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Guard Coverage:</span>
                <span className="font-bold text-emerald-700 font-heading">Active Shift</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Payment Setup:</span>
                <span className="font-bold text-emerald-700 font-heading">Ready (bKash/Bank)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Photos:</span>
                <span className="font-medium text-slate-800">6 Uploaded</span>
              </div>
            </div>
          </div>

          {/* CARD 2: UNSAVED CHANGES (STICKY CARD) */}
          <div className="bg-amber-50/60 rounded-xl border border-amber-200 p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="size-3.5 text-amber-700" />
                <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-amber-900">
                  Unsaved Changes
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                1 Modified
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Property Information:</span>
                <span className="text-slate-400">No Changes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Location & Access:</span>
                <span className="text-slate-400">No Changes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Parking Spaces:</span>
                <span className="text-slate-400">No Changes</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-amber-900 font-heading">Pricing:</span>
                <span className="font-bold text-amber-800 font-heading flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-amber-600" />
                  Modified [৳ {hourlyRate}/hr]
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Amenities:</span>
                <span className="text-slate-400">No Changes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Photos:</span>
                <span className="text-slate-400">No Changes</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => scrollToSection("sec-pricing")}
              className="w-full py-2 rounded-lg border border-amber-300 bg-white hover:bg-amber-100/50 text-xs font-bold text-amber-900 transition font-heading cursor-pointer"
            >
              Review Changes
            </button>
          </div>

          {/* CARD 3: DRIVER PREVIEW */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                Driver Preview
              </h3>
              <span className="text-[10px] text-slate-400">Live Search View</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
              <div className="relative h-32 w-full">
                <Image src="/assets/parking-hero-bay.jpg" alt="Driver Card" fill className="object-cover" />
                <span className="absolute bottom-2 left-2 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded font-heading">
                  ৳ {hourlyRate} / hr
                </span>
              </div>
              <div className="p-3 space-y-1">
                <h4 className="font-heading font-bold text-xs text-slate-900">
                  Residential Building, Gulshan
                </h4>
                <p className="text-[11px] text-slate-500">Road 12, Gulshan-2, Dhaka</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {["Covered", "CCTV", "Guard", "EV"].map((p) => (
                    <span key={p} className="px-1.5 py-0.2 rounded text-[9px] bg-white border border-slate-200 text-slate-600 font-medium">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="w-full py-1.5 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Preview Public Listing
            </button>
          </div>

          {/* CARD 4: PUBLISHING CHANGES INFO */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2.5">
            <Info className="size-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 block font-heading">Publishing Changes</strong>
              Saved changes will update the public listing immediately unless the listing is paused.
            </div>
          </div>
        </aside>
      </div>

      {/* ==================================================================== */}
      {/* 4. STICKY BOTTOM ACTION BAR                                          */}
      {/* ==================================================================== */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] px-4 sm:px-8 flex items-center justify-between z-40 shadow-lg lg:pl-72">
        <Link
          href={`/owner/properties/${propertyId}`}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 font-heading"
        >
          Cancel
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition font-heading cursor-pointer"
          >
            <Eye className="size-3.5" />
            <span>Preview Changes</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-[#064E3B] text-white text-xs font-bold hover:bg-[#064E3B]/90 transition shadow-sm font-heading cursor-pointer"
          >
            <Check className="size-4 stroke-[3]" />
            <span>{isSaving ? "Saving Updates..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] max-w-lg w-full p-6 space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-heading font-bold text-sm text-slate-900">
                Driver Public Listing View
              </h3>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="relative h-44 w-full rounded-xl overflow-hidden bg-slate-100">
              <Image src="/assets/parking-hero-bay.jpg" alt="Preview" fill className="object-cover" />
              <span className="absolute bottom-2 left-2 bg-black/80 text-white font-bold text-xs px-2.5 py-1 rounded font-heading">
                ৳ {hourlyRate} / hr
              </span>
            </div>

            <div>
              <h4 className="font-heading font-bold text-sm text-slate-900">
                {propertyName}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">{streetAddress}, {areaNeighborhood}, Dhaka</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Hourly Rate:</span>
                <span className="font-bold text-[#064E3B]">৳ {hourlyRate} / hour</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Daily Cap:</span>
                <span className="font-bold text-slate-900">৳ {dailyMax}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Peak Surcharge:</span>
                <span className="font-bold text-emerald-700">{peakPricing}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-lg bg-[#064E3B] text-white text-xs font-bold hover:bg-[#064E3B]/90 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
