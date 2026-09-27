"use client";

import React, { useState } from "react";
import {
  Calendar,
  DollarSign,
  Car,
  TrendingUp,
  Shield,
  Sliders,
  Lightbulb,
  Copy,
  Check,
  X,
  Info,
} from "lucide-react";
import { ListingWizardShell } from "../listing-wizard-shell";

export interface DaySchedule {
  day: string;
  startTime: string;
  endTime: string;
  hoursText: string;
  is24Hours: boolean;
  status: "Available" | "Unavailable";
}

const INITIAL_SCHEDULE: DaySchedule[] = [
  {
    day: "Monday",
    startTime: "08:00 AM",
    endTime: "10:00 PM",
    hoursText: "(14 hrs)",
    is24Hours: false,
    status: "Available",
  },
  {
    day: "Tuesday",
    startTime: "08:00 AM",
    endTime: "10:00 PM",
    hoursText: "(14 hrs)",
    is24Hours: false,
    status: "Available",
  },
  {
    day: "Wednesday",
    startTime: "08:00 AM",
    endTime: "10:00 PM",
    hoursText: "(14 hrs)",
    is24Hours: false,
    status: "Available",
  },
  {
    day: "Thursday",
    startTime: "08:00 AM",
    endTime: "10:00 PM",
    hoursText: "(14 hrs)",
    is24Hours: false,
    status: "Available",
  },
  {
    day: "Friday",
    startTime: "08:00 AM",
    endTime: "11:00 PM",
    hoursText: "(Extended Weekend 15 hrs)",
    is24Hours: false,
    status: "Available",
  },
  {
    day: "Saturday",
    startTime: "12:00 AM",
    endTime: "11:59 PM",
    hoursText: "Continuous Full-Day Access",
    is24Hours: true,
    status: "Available",
  },
  {
    day: "Sunday",
    startTime: "12:00 AM",
    endTime: "11:59 PM",
    hoursText: "Continuous Full-Day Access",
    is24Hours: true,
    status: "Available",
  },
];

export function Step4PricingView() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(INITIAL_SCHEDULE);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Pricing State
  const [hourlyRate, setHourlyRate] = useState(50);
  const [dailyMax, setDailyMax] = useState(400);
  const [minDuration, setMinDuration] = useState("1 hour");
  const [maxDuration, setMaxDuration] = useState("12 hours");
  const [gracePeriod, setGracePeriod] = useState("15 minutes");
  const [securityDeposit, setSecurityDeposit] = useState(200);
  const [autoRefund, setAutoRefund] = useState(true);

  // Peak Pricing State
  const [peakPricingEnabled, setPeakPricingEnabled] = useState(true);
  const [peakWindow, setPeakWindow] = useState("5:00 PM — 9:00 PM");
  const [surgeRate, setSurgeRate] = useState("+20% Surge Rate");
  const [activePeakDays, setActivePeakDays] = useState({
    friday: true,
    saturday: true,
    sunThu: false,
  });

  // Modal State for editing day schedule
  const [editingDay, setEditingDay] = useState<DaySchedule | null>(null);
  const [modalStart, setModalStart] = useState("08:00 AM");
  const [modalEnd, setModalEnd] = useState("10:00 PM");
  const [modalIs24Hours, setModalIs24Hours] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCopyMonday = () => {
    const monday = schedule.find((s) => s.day === "Monday") || INITIAL_SCHEDULE[0];
    setSchedule((prev) =>
      prev.map((s) => {
        if (s.day === "Tuesday" || s.day === "Wednesday" || s.day === "Thursday") {
          return {
            ...s,
            startTime: monday.startTime,
            endTime: monday.endTime,
            hoursText: monday.hoursText,
            is24Hours: monday.is24Hours,
          };
        }
        return s;
      })
    );
    showToast("Monday schedule copied to Tue, Wed, and Thu.");
  };

  const handleSaveDaySchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDay) return;

    setSchedule((prev) =>
      prev.map((s) => {
        if (s.day === editingDay.day) {
          return {
            ...s,
            startTime: modalIs24Hours ? "12:00 AM" : modalStart,
            endTime: modalIs24Hours ? "11:59 PM" : modalEnd,
            is24Hours: modalIs24Hours,
            hoursText: modalIs24Hours ? "Continuous Full-Day Access" : `(${modalStart} – ${modalEnd})`,
          };
        }
        return s;
      })
    );

    showToast(`${editingDay.day} operating hours updated.`);
    setEditingDay(null);
  };

  return (
    <ListingWizardShell
      currentStep={4}
      stepTitle="Add Parking Space"
      stepSubtitle="Set when drivers can book your parking spaces and how much they will pay."
      nextStepTitle="Amenities & Security"
      nextStepPath="/provider/properties/new/step-5"
      prevStepPath="/provider/properties/new/step-3"
      progressPercentage={57}
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
          {/* 1. AVAILABILITY SCHEDULE CARD */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-emerald-50 text-[#064E3B] flex items-center justify-center">
                  <Calendar className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold font-heading text-slate-900">
                      Availability Schedule
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                      Weekly Operating Hours
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyMonday}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer self-start sm:self-auto"
              >
                <Copy className="size-3.5" />
                <span>Copy Monday to Weekdays</span>
              </button>
            </div>

            {/* Daily Rows */}
            <div className="divide-y divide-slate-100 text-xs">
              {schedule.map((item) => (
                <div
                  key={item.day}
                  className="p-3.5 sm:px-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition"
                >
                  <div className="w-28 font-bold text-slate-900 flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-600" />
                    <span>{item.day}</span>
                  </div>

                  <div className="flex-1 flex items-center gap-2.5 text-slate-700">
                    {item.is24Hours ? (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#064E3B] text-white">
                          24 HOURS
                        </span>
                        <span className="text-slate-500 font-medium">
                          {item.hoursText}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                          {item.startTime}
                        </span>
                        <span className="text-slate-400">—</span>
                        <span className="font-mono font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                          {item.endTime}
                        </span>
                        <span className="text-slate-400 text-[11px] ml-1">
                          {item.hoursText}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
                      <span className="size-1.5 rounded-full bg-emerald-600" />
                      Available
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDay(item);
                        setModalStart(item.startTime);
                        setModalEnd(item.endTime);
                        setModalIs24Hours(item.is24Hours);
                      }}
                      className="text-xs font-semibold text-[#064E3B] hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Schedule Footer */}
            <div className="p-3.5 bg-slate-50/70 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="size-4 rounded text-[#064E3B] focus:ring-[#064E3B] border-slate-300"
                />
                <span>Apply this same schedule across all 6 reservable spaces</span>
              </label>

              <div className="flex items-center gap-1.5 font-semibold text-emerald-900 text-xs">
                <Check className="size-4 text-emerald-600 stroke-[2.5]" />
                <span>Schedule fully configured</span>
              </div>
            </div>
          </div>

          {/* 2. MIDDLE ROW (2 CARDS SIDE-BY-SIDE) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: BASE PRICING */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold font-heading text-xs uppercase tracking-wider">
                  <DollarSign className="size-4 text-[#064E3B]" />
                  <span>BASE PRICING</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  BDT (৳)
                </span>
              </div>

              {/* 2 Main Rate Inputs */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Hourly Rate
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500">
                      ৳
                    </span>
                    <input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      className="w-full h-10 pl-7 pr-10 rounded-lg border border-slate-300 bg-white font-extrabold text-sm text-slate-900 focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20 transition"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]">
                      / hr
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Daily Maximum
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500">
                      ৳
                    </span>
                    <input
                      type="number"
                      value={dailyMax}
                      onChange={(e) => setDailyMax(Number(e.target.value))}
                      className="w-full h-10 pl-7 pr-12 rounded-lg border border-slate-300 bg-white font-extrabold text-sm text-slate-900 focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20 transition"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]">
                      / day
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 Sub-inputs */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Min Duration
                  </label>
                  <input
                    type="text"
                    value={minDuration}
                    onChange={(e) => setMinDuration(e.target.value)}
                    className="w-full h-8.5 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Max Duration
                  </label>
                  <input
                    type="text"
                    value={maxDuration}
                    onChange={(e) => setMaxDuration(e.target.value)}
                    className="w-full h-8.5 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Grace Period
                  </label>
                  <input
                    type="text"
                    value={gracePeriod}
                    onChange={(e) => setGracePeriod(e.target.value)}
                    className="w-full h-8.5 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20 transition"
                  />
                </div>
              </div>

              <div className="flex items-start gap-1.5 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <Info className="size-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>The daily maximum prevents hourly charges from exceeding the set daily cap (e.g. ৳400 cap for 8+ hours).</span>
              </div>
            </div>

            {/* Card 2: SPACE TYPE PRICING */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold font-heading text-xs uppercase tracking-wider">
                  <Car className="size-4 text-[#064E3B]" />
                  <span>SPACE TYPE PRICING</span>
                </div>
                <button
                  type="button"
                  onClick={() => alert("Space rate adjustment dialog.")}
                  className="text-xs font-semibold text-[#064E3B] hover:underline cursor-pointer"
                >
                  Edit Rates
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                  <span className="inline-flex items-center gap-2 text-slate-700 font-medium">
                    <span className="size-2 rounded-full bg-slate-500" />
                    Standard Car
                  </span>
                  <strong className="text-slate-900 text-sm">৳{hourlyRate} <span className="text-slate-400 font-normal text-xs">/ hr</span></strong>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100">
                  <span className="inline-flex items-center gap-2 text-slate-700 font-medium">
                    <span className="size-2 rounded-full bg-emerald-600" />
                    SUV / Large Bay
                  </span>
                  <strong className="text-[#064E3B] text-sm">৳{Math.round(hourlyRate * 1.2)} <span className="text-slate-400 font-normal text-xs">/ hr (+20%)</span></strong>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                  <span className="inline-flex items-center gap-2 text-slate-700 font-medium">
                    <span className="size-2 rounded-full bg-amber-500" />
                    Motorbike
                  </span>
                  <strong className="text-slate-900 text-sm">৳30 <span className="text-slate-400 font-normal text-xs">/ hr</span></strong>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100">
                  <span className="inline-flex items-center gap-2 text-slate-700 font-medium">
                    <span className="size-2 rounded-full bg-teal-600" />
                    EV Charging Space
                  </span>
                  <strong className="text-[#064E3B] text-sm">৳70 <span className="text-slate-400 font-normal text-xs">/ hr</span></strong>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                  <span className="inline-flex items-center gap-2 text-slate-700 font-medium">
                    <span className="size-2 rounded-full bg-sky-500" />
                    Accessible Space
                  </span>
                  <strong className="text-slate-900 text-sm">৳50 <span className="text-slate-400 font-normal text-xs">/ hr</span></strong>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                Rates auto-apply to drivers based on selected bay classification.
              </p>
            </div>
          </div>

          {/* 3. BOTTOM ROW (2 CARDS SIDE-BY-SIDE) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: PEAK PRICING */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold font-heading text-xs uppercase tracking-wider">
                  <TrendingUp className="size-4 text-[#064E3B]" />
                  <span>PEAK PRICING</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    {peakPricingEnabled ? "ON" : "OFF"}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={peakPricingEnabled}
                    onClick={() => setPeakPricingEnabled(!peakPricingEnabled)}
                    className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      peakPricingEnabled ? "bg-[#064E3B]" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block size-3.5 transform rounded-full bg-white shadow-sm transition ${
                        peakPricingEnabled ? "translate-x-3.5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Peak Hours Window
                  </label>
                  <input
                    type="text"
                    value={peakWindow}
                    onChange={(e) => setPeakWindow(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] bg-[#fcfcfd] text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Rate Adjustment
                  </label>
                  <input
                    type="text"
                    value={surgeRate}
                    onChange={(e) => setSurgeRate(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 font-bold text-[#064E3B] text-xs"
                  />
                </div>
              </div>

              {/* Active Peak Days Pills */}
              <div className="space-y-1.5 text-xs">
                <span className="text-[11px] font-medium text-slate-500 block">
                  Active Peak Days
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setActivePeakDays((prev) => ({ ...prev, friday: !prev.friday }))
                    }
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer border ${
                      activePeakDays.friday
                        ? "bg-[#064E3B] text-white border-[#064E3B]"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    Friday
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActivePeakDays((prev) => ({ ...prev, saturday: !prev.saturday }))
                    }
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer border ${
                      activePeakDays.saturday
                        ? "bg-[#064E3B] text-white border-[#064E3B]"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    Saturday
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActivePeakDays((prev) => ({ ...prev, sunThu: !prev.sunThu }))
                    }
                    className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer border ${
                      activePeakDays.sunThu
                        ? "bg-[#064E3B] text-white border-[#064E3B]"
                        : "bg-slate-50 text-slate-500 border-slate-200"
                    }`}
                  >
                    Sun–Thu (Standard)
                  </button>
                </div>
              </div>

              {/* Live Example Box */}
              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <span className="font-bold text-[#064E3B] block">Live Example:</span>
                <p className="leading-relaxed text-[11px]">
                  Standard rate <strong>৳50</strong> → Peak surge rate <strong>৳60</strong> (applies only during 5–9 PM Fri & Sat).
                </p>
              </div>
            </div>

            {/* Card 2: BOOKING RULES */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold font-heading text-xs uppercase tracking-wider">
                  <Shield className="size-4 text-[#064E3B]" />
                  <span>BOOKING RULES</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  Policy Limits
                </span>
              </div>

              {/* 2x2 grid of policy cards */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-500 block">Advance Booking</span>
                  <strong className="text-slate-900 mt-0.5 block">Up to 7 days ahead</strong>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-500 block">Minimum Notice</span>
                  <strong className="text-slate-900 mt-0.5 block">30 mins before arrival</strong>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-500 block">Free Cancellation</span>
                  <strong className="text-slate-900 mt-0.5 block">Up to 2 hrs before start</strong>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-500 block">Late Arrival Hold</span>
                  <strong className="text-slate-900 mt-0.5 block">15 mins buffer</strong>
                </div>
              </div>

              {/* Security Deposit Row */}
              <div className="p-3 rounded-xl border border-slate-200/80 bg-[#fcfcfd] flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">Security Deposit</span>
                  <span className="text-[11px] text-slate-500">Refunded upon guard checkout</span>
                </div>
                <div className="flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                  <span className="font-bold text-[#064E3B]">৳</span>
                  <input
                    type="number"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                    className="w-14 font-extrabold text-sm text-[#064E3B] bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              {/* Auto refund toggle */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">Auto-refund deposit after checkout</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoRefund}
                  onClick={() => setAutoRefund(!autoRefund)}
                  className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    autoRefund ? "bg-[#064E3B]" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block size-3.5 transform rounded-full bg-white shadow-sm transition ${
                      autoRefund ? "translate-x-3.5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* RIGHT SIDEBAR (TIPS & PROGRESS - 320PX)                            */}
        {/* ================================================================== */}
        <div className="space-y-5">
          {/* 1. PRICING SUMMARY */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold font-heading text-slate-900">
                <DollarSign className="size-4 text-[#064E3B]" />
                <span>PRICING SUMMARY</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Pricing Ready
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Base Hourly Rate</span>
                <strong className="text-slate-900">৳{hourlyRate} / hr</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Daily Maximum Cap</span>
                <strong className="text-slate-900">৳{dailyMax} / day</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Security Deposit</span>
                <strong className="text-slate-900">৳{securityDeposit}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Peak Pricing</span>
                <strong className="text-[#064E3B] font-bold">Enabled (+20%)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Arrival Grace Buffer</span>
                <strong className="text-slate-900">15 mins</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Platform Fee</span>
                <span className="text-[11px] text-slate-600">Shown separately to driver</span>
              </div>
            </div>
          </div>

          {/* 2. AVAILABILITY SUMMARY */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold font-heading text-slate-900">
                <Calendar className="size-4 text-[#064E3B]" />
                <span>AVAILABILITY SUMMARY</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Schedule Valid
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Weekdays (Mon–Thu)</span>
                <strong className="text-slate-900">8:00 AM – 10:00 PM</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Friday</span>
                <strong className="text-slate-900">8:00 AM – 11:00 PM</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Weekend (Sat–Sun)</span>
                <strong className="text-[#064E3B] font-bold">24 Hours Access</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-100">
                <span className="text-slate-500 font-medium">Active Reservable Bays</span>
                <strong className="text-slate-900">6 Spaces</strong>
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
                57%
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
                <span>Location & Entrance</span>
                <span className="text-[10px] text-emerald-700 font-bold ml-auto">Completed</span>
              </div>

              <div className="flex items-center gap-2 text-slate-800 font-medium">
                <Check className="size-3.5 text-emerald-600 stroke-[3]" />
                <span>Parking Spaces</span>
                <span className="text-[10px] text-emerald-700 font-bold ml-auto">Completed</span>
              </div>

              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <span className="size-2 rounded-full bg-emerald-600" />
                <span>Availability & Pricing</span>
                <span className="text-[10px] text-slate-500 font-semibold ml-auto">In Progress</span>
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

          {/* 4. PRICING TIPS */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold font-heading text-slate-900 border-b border-slate-100 pb-2.5">
              <Lightbulb className="size-4 text-amber-500" />
              <span>Pricing Tips</span>
            </div>

            <ul className="space-y-2 text-[11px] text-slate-600 leading-relaxed">
              <li>
                <strong className="text-slate-900">• Competitive Pricing:</strong> Set rates based on nearby parking options in Gulshan-2.
              </li>
              <li>
                <strong className="text-slate-900">• Daily Cap:</strong> Use a daily maximum to avoid unexpected high totals for long stays.
              </li>
              <li>
                <strong className="text-slate-900">• Peak Hours:</strong> Use peak pricing only when local road demand is consistently higher.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODAL: EDIT DAY SCHEDULE                                             */}
      {/* ==================================================================== */}
      {editingDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-sm w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold font-heading text-slate-900">
                Edit {editingDay.day} Schedule
              </h3>
              <button
                type="button"
                onClick={() => setEditingDay(null)}
                className="size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDaySchedule} className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer pb-1">
                <input
                  type="checkbox"
                  checked={modalIs24Hours}
                  onChange={(e) => setModalIs24Hours(e.target.checked)}
                  className="size-4 rounded text-[#064E3B] focus:ring-[#064E3B] border-slate-300"
                />
                <span className="font-bold text-slate-800">24 Hours Continuous Access</span>
              </label>

              {!modalIs24Hours && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
                    <input
                      type="text"
                      value={modalStart}
                      onChange={(e) => setModalStart(e.target.value)}
                      className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">End Time</label>
                    <input
                      type="text"
                      value={modalEnd}
                      onChange={(e) => setModalEnd(e.target.value)}
                      className="w-full h-9 px-2.5 rounded-lg border border-[#E5E7EB] text-slate-900"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDay(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#E5E7EB] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#064E3B] text-white font-semibold hover:bg-[#064E3B]/90"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ListingWizardShell>
  );
}
