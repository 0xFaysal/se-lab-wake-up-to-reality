"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Smartphone,
  Mail,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function OtpVerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL query parameters
  const initialIdentifier = searchParams.get("identifier") || "+880 1712-345678";
  const initialType = (searchParams.get("type") as "phone" | "email") || "phone";
  const altIdentifier = searchParams.get("altIdentifier") || "user@example.com";
  const action = searchParams.get("action") || "login";
  const redirectTarget = searchParams.get("redirect") || "/driver/bookings";

  // State
  const [channel, setChannel] = useState<"phone" | "email">(initialType);
  const [activeIdentifier, setActiveIdentifier] = useState(initialIdentifier);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Masking helpers
  function maskEmail(email: string) {
    const [user, domain] = email.split("@");
    if (!domain) return email;
    const maskedUser =
      user.length > 2 ? user.slice(0, 2) + "***" + user.slice(-1) : user + "***";
    return `${maskedUser}@${domain}`;
  }

  function maskPhone(phone: string) {
    const clean = phone.trim();
    if (clean.length < 8) return clean;
    return clean.slice(0, 6) + "****" + clean.slice(-4);
  }

  const maskedDisplay =
    channel === "phone" ? maskPhone(activeIdentifier) : maskEmail(activeIdentifier);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle single digit input and auto-advance
  function handleDigitChange(index: number, value: string) {
    setErrorMsg("");
    // Take only the last entered char if multiple, must be digit
    const cleaned = value.replace(/\D/g, "").slice(-1);

    const newOtp = [...otp];
    newOtp[index] = cleaned;
    setOtp(newOtp);

    // If digit entered, jump to next input
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  // Handle backspace navigation
  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  // Handle paste of full 6-digit code
  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    // Focus last filled box
    const nextIdx = Math.min(pastedData.length, 5);
    inputRefs.current[nextIdx]?.focus();
  }

  // Toggle channel (SMS <-> Email)
  function handleSwitchChannel() {
    setErrorMsg("");
    if (channel === "phone") {
      setChannel("email");
      setActiveIdentifier(altIdentifier || "anisa.rahman@example.com");
    } else {
      setChannel("phone");
      setActiveIdentifier(initialIdentifier.includes("@") ? "+880 1712-345678" : initialIdentifier);
    }
    setCountdown(45);
    setResendSuccess(true);
    setTimeout(() => setResendSuccess(false), 3000);
  }

  // Fill demo code helper
  function handleFillDemoCode() {
    setOtp(["4", "8", "2", "7", "3", "1"]);
    setErrorMsg("");
    inputRefs.current[5]?.focus();
  }

  // Resend code handler
  function handleResend() {
    if (countdown > 0) return;
    setCountdown(45);
    setResendSuccess(true);
    setTimeout(() => setResendSuccess(false), 3000);
  }

  // Submit OTP
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fullCode = otp.join("");
    if (fullCode.length < 6) {
      setErrorMsg("Please enter all 6 digits of the verification code.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    // Simulate verification
    setTimeout(() => {
      setIsSubmitting(false);
      router.push(redirectTarget);
    }, 1000);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold font-heading">
          <ShieldCheck className="size-4" />
          Two-Step Verification
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-heading">
          {action === "signup" ? "Verify your account" : "Enter security code"}
        </h1>

        <p className="text-sm text-muted-foreground">
          For your account safety, verify your identity to proceed.
        </p>
      </div>

      {/* Recipient Information Callout */}
      <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 space-y-2">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-2xs">
            {channel === "phone" ? (
              <Smartphone className="size-5" />
            ) : (
              <Mail className="size-5" />
            )}
          </div>
          <div className="space-y-0.5 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider font-heading">
                {channel === "phone" ? "SMS Verification" : "Email Verification"}
              </span>
              <span className="inline-flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs text-foreground font-medium leading-relaxed">
              We sent a 6-digit code to{" "}
              <strong className="font-mono text-primary font-bold">{maskedDisplay}</strong>
            </p>
          </div>
        </div>

        {/* Switch Verification Method Link */}
        <div className="border-t border-primary/15 pt-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground text-[11px]">Didn't receive it here?</span>
          <button
            type="button"
            onClick={handleSwitchChannel}
            className="text-primary hover:underline font-bold text-xs cursor-pointer font-heading"
          >
            {channel === "phone"
              ? "Verify via Email instead →"
              : "Verify via SMS instead →"}
          </button>
        </div>
      </div>

      {resendSuccess && (
        <div className="rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 p-2.5 text-xs font-semibold text-center animate-in fade-in">
          ✓ Fresh 6-digit code sent to {maskedDisplay}
        </div>
      )}

      {/* OTP Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 6 Digit Input Group */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider font-heading">
              Enter 6-Digit Code
            </label>
            {/* Quick Demo Helper */}
            <button
              type="button"
              onClick={handleFillDemoCode}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
            >
              <Sparkles className="size-3" />
              Fill Demo Code (482731)
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 sm:gap-2.5">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                autoFocus={idx === 0}
                className="size-12 sm:size-14 rounded-xl border border-border bg-[#F3F4F6] text-center text-xl sm:text-2xl font-black font-mono text-foreground focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-hidden"
              />
            ))}
          </div>

          {errorMsg && (
            <p className="text-xs font-semibold text-destructive pt-1">{errorMsg}</p>
          )}
        </div>

        {/* Resend Action & Countdown */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span>Didn&apos;t get the code?</span>
          {countdown > 0 ? (
            <span className="font-mono text-foreground font-semibold">
              Resend in {countdown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline cursor-pointer font-heading"
            >
              <RefreshCw className="size-3" />
              Resend Code
            </button>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 text-sm font-bold bg-[#064E3B] text-white hover:bg-[#003527] rounded-xl shadow-md transition-all cursor-pointer font-heading"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Verifying Code…
            </>
          ) : (
            "Verify & Continue"
          )}
        </Button>
      </form>

      {/* Back to Sign In / Sign Up */}
      <div className="border-t border-border pt-4 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors font-heading"
        >
          <ArrowLeft className="size-3.5" />
          Back to Sign In
        </Link>
      </div>
    </motion.div>
  );
}
