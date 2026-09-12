"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
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
            <Link
              href="/account/sessions"
              className="text-xs font-bold text-primary hover:underline cursor-pointer font-heading"
            >
              Manage Devices
            </Link>
          </div>

          <p className="rounded-xl border bg-muted/30 p-3.5 text-xs text-muted-foreground">Open Manage Devices to view the live server session list. Device names are not guessed locally.</p>
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
