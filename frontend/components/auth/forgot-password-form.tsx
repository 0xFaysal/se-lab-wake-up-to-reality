"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeyRound,
  Mail,
  Smartphone,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ResetMethod = "EMAIL" | "PHONE";

export function ForgotPasswordForm() {
  const router = useRouter();

  // Multi-step state: 1: Enter contact, 2: Enter OTP & New Password, 3: Success
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [method, setMethod] = useState<ResetMethod>("EMAIL");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Masking helpers
  function getMaskedIdentifier(val: string, type: ResetMethod) {
    if (type === "PHONE") {
      const clean = val.trim();
      if (clean.length < 8) return clean;
      return clean.slice(0, 6) + "****" + clean.slice(-4);
    }
    const [user, domain] = val.split("@");
    if (!domain) return val;
    const maskedUser =
      user.length > 2 ? user.slice(0, 2) + "***" + user.slice(-1) : user + "***";
    return `${maskedUser}@${domain}`;
  }

  // Handle Step 1: Send verification code
  function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg(
        method === "EMAIL"
          ? "Please enter your registered email address."
          : "Please enter your registered phone number."
      );
      return;
    }

    if (method === "EMAIL" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (
      method === "PHONE" &&
      !/^(?:\+?880|0)1[3-9]\d{8}$/.test(identifier.replace(/\s/g, ""))
    ) {
      setErrorMsg("Please enter a valid Bangladeshi phone number (e.g. 01712345678).");
      return;
    }

    setErrorMsg("");
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setStep(2);
    }, 800);
  }

  // Handle OTP digit changes
  function handleDigitChange(index: number, value: string) {
    setErrorMsg("");
    const cleaned = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleaned;
    setOtp(newOtp);

    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    const nextIdx = Math.min(pastedData.length, 5);
    inputRefs.current[nextIdx]?.focus();
  }

  // Handle Step 2: Reset Password submission
  function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length < 6) {
      setErrorMsg("Please enter the 6-digit verification code.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setErrorMsg("");
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setStep(3);
    }, 1000);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <AnimatePresence mode="wait">
        {/* STEP 1: Enter contact info */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold font-heading">
                <KeyRound className="size-4" />
                Password Recovery
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-heading">
                Reset your password
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your registered email or phone to receive a verification OTP.
              </p>
            </div>

            {/* Method Tabs: Email vs Phone */}
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/60 p-1 border border-border/60">
              <button
                type="button"
                onClick={() => {
                  setMethod("EMAIL");
                  setErrorMsg("");
                }}
                className={cn(
                  "flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer font-heading",
                  method === "EMAIL"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Mail className="size-3.5" />
                Email Address
              </button>

              <button
                type="button"
                onClick={() => {
                  setMethod("PHONE");
                  setErrorMsg("");
                }}
                className={cn(
                  "flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer font-heading",
                  method === "PHONE"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Smartphone className="size-3.5" />
                Phone Number
              </button>
            </div>

            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="contact-input"
                  className="text-xs font-bold text-foreground uppercase tracking-wider font-heading"
                >
                  {method === "EMAIL" ? "Registered Email" : "Registered Phone"}
                </Label>
                <Input
                  id="contact-input"
                  type={method === "EMAIL" ? "email" : "tel"}
                  placeholder={
                    method === "EMAIL" ? "name@example.com" : "017XXXXXXXX or +880 1XXXXXXXXX"
                  }
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="h-11 text-sm rounded-lg urban-input bg-[#F3F4F6] focus:bg-white border-transparent focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              {errorMsg && (
                <p className="text-xs font-semibold text-destructive">{errorMsg}</p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 text-sm font-bold bg-[#064E3B] text-white hover:bg-[#003527] rounded-lg shadow-xs transition-all cursor-pointer font-heading"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Sending Code…
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </Button>
            </form>

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
        )}

        {/* STEP 2: Enter OTP & New Password */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold font-heading">
                <ShieldCheck className="size-4" />
                Verify & Set Password
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-heading">
                Set new password
              </h1>
              <p className="text-xs text-foreground font-medium leading-relaxed bg-primary/5 border border-primary/20 rounded-xl p-3">
                We sent a 6-digit code to{" "}
                <strong className="font-mono text-primary font-bold">
                  {getMaskedIdentifier(identifier, method)}
                </strong>
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* 6-Digit OTP */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground uppercase tracking-wider font-heading">
                    Enter 6-Digit Code
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      setOtp(["4", "8", "2", "7", "3", "1"]);
                      setErrorMsg("");
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    <Sparkles className="size-3" />
                    Fill Demo (482731)
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
                      className="size-11 sm:size-12 rounded-xl border border-border bg-[#F3F4F6] text-center text-xl font-black font-mono text-foreground focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-hidden"
                    />
                  ))}
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="new-password"
                  className="text-xs font-bold text-foreground uppercase tracking-wider font-heading"
                >
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11 text-sm pr-10 rounded-lg urban-input bg-[#F3F4F6] focus:bg-white border-transparent focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="confirm-password"
                  className="text-xs font-bold text-foreground uppercase tracking-wider font-heading"
                >
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 text-sm pr-10 rounded-lg urban-input bg-[#F3F4F6] focus:bg-white border-transparent focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs font-semibold text-destructive">{errorMsg}</p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 text-sm font-bold bg-[#064E3B] text-white hover:bg-[#003527] rounded-lg shadow-xs transition-all cursor-pointer font-heading"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Resetting Password…
                  </>
                ) : (
                  "Update Password & Sign In"
                )}
              </Button>
            </form>

            <div className="border-t border-border pt-3 text-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer font-heading"
              >
                <ArrowLeft className="size-3.5" />
                Change recovery contact
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Success Confirmation */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center py-4"
          >
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-primary ring-8 ring-emerald-50 shadow-inner">
              <CheckCircle2 className="size-9 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground font-heading">
                Password reset successfully!
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Your password has been updated. You can now sign in with your new credentials.
              </p>
            </div>

            <Button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full h-11 text-sm font-bold bg-[#064E3B] text-white hover:bg-[#003527] rounded-lg shadow-xs cursor-pointer font-heading"
            >
              Continue to Sign In
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
