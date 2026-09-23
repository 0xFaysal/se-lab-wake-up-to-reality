"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Smartphone,
  Mail,
  Loader2,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api/auth-api";
import { ApiError, getApiErrorMessage } from "@/lib/api/api-error";
import { resolvePostLoginRedirect } from "@/lib/auth-routing";
import { queryKeys } from "@/lib/query-keys";
import type { AuthUser } from "@/lib/api/api-types";
import { useCurrentUser } from "@/hooks/use-current-user";

export function OtpVerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = useCurrentUser();
  const queryClient = useQueryClient();

  // Read URL query parameters
  const initialType = searchParams.get("type") === "phone" ? "phone" : "email";
  const action = searchParams.get("action") || "login";
  const redirectTarget = searchParams.get("redirect") || "/driver/bookings";

  // State
  const [selectedChannel, setChannel] = useState<"phone" | "email">(initialType);
  const channel = currentUser.data?.emailVerified === false ? "email" : selectedChannel;
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [delivery, setDelivery] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const requestInFlight = useRef(false);
  const initialRequestStarted = useRef(false);

  const continueForUser = useCallback((user: AuthUser) => {
    queryClient.setQueryData(queryKeys.auth.me, user);
    router.replace(resolvePostLoginRedirect(user, redirectTarget));
  }, [queryClient, redirectTarget, router]);

  const requestCode = useCallback(async (target: "email" | "phone") => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setDelivery("sending");
    setErrorMsg("");
    try {
      const result = await authApi.requestVerification(target);
      if (result.alreadyVerified) {
        const { user } = await authApi.me();
        continueForUser(user);
        setDelivery("idle");
        return;
      }
      setDelivery("sent");
      setCountdown(45);
      setOtp(["", "", "", "", "", ""]);
    } catch (error) {
      setDelivery("failed");
      const details = error instanceof ApiError ? error.details : undefined;
      const retryAfter = details && typeof details === "object" && "retryAfterSeconds" in details
        ? details.retryAfterSeconds : undefined;
      if (error instanceof ApiError && error.status === 429 &&
          typeof retryAfter === "number" && Number.isFinite(retryAfter) && retryAfter > 0) {
        setCountdown(Math.ceil(retryAfter));
      }
      if (error instanceof ApiError && error.code === "REQUEST_TIMEOUT") {
        setCountdown(45);
        setErrorMsg("Sending is taking longer than expected. Check your inbox and spam folder before requesting another code.");
      } else {
        setErrorMsg(getApiErrorMessage(error));
      }
    } finally {
      requestInFlight.current = false;
    }
  }, [continueForUser]);

  useEffect(() => {
    if (!currentUser.data || currentUser.isFetching || currentUser.isError || initialRequestStarted.current) return;
    // A ref prevents React Strict Mode from sending the initial email twice.
    initialRequestStarted.current = true;
    void requestCode(channel);
  }, [channel, currentUser.data, currentUser.isFetching, currentUser.isError, requestCode]);

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

  const resolvedIdentifier = (channel === "phone" ? currentUser.data?.phone : currentUser.data?.email) || "";
  const maskedDisplay = resolvedIdentifier ? (channel === "phone" ? maskPhone(resolvedIdentifier) : maskEmail(resolvedIdentifier)) : `your registered ${channel}`;

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
  async function handleSwitchChannel() {
    if (!currentUser.data || countdown > 0 || requestInFlight.current || isSubmitting) return;
    const nextChannel = channel === "phone" ? "email" : "phone";
    if (nextChannel === "phone" && !currentUser.data.emailVerified) return;
    setChannel(nextChannel);
    setOtp(["", "", "", "", "", ""]);
    setCountdown(0);
    await requestCode(nextChannel);
  }

  // Resend code handler
  async function handleResend() {
    if (!currentUser.data || countdown > 0 || requestInFlight.current || isSubmitting) return;
    await requestCode(channel);
  }

  // Submit OTP
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (requestInFlight.current || isSubmitting) return;
    const fullCode = otp.join("");
    if (fullCode.length < 6) {
      setErrorMsg("Please enter all 6 digits of the verification code.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await authApi.confirmVerification(channel, fullCode);
      const { user } = await authApi.me();
      setIsSubmitting(false);
      continueForUser(user);
    } catch (error) {
      setIsSubmitting(false);
      setErrorMsg(getApiErrorMessage(error));
    }
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
              {delivery === "sending" ? "Sending a 6-digit code to " :
                delivery === "sent" ? "A 6-digit code was sent to " : "Verification email or SMS for "}
              <strong className="font-mono text-primary font-bold">{maskedDisplay}</strong>
            </p>
          </div>
        </div>

        {/* Switch Verification Method Link */}
        {(channel === "phone" || currentUser.data?.emailVerified) && <div className="border-t border-primary/15 pt-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground text-[11px]">Didn&apos;t receive it here?</span>
          <button
            type="button"
            onClick={handleSwitchChannel}
            disabled={delivery === "sending" || countdown > 0 || isSubmitting || !currentUser.data}
            className="text-primary hover:underline font-bold text-xs cursor-pointer font-heading"
          >
            {channel === "phone"
              ? "Verify via Email instead →"
              : "Verify via SMS instead →"}
          </button>
        </div>}
      </div>

      {delivery === "sent" && (
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

          {(errorMsg || currentUser.error) && (
            <p role="alert" className="text-xs font-semibold text-destructive pt-1">{errorMsg || getApiErrorMessage(currentUser.error)}</p>
          )}
        </div>

        {/* Resend Action & Countdown */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span>Didn&apos;t get the code?</span>
          {delivery === "sending" ? (
            <span role="status" className="inline-flex items-center gap-1.5">
              <Loader2 className="size-3 animate-spin" /> Sending code...
            </span>
          ) : countdown > 0 ? (
            <span className="font-mono text-foreground font-semibold">
              Resend in {countdown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isSubmitting || !currentUser.data}
              className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline cursor-pointer font-heading"
            >
              <RefreshCw className="size-3" />
              {delivery === "sent" ? "Resend Code" : "Send Code"}
            </button>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting || delivery === "sending" || !currentUser.data}
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
