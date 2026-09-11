"use client";

import React, { useState } from "react";
import { OwnerSidebar } from "@/components/owner/owner-sidebar";
import { OwnerFooter } from "@/components/owner/owner-footer";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function OwnerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-slate-800 flex flex-col">
      {/* Desktop Fixed Left Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 bottom-0 z-30">
        <OwnerSidebar />
      </div>

      {/* Mobile Top Bar (Only on mobile/tablet) */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-[#E5E7EB] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-[#064E3B] text-white flex items-center justify-center font-bold text-sm">
            P
          </div>
          <div>
            <span className="font-heading font-extrabold text-sm text-slate-900 block leading-tight">
              ParkEase BD
            </span>
            <span className="text-[10px] font-medium text-slate-500">
              Owner Management
            </span>
          </div>
        </div>

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger
            render={
              <button
                className="p-2 rounded-lg border border-[#E5E7EB] text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                aria-label="Open navigation menu"
              >
                {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            }
          />
          <SheetContent side="left" className="p-0 w-64 border-r border-[#E5E7EB]">
            <OwnerSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Workspace Column */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <main className="flex-1 pb-12">{children}</main>
        <OwnerFooter />
      </div>
    </div>
  );
}
