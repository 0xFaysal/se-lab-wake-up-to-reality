"use client";

import React, { useState } from "react";
import { ManagerSidebar } from "@/components/manager/manager-sidebar";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { RoleGuard } from "@/components/auth/role-guard";
import { BrandIcon } from "@/components/common/app-logo";
import Link from "next/link";

function ManagerFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-500 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div>
          <span className="font-bold text-slate-800">ParkEase BD</span>{" "}
          <span>© 2026 ParkEase BD. Manager Portal.</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="transition-colors hover:text-slate-800">
            Privacy Policy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-slate-800">
            Terms of Service
          </Link>
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
            <span className="size-2 animate-pulse rounded-full bg-emerald-600" />
            System Status
          </span>
        </div>
      </div>
    </footer>
  );
}

export default function ManagerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-slate-800 flex flex-col">
      {/* Desktop Fixed Left Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 bottom-0 z-30">
        <ManagerSidebar />
      </div>

      {/* Mobile Top Bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BrandIcon size={32} className="size-8" />
          <div>
            <span className="font-heading font-extrabold text-sm text-slate-900 block leading-tight">
              ParkEase BD
            </span>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              Manager Portal
            </span>
          </div>
        </div>

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger
            render={
              <button
                className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                aria-label="Open navigation menu"
              >
                {mobileMenuOpen ? (
                  <X className="size-5" />
                ) : (
                  <Menu className="size-5" />
                )}
              </button>
            }
          />
          <SheetContent side="left" className="p-0 w-64 border-r border-slate-200">
            <ManagerSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Workspace Column */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <main className="flex-1 pb-12">
          <RoleGuard roles={["MANAGER"]}>{children}</RoleGuard>
        </main>
        <ManagerFooter />
      </div>
    </div>
  );
}
