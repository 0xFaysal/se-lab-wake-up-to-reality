"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  ShieldCheck,
  Building,
  Video,
  Warehouse,
  Clock,
  Zap,
  Shield,
  Car,
  QrCode,
  Calendar,
  Lock,
  ChevronDown,
  ArrowUpRight,
  Info,
  ChevronRight,
  ArrowLeft,
  LayoutGrid,
} from "lucide-react";

import { ParkingAuthModal } from "@/components/parking/parking-auth-modal";
import { ParkingGalleryModal } from "@/components/parking/parking-gallery-modal";
import { type MockParkingSpot } from "@/lib/data/mock-parking";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import parkingHeroImg from "@/assets/parking-hero-bay.jpg";
import parkingGuardImg from "@/assets/parking-guard-booth.jpg";
import parkingEvImg from "@/assets/parking-ev-charger.jpg";

interface ParkingDetailsViewProps {
  spot: MockParkingSpot;
}

const GALLERY_IMAGES = [
  {
    src: "/assets/parking-hero-bay.jpg",
    alt: "Covered Underground Parking Bay A16 with Digital Available Indicator",
    caption: "Reserved underground parking bay with bright LED lighting and pristine flooring.",
  },
  {
    src: "/assets/parking-guard-booth.jpg",
    alt: "Gated Entrance Barrier and Security Guard Checkpoint",
    caption: "24/7 security checkpoint with automated barrier and guard verification.",
  },
  {
    src: "/assets/parking-ev-charger.jpg",
    alt: "Dedicated EV Charging Station Wallbox",
    caption: "Type-2 EV charging station available for electric and hybrid vehicles.",
  },
];

export function ParkingDetailsView({ spot }: ParkingDetailsViewProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Booking Widget State
  const [vehicle, setVehicle] = useState("Sedan (Dhaka Metro GA 12-3456)");
  const [checkInDate] = useState("Oct 27, 10:00 AM");
  const [checkOutDate] = useState("Oct 27, 4:00 PM");
  const durationHours = 6;
  const hourlyRate = spot.hourlyRate || 60;
  const baseRate = hourlyRate * durationHours;
  const serviceFee = 20;
  const vatAmount = Math.round(baseRate * 0.1);
  const totalPayable = baseRate + serviceFee + vatAmount;

  function openGalleryAt(index: number) {
    setGalleryIndex(index);
    setIsGalleryOpen(true);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* 1. Breadcrumbs Navigation */}
      <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground">
        <Link
          href="/parking"
          className="inline-flex items-center gap-1 text-foreground/80 hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft className="size-3.5" />
          Back to results
        </Link>
        <span className="text-border">|</span>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/parking" className="hover:text-primary transition-colors">
            Find Parking
          </Link>
          <ChevronRight className="size-3" />
          <Link href="/parking" className="hover:text-primary transition-colors">
            Gulshan
          </Link>
          <ChevronRight className="size-3" />
          <span className="font-semibold text-foreground">
            {spot.propertyName}
          </span>
        </div>
      </div>

      {/* 2. Photo Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 h-[340px] sm:h-[440px] md:h-[480px]">
        {/* Left Hero Image (2/3 width) */}
        <div
          onClick={() => openGalleryAt(0)}
          className="relative md:col-span-8 h-full rounded-2xl overflow-hidden cursor-pointer group shadow-sm border border-border/80"
        >
          <Image
            src={parkingHeroImg}
            alt="Gulshan Residential Parking Underground Bay"
            fill
            priority
            className="object-cover group-hover:scale-102 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
        </div>

        {/* Right 2 Stacked Images (1/3 width) */}
        <div className="hidden md:grid md:col-span-4 grid-rows-2 gap-3 sm:gap-4 h-full">
          {/* Top Right Image */}
          <div
            onClick={() => openGalleryAt(1)}
            className="relative h-full rounded-2xl overflow-hidden cursor-pointer group shadow-sm border border-border/80"
          >
            <Image
              src={parkingGuardImg}
              alt="Security Checkpoint and Entrance Barrier"
              fill
              className="object-cover group-hover:scale-102 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
          </div>

          {/* Bottom Right Image with 'Show all photos' Button */}
          <div
            onClick={() => openGalleryAt(2)}
            className="relative h-full rounded-2xl overflow-hidden cursor-pointer group shadow-sm border border-border/80"
          >
            <Image
              src={parkingEvImg}
              alt="EV Charging Wallbox"
              fill
              className="object-cover group-hover:scale-102 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />

            {/* Show all photos button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openGalleryAt(0);
              }}
              className="absolute bottom-3.5 right-3.5 flex items-center gap-2 rounded-xl bg-white/95 hover:bg-white text-gray-900 px-3.5 py-2 text-xs font-bold shadow-md backdrop-blur-xs transition-all border border-gray-200 cursor-pointer font-heading"
            >
              <LayoutGrid className="size-3.5" />
              Show all photos
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Content Split Grid (Left 2/3 Content + Right 1/3 Booking Widget) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 pt-2 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Title, Rating & Verified Badges */}
          <div className="space-y-3 pb-6 border-b border-border/80">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground font-heading tracking-tight">
              {spot.propertyName}
            </h1>

            {/* Rating & Location Meta */}
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1 font-bold text-foreground">
                <Star className="size-4 fill-amber-500 text-amber-500" />
                <span>4.9</span>
              </div>
              <span>·</span>
              <span className="font-medium text-foreground">128 reviews</span>
              <span>·</span>
              <span>Gulshan 2, Near Westin Dhaka</span>
            </div>

            {/* Pill Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 text-xs font-bold font-heading">
                <ShieldCheck className="size-3.5 text-emerald-700" />
                Verified Property
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 text-foreground/80 border border-border px-3 py-1 text-xs font-medium font-heading">
                <Building className="size-3.5 text-muted-foreground" />
                Gated Access
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 text-foreground/80 border border-border px-3 py-1 text-xs font-medium font-heading">
                <Video className="size-3.5 text-muted-foreground" />
                CCTV Monitored
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 text-foreground/80 border border-border px-3 py-1 text-xs font-medium font-heading">
                <Warehouse className="size-3.5 text-muted-foreground" />
                Covered
              </span>
            </div>
          </div>

          {/* About this space */}
          <div className="space-y-3 pb-6 border-b border-border/80">
            <h2 className="text-lg sm:text-xl font-bold text-foreground font-heading">
              About this space
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Experience hassle-free parking in the heart of Gulshan 2. This
              premium residential parking spot offers a secure, clean, and
              well-lit environment for your vehicle. Located within a high-end
              apartment complex, it is strictly monitored by 24/7 security
              personnel and CCTV. Perfect for professionals working nearby or
              visitors seeking a guaranteed, safe spot away from street
              congestion.
            </p>
          </div>

          {/* Features & Amenities */}
          <div className="space-y-4 pb-6 border-b border-border/80">
            <h2 className="text-lg sm:text-xl font-bold text-foreground font-heading">
              Features & Amenities
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs sm:text-sm">
              <div className="flex items-center gap-3 text-foreground">
                <Clock className="size-4 text-primary shrink-0" />
                <span>24/7 Access</span>
              </div>
              <div className="flex items-center gap-3 text-foreground">
                <Zap className="size-4 text-primary shrink-0" />
                <span>EV Charging Available</span>
              </div>
              <div className="flex items-center gap-3 text-foreground">
                <Shield className="size-4 text-primary shrink-0" />
                <span>24/7 CCTV & Guard</span>
              </div>
              <div className="flex items-center gap-3 text-foreground">
                <Car className="size-4 text-primary shrink-0" />
                <span>Sedan, SUV, Hatchback</span>
              </div>
              <div className="flex items-center gap-3 text-foreground">
                <QrCode className="size-4 text-primary shrink-0" />
                <span>Secure QR/OTP Entry</span>
              </div>
              <div className="flex items-center gap-3 text-foreground">
                <Warehouse className="size-4 text-primary shrink-0" />
                <span>Covered Parking</span>
              </div>
            </div>
          </div>

          {/* Before You Book */}
          <div className="space-y-4 pb-6 border-b border-border/80">
            <h2 className="text-lg sm:text-xl font-bold text-foreground font-heading">
              Before You Book
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-border/70 bg-card p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-primary font-bold text-xs font-heading">
                  <Calendar className="size-4" />
                  Cancellation
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Free cancellation up to 2 hours before arrival.
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-card p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-primary font-bold text-xs font-heading">
                  <Car className="size-4" />
                  Arrival
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Show your QR code to the guard upon entry.
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-card p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-primary font-bold text-xs font-heading">
                  <ShieldCheck className="size-4" />
                  Privacy & Safety
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Vehicle matching and guard verification required for all
                  entries.
                </p>
              </div>
            </div>
          </div>

          {/* Location Section with Map Box */}
          <div className="space-y-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground font-heading">
                Location
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gulshan 2, Dhaka
              </p>
            </div>

            {/* Stylized Map Box */}
            <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-border bg-[#eef2f5] flex items-center justify-center shadow-inner">
              {/* Subtle background street pattern lines */}
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]" />
              <svg
                className="absolute inset-0 w-full h-full stroke-slate-300/70"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line x1="0" y1="90" x2="100%" y2="90" strokeWidth="6" />
                <line x1="0" y1="210" x2="100%" y2="210" strokeWidth="8" />
                <line x1="180" y1="0" x2="180" y2="100%" strokeWidth="7" />
                <line x1="420" y1="0" x2="420" y2="100%" strokeWidth="6" />
                <line x1="680" y1="0" x2="680" y2="100%" strokeWidth="5" />
              </svg>

              {/* ParkEase Center Target Marker */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="flex size-20 sm:size-24 items-center justify-center rounded-full bg-primary/20 animate-pulse">
                  <div className="flex size-12 sm:size-14 items-center justify-center rounded-full bg-[#064E3B] text-white shadow-xl ring-4 ring-white">
                    <span className="font-extrabold text-xl font-mono">P</span>
                  </div>
                </div>
              </div>

              {/* Bottom privacy overlay banner */}
              <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-4 z-20 flex items-center gap-2 rounded-xl bg-white/95 backdrop-blur-md px-4 py-2.5 shadow-sm border border-gray-200/80 text-[11px] sm:text-xs text-muted-foreground">
                <Info className="size-4 text-primary shrink-0" />
                <span>
                  Exact private property address is shared only after a
                  confirmed booking.
                </span>
              </div>
            </div>

            <p className="flex items-center gap-2 text-xs font-semibold text-foreground pt-1">
              <span>🚶</span> 5 min walk to Gulshan 2 Circle
            </p>
          </div>
        </div>

        {/* Right Sticky Column (4 cols) - Booking Card */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-xl ring-1 ring-border/50 urban-card-shadow space-y-5">
            {/* Top Status Pill */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 text-xs font-bold font-heading">
              <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
              Available for selected time
            </div>

            {/* Price Heading */}
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-foreground font-heading">
                ৳{hourlyRate}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                /hour
              </span>
            </div>

            {/* Interactive Inputs Box */}
            <div className="rounded-xl border border-border overflow-hidden divide-y divide-border bg-background">
              {/* Check-In / Check-Out Row */}
              <div className="grid grid-cols-2 divide-x divide-border">
                <div className="p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block font-heading">
                    Check-in
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-foreground block mt-0.5 font-heading">
                    {checkInDate}
                  </span>
                </div>
                <div className="p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block font-heading">
                    Check-out
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-foreground block mt-0.5 font-heading">
                    {checkOutDate}
                  </span>
                </div>
              </div>

              {/* Vehicle Row */}
              <div className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/40 transition-colors">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block font-heading">
                    Vehicle
                  </span>
                  <span className="text-xs font-semibold text-foreground font-mono mt-0.5 block">
                    {vehicle}
                  </span>
                </div>
                <ChevronDown className="size-4 text-muted-foreground" />
              </div>
            </div>

            {/* Itemized Pricing Breakdown */}
            <div className="space-y-2.5 text-xs sm:text-sm pt-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Base Rate ({durationHours} hours)</span>
                <span className="font-semibold text-foreground font-mono">
                  ৳{baseRate}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Service Fee</span>
                <span className="font-semibold text-foreground font-mono">
                  ৳{serviceFee}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>VAT (10%)</span>
                <span className="font-semibold text-foreground font-mono">
                  ৳{vatAmount}
                </span>
              </div>
              <div className="border-t border-border pt-3 flex items-center justify-between">
                <span className="text-base font-bold text-foreground font-heading">
                  Total Payable
                </span>
                <span className="text-2xl font-black text-primary font-mono">
                  ৳{totalPayable}
                </span>
              </div>
            </div>

            {/* Confirm Reservation Button (Auth Gate) */}
            <div className="space-y-2.5 pt-1">
              <Button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full h-12 rounded-xl bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-bold text-sm shadow-md flex items-center justify-center gap-1.5 cursor-pointer font-heading"
              >
                Confirm Reservation
                <ArrowUpRight className="size-4" />
              </Button>

              <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground text-center">
                <Lock className="size-3 text-muted-foreground/80 shrink-0" />
                <span>Secure QR code for entry generated after payment</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal Triggered When Non-Signed-In User Clicks Confirm Reservation */}
      <ParkingAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        spotName={spot.propertyName}
        spotId={spot.id}
        totalPayable={totalPayable}
      />

      {/* Gallery Lightbox Modal */}
      <ParkingGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        images={GALLERY_IMAGES}
        initialIndex={galleryIndex}
      />
    </div>
  );
}
