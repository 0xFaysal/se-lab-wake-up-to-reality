"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Smartphone,
  HelpCircle,
  Shield,
  ShieldCheck,
  ChevronRight,
  LogOut,
  Info,
  Building,
  DoorOpen,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { MOCK_GUARD_PROFILE } from "@/lib/data/mock-guard-data";

export function GuardProfileView() {
  const router = useRouter();
  const [isOnDuty, setIsOnDuty] = useState(MOCK_GUARD_PROFILE.isOnDuty);

  const handleSignOut = () => {
    if (confirm("Are you sure you want to sign out of the Guard Portal?")) {
      router.push("/login");
    }
  };

  return (
    <div className="space-y-4 select-none pb-28">
      {/* 1. Page Header */}
      <div className="pt-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 font-heading">
          Profile
        </h1>
        <p className="mt-0.5 text-xs text-gray-500">
          Guard account &amp; duty information
        </p>
      </div>

      {/* 2. Profile Header Card */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-emerald-600/30 shadow-xs">
            <Image
              src="/assets/avatar-guard.jpg"
              alt={MOCK_GUARD_PROFILE.name}
              width={64}
              height={64}
              className="h-full w-full object-cover"
              priority
            />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-extrabold text-gray-900 font-heading">
              {MOCK_GUARD_PROFILE.name}
            </h2>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="rounded bg-[#064E3B] px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                Security Guard
              </span>

              <button
                type="button"
                onClick={() => setIsOnDuty(!isOnDuty)}
                className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold transition-colors ${
                  isOnDuty
                    ? "bg-[#a7f3d0] text-[#064E3B]"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isOnDuty ? "bg-[#064E3B] animate-pulse" : "bg-gray-400"
                  }`}
                />
                <span>{isOnDuty ? "ON DUTY" : "OFF DUTY"}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="my-3.5 border-t border-gray-100" />

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Assigned Property</span>
            <span className="font-bold text-gray-900">Gulshan Avenue Parking</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500">Assigned Entrance</span>
            <span className="font-bold text-gray-900">Gate 2</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500">Shift</span>
            <span className="font-bold text-gray-900">8:00 AM – 6:00 PM</span>
          </div>
        </div>
      </section>

      {/* 3. Account Information Card */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 font-heading">
            Account Information
          </h3>
          <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
            Read-only
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Full Name</span>
            <span className="font-bold text-gray-900">Rahim Uddin</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500">Phone</span>
            <span className="font-mono font-bold text-gray-900">+880 17XX-XXXXXX</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500">Email</span>
            <span className="font-bold text-gray-900">rahim@example.com</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500">Role</span>
            <span className="font-bold text-gray-900">Security Guard</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500">Account Status</span>
            <span className="flex items-center gap-1 font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              <span>Active</span>
            </span>
          </div>
        </div>

        <div className="mt-3.5 flex items-center gap-1.5 border-t border-gray-100 pt-3 text-[11px] text-gray-400">
          <Lock className="h-3 w-3 shrink-0" />
          <span>Details managed by property owner/administrator</span>
        </div>
      </section>

      {/* 4. Duty Information Card */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 font-heading mb-3">
          Duty Information
        </h3>

        {/* Two Prominent Side-by-Side Boxes */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="rounded-xl bg-[#f0f4ff] p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Access Point
            </p>
            <p className="mt-1 text-base font-extrabold text-gray-900 font-heading">
              Gate 2
            </p>
          </div>

          <div className="rounded-xl bg-[#f0f4ff] p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Duty Status
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-base font-extrabold text-[#064E3B] font-heading">
              <span className="h-2 w-2 rounded-full bg-[#064E3B] animate-pulse" />
              <span>{isOnDuty ? "ON DUTY" : "OFF DUTY"}</span>
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Assigned Property</span>
            <span className="font-bold text-gray-900">Gulshan Avenue Parking</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500">Current Shift</span>
            <span className="font-bold text-gray-900">8:00 AM – 6:00 PM</span>
          </div>
        </div>
      </section>

      {/* 5. Security & Settings Card */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 font-heading mb-2">
          Security &amp; Settings
        </h3>

        <div className="divide-y divide-gray-100 text-xs">
          <button
            type="button"
            onClick={() => alert("Change Password modal / flow")}
            className="flex w-full items-center justify-between py-2.5 text-left hover:text-[#064E3B] transition-colors [-webkit-tap-highlight-color:transparent]"
          >
            <div className="flex items-center gap-2.5">
              <Lock className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-800">Change Password</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>

          <div className="flex w-full items-center justify-between py-2.5">
            <div className="flex items-center gap-2.5">
              <Smartphone className="h-4 w-4 text-gray-400" />
              <div>
                <p className="font-medium text-gray-800">Remembered Device</p>
                <p className="text-[10px] text-gray-400">Current device</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </section>

      {/* 6. Support & Policies Card */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 font-heading mb-2">
          Support &amp; Policies
        </h3>

        <div className="divide-y divide-gray-100 text-xs">
          <Link
            href="/support"
            className="flex items-center justify-between py-2.5 hover:text-[#064E3B] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-800">Help &amp; Support</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </Link>

          <Link
            href="/privacy"
            className="flex items-center justify-between py-2.5 hover:text-[#064E3B] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-800">Privacy Policy</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </Link>

          <Link
            href="/safety"
            className="flex items-center justify-between py-2.5 hover:text-[#064E3B] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-800">Safety Guidelines</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </Link>
        </div>
      </section>

      {/* 7. Scope Notice & Sign Out Button */}
      <div className="space-y-3 pt-1">
        {/* Scope Info Box */}
        <div className="flex items-start gap-2.5 rounded-xl border border-indigo-100 bg-[#f0f4ff] p-3 text-xs leading-relaxed text-slate-600">
          <Info className="h-4 w-4 shrink-0 text-indigo-500 mt-0.5" />
          <p className="text-[11px]">
            Your account access is limited to the property, bookings, and parking operations assigned to you.
          </p>
        </div>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-100/80 py-3 text-xs font-bold text-red-700 transition-colors hover:bg-red-200 active:scale-[0.99] [-webkit-tap-highlight-color:transparent]"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>

        {/* Footnote: Last login */}
        <p className="text-center text-[11px] text-gray-400">
          Last login: Today, 7:52 AM
        </p>
      </div>
    </div>
  );
}
