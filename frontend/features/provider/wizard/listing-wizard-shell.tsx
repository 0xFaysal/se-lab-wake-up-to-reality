"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Headphones,
  ArrowLeft,
  ArrowRight,
  Menu,
  X,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { MOCK_OWNER_PROFILE } from "@/lib/data/mock-owner-data";

export interface WizardStepDef {
  stepNumber: number;
  title: string;
  path: string;
  state: "completed" | "active" | "pending";
}

interface ListingWizardShellProps {
  currentStep: number;
  stepTitle: string;
  stepSubtitle: string;
  nextStepTitle?: string;
  nextStepPath?: string;
  prevStepPath?: string;
  progressPercentage: number;
  children: React.ReactNode;
  onSaveAndExit?: () => void;
  onNext?: () => void;
  isSuccessScreen?: boolean;
  hideDefaultFooter?: boolean;
}

export function ListingWizardShell({
  currentStep,
  stepTitle,
  stepSubtitle,
  nextStepTitle = "Parking Spaces",
  nextStepPath = "/provider/properties/new/step-3",
  prevStepPath = "/provider/properties",
  progressPercentage = 29,
  children,
  onSaveAndExit,
  onNext,
  isSuccessScreen = false,
  hideDefaultFooter = false,
}: ListingWizardShellProps) {
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const steps: WizardStepDef[] = [
    {
      stepNumber: 1,
      title: "Property Details",
      path: "/provider/properties/new/step-1",
      state: isSuccessScreen || currentStep > 1 ? "completed" : currentStep === 1 ? "active" : "pending",
    },
    {
      stepNumber: 2,
      title: "Location",
      path: "/provider/properties/new/step-2",
      state: isSuccessScreen || currentStep > 2 ? "completed" : currentStep === 2 ? "active" : "pending",
    },
    {
      stepNumber: 3,
      title: "Parking Spaces",
      path: "/provider/properties/new/step-3",
      state: isSuccessScreen || currentStep > 3 ? "completed" : currentStep === 3 ? "active" : "pending",
    },
    {
      stepNumber: 4,
      title: "Availability & Pricing",
      path: "/provider/properties/new/step-4",
      state: isSuccessScreen || currentStep > 4 ? "completed" : currentStep === 4 ? "active" : "pending",
    },
    {
      stepNumber: 5,
      title: "Amenities & Security",
      path: "/provider/properties/new/step-5",
      state: isSuccessScreen || currentStep > 5 ? "completed" : currentStep === 5 ? "active" : "pending",
    },
    {
      stepNumber: 6,
      title: "Photos",
      path: "/provider/properties/new/step-6",
      state: isSuccessScreen || currentStep > 6 ? "completed" : currentStep === 6 ? "active" : "pending",
    },
    {
      stepNumber: 7,
      title: "Review & Publish",
      path: "/provider/properties/new/step-7",
      state: isSuccessScreen ? "completed" : currentStep === 7 ? "active" : "pending",
    },
  ];

  const handleNextClick = () => {
    if (onNext) {
      onNext();
    } else if (nextStepPath) {
      router.push(nextStepPath);
    }
  };

  const handleSaveExit = () => {
    if (onSaveAndExit) {
      onSaveAndExit();
    } else {
      router.push("/provider/properties");
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-slate-800 flex flex-col relative pb-28">
      {/* ==================================================================== */}
      {/* 1. SIMPLIFIED TOP HEADER                                             */}
      {/* ==================================================================== */}
      <header className="h-16 bg-white border-b border-[#E5E7EB] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
        {/* Left: Brand Logo & Mobile Trigger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden p-1.5 rounded-lg border border-[#E5E7EB] text-slate-600"
          >
            {mobileSidebarOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>

          <Link href="/provider/dashboard" className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-[#064E3B] text-white flex items-center justify-center font-bold text-sm font-heading shadow-2xs">
              P
            </div>
            <div className="hidden sm:block">
              <span className="font-heading font-extrabold text-sm text-slate-900 block leading-tight">
                ParkEase BD
              </span>
              <span className="text-[10px] font-medium text-slate-500">
                Provider Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Listing Setup context */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium hidden md:inline">Listing Setup:</span>
          <span className="font-bold text-slate-900 font-heading truncate max-w-[200px] sm:max-w-none">
            Residential Building, Gulshan
          </span>
          {isSuccessScreen ? (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-[#064E3B] border border-emerald-300 flex items-center gap-1.5 font-heading">
              <span className="size-1.5 rounded-full bg-emerald-600" />
              Completed
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Step {currentStep} of 7
            </span>
          )}
        </div>

        {/* Right: Provider Profile Capsule & Optional Notification Bell */}
        <div className="flex items-center gap-2.5">
          {isSuccessScreen && (
            <button
              type="button"
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              title="Notifications"
            >
              <Bell className="size-4" />
            </button>
          )}
          <div className="size-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center font-heading">
            {MOCK_OWNER_PROFILE.initials}
          </div>
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-900 leading-tight">
              {MOCK_OWNER_PROFILE.name}
            </span>
            <span className="text-[10px] text-slate-500">
              {MOCK_OWNER_PROFILE.role}
            </span>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. BODY LAYOUT: FIXED LEFT W-64 SIDEBAR & MAIN AREA                  */}
      {/* ==================================================================== */}
      <div className="flex-1 flex min-w-0">
        {/* Left Sidebar (Desktop Fixed w-64) */}
        <aside
          className={`fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-[#E5E7EB] p-5 flex flex-col justify-between z-30 transition-transform duration-200 ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Top: Stepper list */}
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-heading block">
                SETUP GUIDE
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-semibold text-slate-700">
                  {isSuccessScreen ? "100% Complete" : `Step ${currentStep} of 7 • Listing Onboarding`}
                </span>
                <span className="text-xs font-bold text-[#064E3B] font-heading">
                  {progressPercentage}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-100 mt-2 overflow-hidden">
                <div
                  className="h-full bg-[#064E3B] transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              {/* Success Badge */}
              {isSuccessScreen && (
                <div className="mt-3 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[#064E3B] text-[11px] font-bold font-heading flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-[#064E3B] shrink-0" />
                  <span>Published Successfully</span>
                </div>
              )}
            </div>

            {/* Stepper items */}
            <nav className="space-y-1 pt-2">
              {steps.map((step) => {
                const isCompleted = step.state === "completed";
                const isActive = step.state === "active";

                return (
                  <div
                    key={step.stepNumber}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? "bg-[#064E3B] text-white shadow-2xs"
                        : isCompleted
                        ? "text-slate-800 hover:bg-slate-50"
                        : "text-slate-400"
                    }`}
                  >
                    {/* Circle Icon */}
                    <div
                      className={`size-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                        isActive
                          ? "bg-white text-[#064E3B]"
                          : isCompleted
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {isCompleted ? <Check className="size-3.5 stroke-[3]" /> : step.stepNumber}
                    </div>

                    <span className="flex-1 truncate">{step.title}</span>

                    {isActive && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-900/40 text-emerald-100">
                        Active
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-[10px] font-bold text-emerald-700">
                        Done
                      </span>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Bottom: Need Help widget */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-[#064E3B] font-bold font-heading">
              <Headphones className="size-4" />
              <span>Need Help?</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Our Dhaka host onboarding support is active 24/7 for location verification.
            </p>
            <div className="pt-1 flex items-center justify-between">
              <button
                type="button"
                onClick={() => alert("Connecting to Dhaka Host Onboarding Support Live Chat...")}
                className="text-[11px] font-bold text-[#064E3B] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Chat Support</span>
                <span>→</span>
              </button>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                Live
              </span>
            </div>
          </div>
        </aside>

        {/* Main Content Area (Offset by lg:pl-64) */}
        <main className="lg:pl-64 flex-1 min-w-0 flex flex-col">
          {/* Wizard Step Header */}
          <div className="px-6 sm:px-8 lg:px-10 pt-6 pb-2">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 tracking-tight">
                {stepTitle}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                New Listing - Step {currentStep} of 7
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {stepSubtitle}
            </p>
          </div>

          {/* Page Content */}
          <div className="px-6 sm:px-8 lg:px-10 py-6">{children}</div>
        </main>
      </div>

      {/* ==================================================================== */}
      {/* 3. STICKY FOOTER BAR                                                 */}
      {/* ==================================================================== */}
      {!hideDefaultFooter && (
        <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-[#E5E7EB] px-4 sm:px-8 py-3.5 shadow-lg">
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            {/* Left Buttons */}
            <div className="flex items-center gap-2.5">
              <Link
                href={prevStepPath}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 font-semibold text-slate-700 transition"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back to Property Details</span>
              </Link>

              <button
                type="button"
                onClick={handleSaveExit}
                className="px-3.5 py-2 rounded-lg border border-transparent hover:bg-slate-100 font-semibold text-slate-600 transition cursor-pointer"
              >
                Save & Exit
              </button>
            </div>

            {/* Right Button & Indicator */}
            <div className="flex items-center gap-4 self-end sm:self-auto">
              <span className="text-slate-500 hidden md:inline">
                Next: <strong className="text-slate-800">{nextStepTitle} ({currentStep + 1}/7)</strong>
              </span>

              <button
                type="button"
                onClick={handleNextClick}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#064E3B] hover:bg-[#064E3B]/90 text-white font-bold text-xs shadow-2xs transition cursor-pointer active:scale-[0.99]"
              >
                <span>Continue to {nextStepTitle}</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
