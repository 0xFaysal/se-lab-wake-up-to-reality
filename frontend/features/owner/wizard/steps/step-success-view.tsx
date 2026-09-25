"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  Eye,
  Plus,
  ArrowRight,
  ExternalLink,
  Calendar,
  DollarSign,
  Sliders,
  Clock,
  QrCode,
  TrendingUp,
  Zap,
  Building2,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { ListingWizardShell } from "../listing-wizard-shell";

export function StepSuccessView() {
  return (
    <ListingWizardShell
      currentStep={7}
      stepTitle="Parking Space Published"
      stepSubtitle="Your parking listing is now available to drivers across Dhaka on ParkEase BD."
      progressPercentage={100}
      isSuccessScreen={true}
      hideDefaultFooter={true}
    >
      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* ================================================================= */}
        {/* LEFT COLUMN: HERO, DRIVER CARD PREVIEW, NEXT STEPS TIMELINE       */}
        {/* ================================================================= */}
        <div className="space-y-6">
          {/* HEADER ROW WITH LIVE BADGE */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <h2 className="font-heading font-extrabold text-base text-slate-900">
                Parking Space Published
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#064E3B] text-white flex items-center gap-1 font-heading shadow-xs">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 font-heading">
              <Check className="size-3.5 stroke-[3] text-[#064E3B]" />
              All 7 Steps Verified & Approved
            </span>
          </div>

          {/* 1. HERO CARD */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs space-y-6">
            <div className="flex items-start gap-4">
              {/* Checkmark Circle */}
              <div className="size-12 rounded-xl bg-[#064E3B] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Check className="size-6 stroke-[3]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-heading font-extrabold text-lg text-slate-900">
                    Your Parking Space Is Live
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 font-mono">
                    Listing ID: #PL-2048
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  <strong className="text-slate-800">Residential Building, Gulshan</strong> has been published successfully and is immediately discoverable for reservations by verified drivers.
                </p>
              </div>
            </div>

            {/* Row of 4 Metric Boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 block font-heading">
                  STATUS
                </span>
                <span className="text-xs font-extrabold text-[#064E3B] flex items-center gap-1 mt-1 font-heading">
                  <span className="size-1.5 rounded-full bg-emerald-600" />
                  Active & Open
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-heading">
                  PUBLISHED
                </span>
                <span className="text-xs font-extrabold text-slate-900 block mt-1 font-heading">
                  Just now
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-heading">
                  RESERVABLE BAYS
                </span>
                <span className="text-xs font-extrabold text-slate-900 block mt-1 font-heading">
                  6 Spaces
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-heading">
                  BASE HOURLY RATE
                </span>
                <span className="text-xs font-extrabold text-[#064E3B] block mt-1 font-heading">
                  ৳ 50 / hour
                </span>
              </div>
            </div>
          </div>

          {/* 2. DRIVER SEARCH PREVIEW */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Eye className="size-4 text-[#064E3B]" />
                <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                  Driver Search Preview
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                How drivers see your space in Gulshan-2
              </span>
            </div>

            {/* Search Result Card Mockup */}
            <div className="border border-[#E5E7EB] rounded-xl p-3.5 flex flex-col sm:flex-row gap-4 bg-slate-50/40 hover:bg-white transition">
              <div className="relative w-full sm:w-48 h-32 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                <Image
                  src="/assets/parking-hero-bay.jpg"
                  alt="Search Card Thumbnail"
                  fill
                  className="object-cover"
                />
                <span className="absolute top-2 left-2 bg-emerald-100 text-[#064E3B] text-[10px] font-bold px-2 py-0.5 rounded font-heading border border-emerald-300">
                  New Listing
                </span>
                <span className="absolute bottom-2 left-2 bg-black/80 text-white text-[11px] font-bold px-2 py-0.5 rounded font-heading">
                  ৳ 50 / hr
                </span>
              </div>

              <div className="flex-1 flex flex-col justify-between py-0.5">
                <div>
                  <div className="flex items-start justify-between">
                    <h4 className="font-heading font-bold text-sm text-slate-900">
                      Residential Building, Gulshan
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-600" />
                      Open Today
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Road 12, Block C, Gulshan-2, Dhaka · Near Circle 2
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {["Covered", "CCTV", "On-Site Guard", "EV Support"].map((pill) => (
                      <span key={pill} className="px-2 py-0.5 rounded text-[10px] bg-white border border-slate-200 text-slate-700 font-medium">
                        {pill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2.5 mt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-700 font-heading">
                    6 Spaces Reservable (Bays B-01 to B-06)
                  </span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1 text-[11px]">
                    <QrCode className="size-3.5 text-emerald-700" />
                    QR & Gate Verification Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. WHAT HAPPENS NEXT */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#E5E7EB]">
              <TrendingUp className="size-4 text-[#064E3B]" />
              <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                What Happens Next
              </h3>
            </div>

            {/* 3-Step Horizontal Process */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="size-7 rounded-lg bg-[#064E3B] text-white font-bold text-xs flex items-center justify-center font-heading shadow-xs">
                  1
                </div>
                <h4 className="font-heading font-bold text-xs text-slate-900">
                  Drivers Discover Space
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Your property appears in map & area search for drivers looking for parking in Gulshan-2.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="size-7 rounded-lg bg-[#064E3B] text-white font-bold text-xs flex items-center justify-center font-heading shadow-xs">
                  2
                </div>
                <h4 className="font-heading font-bold text-xs text-slate-900">
                  Receive Bookings
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Confirmed reservations immediately show on your Owner Dashboard and on-site Guard Portal.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="size-7 rounded-lg bg-[#064E3B] text-white font-bold text-xs flex items-center justify-center font-heading shadow-xs">
                  3
                </div>
                <h4 className="font-heading font-bold text-xs text-slate-900">
                  Manage Operations
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Assign shifts to guards, modify pricing, or adjust daily space availability anytime.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT SIDEBAR (320px): LISTING STATUS, QUICK ACTIONS, ADVICE      */}
        {/* ================================================================= */}
        <aside className="space-y-4">
          {/* CARD 1: LISTING STATUS */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-[#064E3B]" />
                <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                  Listing Status
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                All Systems Ready
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Visibility</span>
                <span className="font-bold text-slate-900 flex items-center gap-1 font-heading">
                  <span className="size-1.5 rounded-full bg-emerald-600" />
                  Public
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Booking Status</span>
                <span className="font-bold text-[#064E3B] font-heading">
                  Accepting Bookings
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Availability Mode</span>
                <span className="font-medium text-slate-800">Active (Standard + Peak)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Pricing Schedule</span>
                <span className="font-medium text-slate-800 font-heading">Published (৳ 50/hr)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Guard Verification</span>
                <span className="font-medium text-slate-800">Gate 2 Guard Point</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Payout & Payment</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1 font-heading">
                  <Check className="size-3 stroke-[3]" /> Ready (bKash/Bank)
                </span>
              </div>
            </div>
          </div>

          {/* CARD 2: QUICK ACTIONS */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E5E7EB]">
              <Zap className="size-4 text-[#064E3B]" />
              <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                Quick Actions
              </h3>
            </div>

            {/* 2x3 Grid of Actions */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                href="/owner/properties/1"
                className="p-2.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 transition flex flex-col items-center justify-center text-center gap-1 font-semibold text-slate-700"
              >
                <Eye className="size-4 text-slate-500" />
                <span className="text-[11px] leading-tight">View Live Listing</span>
              </Link>

              <Link
                href="/owner/properties/1"
                className="p-2.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 transition flex flex-col items-center justify-center text-center gap-1 font-semibold text-slate-700"
              >
                <Sliders className="size-4 text-slate-500" />
                <span className="text-[11px] leading-tight">Manage Listing</span>
              </Link>

              <Link
                href="/owner/bookings"
                className="p-2.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 transition flex flex-col items-center justify-center text-center gap-1 font-semibold text-slate-700"
              >
                <Calendar className="size-4 text-slate-500" />
                <span className="text-[11px] leading-tight">View Bookings</span>
              </Link>

              <Link
                href="/owner/guards"
                className="p-2.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 transition flex flex-col items-center justify-center text-center gap-1 font-semibold text-slate-700"
              >
                <UserCheck className="size-4 text-slate-500" />
                <span className="text-[11px] leading-tight">Assign Guards</span>
              </Link>

              <Link
                href="/owner/properties/new/step-4"
                className="p-2.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 transition flex flex-col items-center justify-center text-center gap-1 font-semibold text-slate-700"
              >
                <Clock className="size-4 text-slate-500" />
                <span className="text-[11px] leading-tight">Edit Schedule</span>
              </Link>

              <Link
                href="/owner/properties/new/step-4"
                className="p-2.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 transition flex flex-col items-center justify-center text-center gap-1 font-semibold text-slate-700"
              >
                <DollarSign className="size-4 text-slate-500" />
                <span className="text-[11px] leading-tight">Edit Pricing</span>
              </Link>
            </div>
          </div>

          {/* CARD 3: CALLOUT NOTICE */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-slate-600 leading-relaxed space-y-1">
            <div className="flex items-center gap-1.5 text-[#064E3B] font-bold font-heading">
              <Sparkles className="size-3.5" />
              <span>Listing Management</span>
            </div>
            <p>
              Your listing is live. You can update pricing, availability, amenities, photos, and access instructions anytime from{" "}
              <Link href="/owner/properties" className="text-[#064E3B] font-bold underline">
                My Listings
              </Link>
              .
            </p>
          </div>
        </aside>
      </div>

      {/* CUSTOM STICKY BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] px-4 sm:px-8 flex items-center justify-between z-40 shadow-lg">
        {/* Left: Add Another Parking Space */}
        <Link
          href="/owner/properties/new/step-1"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition font-heading"
        >
          <Plus className="size-3.5" />
          Add Another Parking Space
        </Link>

        {/* Center: Reassurance Text */}
        <p className="text-xs text-slate-400 hidden md:block font-medium">
          Listing changes take effect across all apps immediately.
        </p>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/owner/properties/1"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition font-heading"
          >
            <ExternalLink className="size-3.5" />
            View Live Listing
          </Link>

          <Link
            href="/owner/properties"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#064E3B] text-white text-xs font-bold hover:bg-[#064E3B]/90 transition shadow-sm font-heading"
          >
            <span>Go to My Listings</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </ListingWizardShell>
  );
}
