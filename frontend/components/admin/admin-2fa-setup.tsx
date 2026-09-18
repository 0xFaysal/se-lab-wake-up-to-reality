"use client";

import { useState, useCallback } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Copy,
  Check,
  Loader2,
  QrCode,
  KeyRound,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────
type TwoFactorStep = "IDLE" | "GENERATE" | "VERIFY" | "ENABLED";

interface TwoFactorState {
  step: TwoFactorStep;
  secret: string;
  qrUri: string;
  backupCodes: string[];
  isEnabled: boolean;
}

// ─── Mock Secret Generator ──────────────────────────────────────────────────
function generateMockSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

function generateMockBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const code = `${Math.random().toString(36).substring(2, 6)}-${Math.random()
      .toString(36)
      .substring(2, 6)}`.toUpperCase();
    codes.push(code);
  }
  return codes;
}

function buildTotpUri(secret: string, email: string = "admin@parkease.com.bd"): string {
  return `otpauth://totp/ParkEase%20BD:${encodeURIComponent(email)}?secret=${secret}&issuer=ParkEase%20BD&algorithm=SHA1&digits=6&period=30`;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function Admin2FASetup() {
  const [state, setState] = useState<TwoFactorState>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("parkease_admin_2fa");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.isEnabled) {
            return { ...parsed, step: "ENABLED" as TwoFactorStep };
          }
        } catch { /* fallthrough */ }
      }
    }
    return {
      step: "IDLE",
      secret: "",
      qrUri: "",
      backupCodes: [],
      isEnabled: false,
    };
  });

  const [verificationCode, setVerificationCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const handleGenerate = useCallback(() => {
    setIsProcessing(true);
    // Simulate API call to generate TOTP secret
    setTimeout(() => {
      const secret = generateMockSecret();
      const qrUri = buildTotpUri(secret);
      const backupCodes = generateMockBackupCodes();
      setState({
        step: "GENERATE",
        secret,
        qrUri,
        backupCodes,
        isEnabled: false,
      });
      setIsProcessing(false);
    }, 800);
  }, []);

  const handleVerify = useCallback(() => {
    setVerifyError("");
    if (verificationCode.length !== 6 || !/^\d{6}$/.test(verificationCode)) {
      setVerifyError("Please enter a valid 6-digit code");
      return;
    }
    setIsProcessing(true);
    // Simulate verification — accept any valid 6-digit code in demo
    setTimeout(() => {
      const newState: TwoFactorState = {
        ...state,
        step: "ENABLED",
        isEnabled: true,
      };
      setState(newState);
      if (typeof window !== "undefined") {
        localStorage.setItem("parkease_admin_2fa", JSON.stringify(newState));
      }
      setIsProcessing(false);
      setVerificationCode("");
    }, 1000);
  }, [verificationCode, state]);

  const handleDisable = useCallback(() => {
    setIsProcessing(true);
    setTimeout(() => {
      setState({
        step: "IDLE",
        secret: "",
        qrUri: "",
        backupCodes: [],
        isEnabled: false,
      });
      if (typeof window !== "undefined") {
        localStorage.removeItem("parkease_admin_2fa");
      }
      setIsProcessing(false);
    }, 600);
  }, []);

  const copyToClipboard = useCallback(
    (text: string, type: "secret" | "codes") => {
      navigator.clipboard.writeText(text).then(() => {
        if (type === "secret") {
          setCopiedSecret(true);
          setTimeout(() => setCopiedSecret(false), 2000);
        } else {
          setCopiedCodes(true);
          setTimeout(() => setCopiedCodes(false), 2000);
        }
      });
    },
    []
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground font-heading flex items-center gap-2">
            <Shield className="size-5 text-[#064E3B]" />
            Two-Factor Authentication (2FA)
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Add an extra layer of security to your admin account with
            Time-based One-Time Passwords (TOTP).
          </p>
        </div>
        <Badge
          variant={state.isEnabled ? "default" : "secondary"}
          className={cn(
            "shrink-0 text-[10px] font-bold px-2.5 py-1",
            state.isEnabled
              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          )}
        >
          {state.isEnabled ? (
            <>
              <ShieldCheck className="size-3 mr-1" /> Enabled
            </>
          ) : (
            <>
              <ShieldOff className="size-3 mr-1" /> Disabled
            </>
          )}
        </Badge>
      </div>

      {/* ─── IDLE State ──────────────────────────────────────────── */}
      {state.step === "IDLE" && (
        <div className="space-y-4">
          <div className="rounded-xl bg-amber-50/70 border border-amber-100 p-4 flex items-start gap-3">
            <AlertTriangle className="size-4.5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong className="font-bold">Security Advisory:</strong> Admin
              accounts with elevated privileges should always have 2FA
              enabled. Without 2FA, a compromised password grants full
              platform access.
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isProcessing}
            className="rounded-lg text-xs font-bold h-10 px-5 bg-[#064E3B] text-white hover:bg-[#003527] cursor-pointer font-heading shadow-xs"
          >
            {isProcessing ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <KeyRound className="size-4 mr-2" />
            )}
            Set Up Two-Factor Authentication
          </Button>
        </div>
      )}

      {/* ─── GENERATE State (Show QR + Secret) ──────────────────── */}
      {state.step === "GENERATE" && (
        <div className="space-y-5">
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex size-5 items-center justify-center rounded-full bg-[#064E3B] text-white text-[10px] font-bold">
              1
            </span>
            <span className="font-bold text-foreground">
              Scan QR Code with your authenticator app
            </span>
            <ArrowRight className="size-3 text-slate-400" />
            <span className="flex size-5 items-center justify-center rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">
              2
            </span>
            <span>Verify code</span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* QR Code placeholder */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-6 space-y-3">
              <div className="flex size-44 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm">
                <div className="text-center space-y-2">
                  <QrCode className="size-24 text-[#064E3B] mx-auto" />
                  <p className="text-[10px] text-slate-500 max-w-[140px]">
                    Scan with Google Authenticator, Authy, or 1Password
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Point your authenticator app camera at this code
              </p>
            </div>

            {/* Manual entry */}
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-bold text-foreground mb-1.5 block">
                  Manual Entry Key
                </Label>
                <p className="text-[10px] text-muted-foreground mb-2">
                  If you can&apos;t scan the QR code, enter this key manually in
                  your authenticator app.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-lg border bg-slate-50 px-3 py-2.5 text-xs font-mono tracking-widest text-slate-800 select-all break-all">
                    {state.secret.match(/.{1,4}/g)?.join(" ") ?? state.secret}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(state.secret, "secret")
                    }
                    className="shrink-0 h-9 w-9 p-0"
                  >
                    {copiedSecret ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Backup codes */}
              <div>
                <Label className="text-xs font-bold text-foreground mb-1.5 block">
                  Backup Recovery Codes
                </Label>
                <p className="text-[10px] text-muted-foreground mb-2">
                  Save these codes securely. Each code can be used once to
                  sign in if you lose access to your authenticator.
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {state.backupCodes.map((code, i) => (
                    <code
                      key={i}
                      className="rounded border bg-slate-50 px-2 py-1.5 text-center text-[11px] font-mono text-slate-700"
                    >
                      {code}
                    </code>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      state.backupCodes.join("\n"),
                      "codes"
                    )
                  }
                  className="mt-2 text-xs h-8"
                >
                  {copiedCodes ? (
                    <Check className="size-3 mr-1.5 text-emerald-600" />
                  ) : (
                    <Copy className="size-3 mr-1.5" />
                  )}
                  {copiedCodes ? "Copied!" : "Copy All Codes"}
                </Button>
              </div>
            </div>
          </div>

          {/* Proceed to verify */}
          <Button
            onClick={() => setState((prev) => ({ ...prev, step: "VERIFY" }))}
            className="rounded-lg text-xs font-bold h-10 px-5 bg-[#064E3B] text-white hover:bg-[#003527] cursor-pointer font-heading shadow-xs"
          >
            I&apos;ve saved my backup codes
            <ArrowRight className="size-4 ml-2" />
          </Button>
        </div>
      )}

      {/* ─── VERIFY State (Enter TOTP code) ─────────────────────── */}
      {state.step === "VERIFY" && (
        <div className="space-y-5">
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
              ✓
            </span>
            <span className="text-muted-foreground line-through">
              Scan QR Code
            </span>
            <ArrowRight className="size-3 text-slate-400" />
            <span className="flex size-5 items-center justify-center rounded-full bg-[#064E3B] text-white text-[10px] font-bold">
              2
            </span>
            <span className="font-bold text-foreground">
              Verify code from your authenticator
            </span>
          </div>

          <div className="max-w-sm space-y-4">
            <div>
              <Label
                htmlFor="totp-code"
                className="text-xs font-bold text-foreground mb-1.5 block"
              >
                Verification Code
              </Label>
              <p className="text-[10px] text-muted-foreground mb-2">
                Enter the 6-digit code from your authenticator app to
                complete setup.
              </p>
              <Input
                id="totp-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setVerificationCode(val);
                  setVerifyError("");
                }}
                className={cn(
                  "h-12 text-center text-2xl font-mono tracking-[0.5em] border-2",
                  verifyError
                    ? "border-red-300 focus-visible:ring-red-200"
                    : "border-slate-200 focus-visible:ring-emerald-200"
                )}
              />
              {verifyError && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">
                  {verifyError}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setState((prev) => ({ ...prev, step: "GENERATE" }))
                }
                className="text-xs h-10"
              >
                Back
              </Button>
              <Button
                onClick={handleVerify}
                disabled={isProcessing || verificationCode.length !== 6}
                className="rounded-lg text-xs font-bold h-10 px-5 bg-[#064E3B] text-white hover:bg-[#003527] cursor-pointer font-heading shadow-xs flex-1"
              >
                {isProcessing ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <ShieldCheck className="size-4 mr-2" />
                )}
                Verify & Enable 2FA
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ENABLED State ──────────────────────────────────────── */}
      {state.step === "ENABLED" && (
        <div className="space-y-4">
          <div className="rounded-xl bg-emerald-50/70 border border-emerald-100 p-4 flex items-start gap-3">
            <ShieldCheck className="size-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-emerald-900">
                Two-Factor Authentication is active
              </p>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                Your admin account now requires a TOTP code from your
                authenticator app when signing in. This significantly
                reduces the risk of unauthorized access.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleGenerate}
              disabled={isProcessing}
              className="text-xs h-9"
            >
              <RefreshCw className="size-3.5 mr-1.5" />
              Regenerate Codes
            </Button>
            <Button
              variant="outline"
              onClick={handleDisable}
              disabled={isProcessing}
              className="text-xs h-9 text-red-700 border-red-200 hover:bg-red-50 hover:text-red-800"
            >
              {isProcessing ? (
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
              ) : (
                <ShieldOff className="size-3.5 mr-1.5" />
              )}
              Disable 2FA
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
