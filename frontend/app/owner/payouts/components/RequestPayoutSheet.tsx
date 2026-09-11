"use client";

import React, { useState } from "react";
import {
  ArrowUpRight,
  Wallet,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Info,
  Check,
  X,
  FileText,
  Smartphone,
  Plus,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface RequestPayoutSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance?: number;
  onSuccess?: (payout: {
    id: string;
    amount: number;
    method: string;
    accountMask: string;
    date: string;
  }) => void;
}

export function RequestPayoutSheet({
  open,
  onOpenChange,
  availableBalance = 18600,
  onSuccess,
}: RequestPayoutSheetProps) {
  const [amount, setAmount] = useState<string>(availableBalance.toString());
  const [selectedMethod, setSelectedMethod] = useState<"brac-4821" | "city-1092" | "bkash-9012">(
    "brac-4821"
  );
  const [keepAutoSchedule, setKeepAutoSchedule] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedPayout, setSubmittedPayout] = useState<{
    id: string;
    amount: number;
    method: string;
    accountMask: string;
  } | null>(null);

  const numAmount = parseFloat(amount) || 0;
  const isValidAmount = numAmount >= 1000 && numAmount <= availableBalance;

  const handlePreset = (percent: number) => {
    const val = Math.round(availableBalance * percent);
    setAmount(val.toString());
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAmount) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const newId = `PR-${Math.floor(1000 + Math.random() * 9000)}`;
      const methodInfo =
        selectedMethod === "brac-4821"
          ? { method: "BRAC Bank Limited", accountMask: "•••• 4821" }
          : selectedMethod === "city-1092"
          ? { method: "City Bank Limited", accountMask: "•••• 1092" }
          : { method: "bKash Merchant Wallet", accountMask: "•••• 9012" };

      const payoutResult = {
        id: newId,
        amount: numAmount,
        method: methodInfo.method,
        accountMask: methodInfo.accountMask,
        date: "Just now",
      };

      setSubmittedPayout(payoutResult);
      if (onSuccess) {
        onSuccess(payoutResult);
      }
    }, 900);
  };

  const handleClose = () => {
    setSubmittedPayout(null);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-white p-0 flex flex-col justify-between overflow-y-auto border-l border-[#E5E7EB]"
      >
        {/* ================================================================== */}
        {/* SUCCESS CONFIRMATION STATE                                         */}
        {/* ================================================================== */}
        {submittedPayout ? (
          <div className="flex flex-col h-full justify-between p-6 animate-in fade-in duration-200">
            <div className="space-y-6 pt-6 text-center">
              {/* Animated Checkmark Bubble */}
              <div className="size-16 rounded-2xl bg-emerald-100 text-[#064E3B] flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="size-9 stroke-[2.5]" />
              </div>

              <div>
                <h3 className="text-xl font-bold font-heading text-slate-900">
                  Payout Request Submitted!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Batch Reference:{" "}
                  <span className="font-mono font-bold text-slate-800">
                    #{submittedPayout.id}
                  </span>
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Requested Amount</span>
                  <span className="font-bold font-heading text-slate-900 text-sm">
                    ৳{submittedPayout.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Destination Account</span>
                  <span className="font-semibold text-slate-800">
                    {submittedPayout.method} ({submittedPayout.accountMask})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Platform Processing Fee</span>
                  <span className="font-bold text-emerald-700">৳0 (Free)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Estimated Clearance</span>
                  <span className="font-semibold text-slate-800">1 to 2 business days</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2.5 text-xs text-left text-emerald-950">
                <Info className="size-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Your request has been routed to the ParkEase Finance Desk. You will receive an SMS
                  notification as soon as funds are cleared by Bangladesh Bank BEFTN network.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-6">
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3 rounded-xl bg-[#064E3B] hover:bg-[#064E3B]/90 text-white text-xs font-bold shadow-sm transition active:scale-98 cursor-pointer"
              >
                Return to Payouts
              </button>
            </div>
          </div>
        ) : (
          /* ================================================================== */
          /* FORM STATE                                                         */
          /* ================================================================== */
          <form onSubmit={handleFormSubmit} className="flex flex-col h-full justify-between">
            {/* Header */}
            <div className="p-6 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-emerald-50 text-[#064E3B] flex items-center justify-center">
                  <ArrowUpRight className="size-5 stroke-[2.5]" />
                </div>
                <div>
                  <SheetTitle className="text-base font-bold font-heading text-slate-900">
                    Request Payout
                  </SheetTitle>
                  <SheetDescription className="text-xs text-slate-500 mt-0.5">
                    Transfer settled parking earnings to your bank account
                  </SheetDescription>
                </div>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              {/* Balance Capsule */}
              <div className="p-4 rounded-xl bg-[#f9f9ff] border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Available Balance
                  </span>
                  <span className="text-2xl font-black font-heading text-slate-900 mt-0.5 block">
                    ৳{availableBalance.toLocaleString()}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  0% Service Fee
                </span>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Withdrawal Amount (BDT)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-heading font-black text-slate-400 text-sm">
                    ৳
                  </span>
                  <input
                    type="number"
                    min={1000}
                    max={availableBalance}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm font-heading font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#064E3B] focus:border-[#064E3B] transition"
                  />
                </div>

                {/* Percentage Presets */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[
                    { label: "25%", val: 0.25 },
                    { label: "50%", val: 0.5 },
                    { label: "75%", val: 0.75 },
                    { label: "100%", val: 1.0 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handlePreset(p.val)}
                      className={cn(
                        "py-1 text-center rounded-md text-xs font-semibold border transition cursor-pointer",
                        numAmount === Math.round(availableBalance * p.val)
                          ? "bg-[#064E3B] text-white border-[#064E3B]"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-transparent"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {!isValidAmount && numAmount > 0 && (
                  <p className="text-[11px] text-rose-600 font-medium pt-1">
                    {numAmount < 1000
                      ? "Minimum payout amount is ৳1,000."
                      : "Amount cannot exceed current available balance."}
                  </p>
                )}
              </div>

              {/* Destination Account Selection */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Select Payout Account
                </label>
                <div className="space-y-2">
                  {/* Option 1: BRAC Bank */}
                  <label
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition",
                      selectedMethod === "brac-4821"
                        ? "border-[#064E3B] bg-emerald-50/40 ring-1 ring-[#064E3B]/20"
                        : "border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payout-method"
                        checked={selectedMethod === "brac-4821"}
                        onChange={() => setSelectedMethod("brac-4821")}
                        className="text-[#064E3B] focus:ring-[#064E3B]"
                      />
                      <div className="size-8 rounded-lg bg-emerald-100 text-[#064E3B] flex items-center justify-center shrink-0">
                        <Landmark className="size-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">BRAC Bank Limited</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          •••• 4821 (Primary Account)
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      Verified
                    </span>
                  </label>

                  {/* Option 2: City Bank */}
                  <label
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition",
                      selectedMethod === "city-1092"
                        ? "border-[#064E3B] bg-emerald-50/40 ring-1 ring-[#064E3B]/20"
                        : "border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payout-method"
                        checked={selectedMethod === "city-1092"}
                        onChange={() => setSelectedMethod("city-1092")}
                        className="text-[#064E3B] focus:ring-[#064E3B]"
                      />
                      <div className="size-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <Landmark className="size-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">City Bank Limited</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          •••• 1092 (Secondary)
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Verified
                    </span>
                  </label>

                  {/* Option 3: bKash Merchant */}
                  <label
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition",
                      selectedMethod === "bkash-9012"
                        ? "border-[#064E3B] bg-emerald-50/40 ring-1 ring-[#064E3B]/20"
                        : "border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payout-method"
                        checked={selectedMethod === "bkash-9012"}
                        onChange={() => setSelectedMethod("bkash-9012")}
                        className="text-[#064E3B] focus:ring-[#064E3B]"
                      />
                      <div className="size-8 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                        <Smartphone className="size-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">bKash Merchant Wallet</div>
                        <div className="text-[11px] text-slate-500 font-mono">•••• 9012 (Instant)</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded">
                      Fast MFS
                    </span>
                  </label>
                </div>
              </div>

              {/* Settlement Calculation Summary */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Gross Withdrawal</span>
                  <span className="font-bold text-slate-900">
                    ৳{isValidAmount ? numAmount.toLocaleString() : "0"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">BEFTN Bank Processing Fee</span>
                  <span className="font-bold text-emerald-700">৳0 (Free)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Estimated Clearance Time</span>
                  <span className="font-medium text-slate-700">Within 24–48 hours</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-sm font-bold">
                  <span className="text-slate-900">Net Receivable</span>
                  <span className="text-[#064E3B] font-heading font-black text-base">
                    ৳{isValidAmount ? numAmount.toLocaleString() : "0"}
                  </span>
                </div>
              </div>

              {/* Schedule Checkbox */}
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={keepAutoSchedule}
                  onChange={(e) => setKeepAutoSchedule(e.target.checked)}
                  className="rounded border-slate-300 text-[#064E3B] focus:ring-[#064E3B]"
                />
                <span>Maintain regular Sunday auto-settlement schedule</span>
              </label>
            </div>

            {/* Sticky Footer */}
            <div className="p-6 border-t border-[#E5E7EB] bg-white flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValidAmount || isSubmitting}
                className="px-5 py-2.5 rounded-lg bg-[#064E3B] hover:bg-[#064E3B]/90 text-white text-xs font-bold shadow-sm transition active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Processing..." : "Confirm & Request Payout"}
              </button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
