"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  UploadCloud,
  CheckCircle2,
  Check,
  Star,
  GripVertical,
  Trash2,
  RefreshCw,
  Image as ImageIcon,
  Camera,
  Layers,
  Sparkles,
  Info,
  Lightbulb,
  ExternalLink,
  Plus,
  ArrowRight,
  ArrowLeft,
  X,
} from "lucide-react";
import { ListingWizardShell } from "../listing-wizard-shell";

export interface UploadedPhoto {
  id: string;
  title: string;
  subtitle: string;
  imageSrc: string;
  isCover: boolean;
  coverageTag: "exterior" | "entrance" | "parking" | "ramp" | "security";
}

const INITIAL_PHOTOS: UploadedPhoto[] = [
  {
    id: "photo-1",
    title: "Property Exterior",
    subtitle: "Gulshan-2 Complex",
    imageSrc: "/assets/parking-hero-bay.jpg",
    isCover: true,
    coverageTag: "exterior",
  },
  {
    id: "photo-2",
    title: "Main Entrance / Gate 2",
    subtitle: "Access Point",
    imageSrc: "/assets/garage-entrance.jpg",
    isCover: false,
    coverageTag: "entrance",
  },
  {
    id: "photo-3",
    title: "Basement Parking Area",
    subtitle: "Level B Bays",
    imageSrc: "/assets/safety-garage.jpg",
    isCover: false,
    coverageTag: "parking",
  },
  {
    id: "photo-4",
    title: "Parking Space B-04",
    subtitle: "Standard / EV Bay",
    imageSrc: "/assets/parking-ev-charger.jpg",
    isCover: false,
    coverageTag: "parking",
  },
  {
    id: "photo-5",
    title: "Ramp Access",
    subtitle: "Entry Incline",
    imageSrc: "/assets/auth-gate.jpg",
    isCover: false,
    coverageTag: "ramp",
  },
  {
    id: "photo-6",
    title: "CCTV / Guard Point",
    subtitle: "24/7 Security Gate",
    imageSrc: "/assets/parking-guard-booth.jpg",
    isCover: false,
    coverageTag: "security",
  },
];

export function Step6PhotosView() {
  const [photos, setPhotos] = useState<UploadedPhoto[]>(INITIAL_PHOTOS);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSetCover = (id: string) => {
    setPhotos((prev) =>
      prev.map((p) => ({
        ...p,
        isCover: p.id === id,
      }))
    );
    const chosen = photos.find((p) => p.id === id);
    showToast(`"${chosen?.title || "Photo"}" set as primary cover photo.`);
  };

  const handleDeletePhoto = (id: string) => {
    if (photos.length <= 1) {
      showToast("At least one photo is required for listing verification.");
      return;
    }
    const deletingPhoto = photos.find((p) => p.id === id);
    const updated = photos.filter((p) => p.id !== id);

    // If deleted photo was cover, set the first available photo as new cover
    if (deletingPhoto?.isCover && updated.length > 0) {
      updated[0].isCover = true;
    }

    setPhotos(updated);
    showToast(`Photo "${deletingPhoto?.title}" removed.`);
  };

  const handleReplacePhoto = (id: string) => {
    // Cycles image to simulate replacement
    const target = photos.find((p) => p.id === id);
    if (!target) return;

    const availableReplacements = [
      "/assets/parking-hero-bay.jpg",
      "/assets/garage-entrance.jpg",
      "/assets/safety-garage.jpg",
      "/assets/parking-ev-charger.jpg",
      "/assets/parking-guard-booth.jpg",
      "/assets/auth-gate.jpg",
    ];

    const nextIndex = (availableReplacements.indexOf(target.imageSrc) + 1) % availableReplacements.length;
    const nextSrc = availableReplacements[nextIndex];

    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, imageSrc: nextSrc } : p))
    );
    showToast(`Photo "${target.title}" replaced with high-res shot.`);
  };

  const handleBrowseFilesClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFile = e.target.files[0];
      const newPhoto: UploadedPhoto = {
        id: `photo-${Date.now()}`,
        title: newFile.name.replace(/\.[^/.]+$/, ""),
        subtitle: "Uploaded Just Now",
        imageSrc: URL.createObjectURL(newFile),
        isCover: false,
        coverageTag: "parking",
      };
      setPhotos((prev) => [...prev, newPhoto]);
      showToast(`Uploaded "${newFile.name}" successfully.`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      const newPhoto: UploadedPhoto = {
        id: `photo-${Date.now()}`,
        title: droppedFile.name.replace(/\.[^/.]+$/, ""),
        subtitle: "Uploaded Just Now",
        imageSrc: URL.createObjectURL(droppedFile),
        isCover: false,
        coverageTag: "parking",
      };
      setPhotos((prev) => [...prev, newPhoto]);
      showToast(`Added "${droppedFile.name}" from drag & drop.`);
    }
  };

  const coverPhoto = photos.find((p) => p.isCover) || photos[0];

  // Requirements logic
  const hasExterior = photos.some((p) => p.coverageTag === "exterior");
  const hasEntrance = photos.some((p) => p.coverageTag === "entrance");
  const hasParking = photos.some((p) => p.coverageTag === "parking");
  const reqCount = [hasExterior, hasEntrance, hasParking].filter(Boolean).length;

  return (
    <ListingWizardShell
      currentStep={6}
      stepTitle="Add Parking Space"
      stepSubtitle="Upload clear photos that help drivers understand your parking property before arrival."
      nextStepTitle="Review & Publish (7/7)"
      nextStepPath="/owner/properties/new/step-7"
      prevStepPath="/owner/properties/new/step-5"
      progressPercentage={86}
    >
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-8 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-top-2 border border-slate-700">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Hidden file input for native file browsing */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* ================================================================= */}
        {/* LEFT COLUMN: UPLOAD ZONE, PHOTO GRID, QUALITY AUDIT               */}
        {/* ================================================================= */}
        <div className="space-y-6">
          {/* SECTION 1: TOP ROW (UPLOAD ZONE + PHOTO COVERAGE CHECKLIST) */}
          <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-4">
            {/* PROPERTY PHOTOS UPLOAD ZONE */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="size-4 text-[#064E3B]" />
                  <h2 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                    Property Photos
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">Max 10 MB/img</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Upload images of the exterior, entrance gate, parking bays, and ramp.
              </p>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleBrowseFilesClick}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-[#064E3B] bg-emerald-50/50 scale-[0.99]"
                    : "border-emerald-300/80 bg-emerald-50/20 hover:bg-emerald-50/40 hover:border-[#064E3B]"
                }`}
              >
                <div className="size-10 rounded-full bg-emerald-100 text-[#064E3B] flex items-center justify-center mb-2.5 shadow-2xs">
                  <UploadCloud className="size-5" />
                </div>
                <p className="text-xs font-semibold text-slate-800">
                  Drag & drop photos here or{" "}
                  <span className="text-[#064E3B] font-bold hover:underline">
                    Browse Files
                  </span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                  Supports JPG, PNG, WEBP · Recommended 1600 × 1200 or higher
                </p>
              </div>
            </div>

            {/* PHOTO COVERAGE CHECKLIST */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="size-4 text-[#064E3B]" />
                    <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                      Photo Coverage
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-heading">
                    {reqCount} of 3 Req.
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  Required for listing approval
                </p>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                      <Check className="size-3.5 text-emerald-600 stroke-[3]" />
                      Property Exterior
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Required
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                      <Check className="size-3.5 text-emerald-600 stroke-[3]" />
                      Entrance / Gate
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Required
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                      <Check className="size-3.5 text-emerald-600 stroke-[3]" />
                      Parking Area
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Required
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                      <Check className="size-3.5 text-emerald-600 stroke-[3]" />
                      Access Ramp
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">Recommended</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                      <Check className="size-3.5 text-emerald-600 stroke-[3]" />
                      CCTV / Security
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">Recommended</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: UPLOADED PHOTOS (GRID OF 6) */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2.5">
                <Camera className="size-4 text-[#064E3B]" />
                <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                  Uploaded Photos
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {photos.length} Uploaded
                </span>
              </div>

              <button
                type="button"
                onClick={handleBrowseFilesClick}
                className="text-xs font-bold text-[#064E3B] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="size-3.5" />
                Add More Photos
              </button>
            </div>

            <p className="text-[11px] text-slate-400 mb-4">
              Drag photos to change the order shown to drivers.
            </p>

            {/* Grid of 6 photo cards (3 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className={`rounded-xl border overflow-hidden bg-white shadow-2xs transition group flex flex-col justify-between ${
                    photo.isCover
                      ? "border-[#064E3B] ring-2 ring-[#064E3B]/20"
                      : "border-[#E5E7EB] hover:border-slate-300"
                  }`}
                >
                  {/* Photo Container */}
                  <div className="relative h-36 w-full bg-slate-100 overflow-hidden">
                    <Image
                      src={photo.imageSrc}
                      alt={photo.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Cover Star Badge */}
                    {photo.isCover ? (
                      <div className="absolute top-2.5 left-2.5 bg-[#064E3B] text-white px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-md font-heading">
                        <Star className="size-3 fill-amber-300 text-amber-300" />
                        Cover Photo
                      </div>
                    ) : null}

                    {/* Drag Handle Icon */}
                    <div className="absolute top-2.5 right-2.5 bg-black/40 hover:bg-black/60 text-white size-6 rounded flex items-center justify-center cursor-move backdrop-blur-xs transition">
                      <GripVertical className="size-3.5" />
                    </div>
                  </div>

                  {/* Photo Details & Actions */}
                  <div className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 pr-2">
                        <h4 className="font-heading font-bold text-xs text-slate-900 truncate">
                          {photo.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate">{photo.subtitle}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {photo.isCover ? (
                          <button
                            type="button"
                            onClick={() => handleReplacePhoto(photo.id)}
                            className="text-[11px] font-bold text-slate-500 hover:text-slate-800 px-1 py-0.5"
                          >
                            Replace
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetCover(photo.id)}
                            className="text-[11px] font-bold text-[#064E3B] hover:underline px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200"
                          >
                            Set Cover
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete photo"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: BOTTOM INFO ROW (COVER EXPLANATION + QUALITY CHECK) */}
          <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-4">
            {/* COVER PHOTO INFO */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs flex items-center gap-3.5">
              <div className="relative size-14 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                <Image
                  src={coverPhoto.imageSrc}
                  alt="Cover Thumbnail"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-heading font-bold text-xs text-slate-900 truncate">
                  Cover Photo: <span className="text-[#064E3B]">{coverPhoto.title}</span>
                </h4>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  This is the first image drivers will see in search results and listing details.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const nonCovers = photos.filter((p) => !p.isCover);
                    if (nonCovers.length > 0) {
                      handleSetCover(nonCovers[0].id);
                    }
                  }}
                  className="text-[11px] font-bold text-[#064E3B] hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="size-3" />
                  Change Cover Photo
                </button>
              </div>
            </div>

            {/* QUALITY CHECK */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-[#064E3B]" />
                  <span className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                    Quality Check
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Set Ready
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Check className="size-3 text-emerald-600 stroke-[3]" />
                  <span className="font-medium text-[11px]">{photos.length} Uploaded</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Check className="size-3 text-emerald-600 stroke-[3]" />
                  <span className="font-medium text-[11px]">Gate Included</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Check className="size-3 text-emerald-600 stroke-[3]" />
                  <span className="font-medium text-[11px]">Cover Selected</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Check className="size-3 text-emerald-600 stroke-[3]" />
                  <span className="font-medium text-[11px]">High Res</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT SIDEBAR (320px): PROGRESS, DRIVER PREVIEW, PHOTO TIPS       */}
        {/* ================================================================= */}
        <aside className="space-y-4">
          {/* CARD 1: LISTING PROGRESS */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                Listing Progress
              </span>
              <span className="font-heading font-extrabold text-xs text-[#064E3B]">
                86%
              </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-[#064E3B] rounded-full" style={{ width: "86%" }} />
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
                  Location & Map Pin
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
              <li className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-700" />
                  Amenities & Security
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 font-heading">Completed</span>
              </li>
              <li className="flex items-center justify-between text-[#064E3B] font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-[#064E3B]" />
                  6. Photos
                </span>
                <span className="text-[11px] font-bold text-[#064E3B] font-heading">In Progress</span>
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

          {/* CARD 2: DRIVER PREVIEW */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-2xs">
            <div className="p-3.5 border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Camera className="size-3.5 text-[#064E3B]" />
                <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                  Driver Preview
                </h3>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">Card View</span>
            </div>

            {/* Mock Card */}
            <div className="p-3 space-y-2.5">
              <div className="relative h-36 w-full rounded-lg overflow-hidden bg-slate-100">
                <Image
                  src={coverPhoto.imageSrc}
                  alt="Driver Card Preview"
                  fill
                  className="object-cover"
                />
                <div className="absolute top-2 right-2 bg-black/75 text-white font-bold text-xs px-2 py-0.5 rounded-md font-heading backdrop-blur-xs">
                  ৳ 50 / hr
                </div>
              </div>

              <div>
                <h4 className="font-heading font-bold text-xs text-slate-900 leading-tight">
                  Residential Building, Gulshan
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Road 62, Gulshan-2, Dhaka
                </p>
              </div>

              {/* Tag Pills */}
              <div className="flex flex-wrap gap-1">
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                  Covered
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                  CCTV
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                  Guard
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                  EV Support
                </span>
              </div>

              <button
                type="button"
                onClick={() => showToast("Showing simulated driver view modal.")}
                className="w-full py-1.5 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Preview Full Listing
              </button>
            </div>
          </div>

          {/* CARD 3: PHOTO TIPS */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-2.5">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E5E7EB]">
              <Lightbulb className="size-4 text-amber-500" />
              <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                Photo Tips
              </h3>
            </div>
            <div className="space-y-2 text-[11px] text-slate-600 leading-relaxed">
              <p>
                <strong className="text-slate-800 block">Bright & Clear</strong>
                Use well-lit daylight or garage lighting.
              </p>
              <p>
                <strong className="text-slate-800 block">Show the Entrance</strong>
                Drivers should easily recognize the correct gate.
              </p>
              <p>
                <strong className="text-slate-800 block">Real Parking Conditions</strong>
                Avoid misleading angles or heavily filtered images.
              </p>
              <p>
                <strong className="text-slate-800 block">No Personal Information</strong>
                Do not show faces or private license plates clearly.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </ListingWizardShell>
  );
}
