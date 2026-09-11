"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X, KeyRound, ArrowRight } from "lucide-react";

interface GuardOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GuardOtpModal({ isOpen, onClose }: GuardOtpModalProps) {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError("Please enter a valid 4 to 6-digit access code");
      return;
    }
    // Navigate to the verification or booking details page (PE-BK-2051 or PE-BK-2058)
    onClose();
    router.push("/guard/bookings/PE-BK-2051");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-[#064E3B]">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm font-heading">Enter Access OTP</h3>
              <p className="text-gray-500 text-xs">Verify booking without scanning QR</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              6-Digit Access Code / Booking PIN
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              placeholder="e.g. 749215"
              className="mt-1.5 w-full rounded-xl border border-gray-300 bg-[#f9f9ff] px-4 py-3 text-center text-2xl font-bold tracking-widest text-[#064E3B] focus:border-[#064E3B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B]/20"
              autoFocus
            />
            {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
            <p className="mt-2 text-[11px] text-gray-500">
              The driver can view their active 6-digit access code inside the ParkEase BD driver app under Booking Pass.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#064E3B] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#053d2e] active:scale-[0.98]"
            >
              <span>Verify OTP</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
