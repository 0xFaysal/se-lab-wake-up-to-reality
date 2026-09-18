import React from "react";
import type { Metadata, Viewport } from "next";
import { GuardTopBar } from "@/features/guard/components/guard-top-bar";
import { GuardBottomNav } from "@/features/guard/components/guard-bottom-nav";
import { RoleGuard } from "@/components/auth/role-guard";

export const metadata: Metadata = {
  title: "Security Guard Portal | ParkEase BD",
  description: "Mobile App Shell for ParkEase BD Gate Guards and Parking Marshals",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function GuardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#111827] text-foreground flex items-center justify-center sm:py-0">
      {/* 
        App Shell Mobile Container:
        - Locks height to 100dvh for zero mobile address-bar shifting
        - max-w-md for mobile phone presentation on desktop
        - overscroll-contain to prevent browser rubber-banding
      */}
      <div className="relative flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-[#f9f9ff] shadow-2xl border-x border-[#E5E7EB]/50 select-none">
        {/* Fixed Top App Bar */}
        <GuardTopBar />

        {/* Scrollable Main Content Area with bottom padding for fixed navigation & FAB */}
        <main className="flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-24 [-webkit-overflow-scrolling:touch]">
          <RoleGuard roles={["GUARD"]}>{children}</RoleGuard>
        </main>

        {/* Fixed Bottom Navigation with Raised FAB */}
        <GuardBottomNav />
      </div>
    </div>
  );
}
