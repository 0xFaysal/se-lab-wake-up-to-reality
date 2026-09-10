"use client";

import { useState } from "react";
import { Laptop, Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChangePasswordModal } from "./change-password-modal";

export function SecuritySettingsCard() {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs urban-card-shadow space-y-5">
        {/* Header */}
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground font-heading">
            Account Security
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Protect your account and manage active sessions.
          </p>
        </div>

        {/* Password Row */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <div>
            <span className="text-sm font-bold text-foreground font-heading block">
              Password
            </span>
            <span className="text-xs text-muted-foreground">
              Last changed recently
            </span>
          </div>

          <Button
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
            className="rounded-lg text-xs font-bold h-9 px-4 bg-[#064E3B] text-white hover:bg-[#003527] cursor-pointer font-heading shadow-xs"
          >
            Change Password
          </Button>
        </div>

        <div className="h-px bg-border/80" />

        {/* Remembered Devices */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground font-heading">
              Remembered Devices
            </span>
            <button
              type="button"
              onClick={() =>
                alert("Session management: Windows PC is currently the only active authorized session.")
              }
              className="text-xs font-bold text-primary hover:underline cursor-pointer font-heading"
            >
              Manage Devices
            </button>
          </div>

          {/* Device Card */}
          <div className="flex items-center gap-3.5 rounded-xl border border-border/70 bg-muted/30 p-3.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-card border border-border text-foreground/80">
              <Laptop className="size-4.5" />
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-xs sm:text-sm font-bold text-foreground font-heading block truncate">
                Windows PC — Dhaka
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] text-emerald-800 font-semibold">
                  Current device
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Alert Banner */}
        <div className="rounded-xl bg-blue-50/70 border border-blue-100/90 p-3.5 sm:p-4 flex items-start gap-3 text-xs text-blue-950">
          <Shield className="size-4.5 text-blue-700 shrink-0 mt-0.5" />
          <p className="text-blue-900 leading-relaxed text-xs">
            Never share your password, booking OTP, or access credentials with
            anyone. ParkEase BD will never call to ask for your password.
          </p>
        </div>
      </div>

      {/* Interactive Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </>
  );
}
