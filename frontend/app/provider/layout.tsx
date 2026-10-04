"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus } from "lucide-react";
import {
  mobilePrimary,
  providerGroups,
  providerRouteActive as isActive,
} from "@/components/provider/provider-navigation";
import { ProviderAccountMenu } from "@/components/provider/provider-account-menu";
import "./provider-workspace.css";
import { OwnerSidebar } from "@/components/provider/provider-sidebar";
import { OwnerFooter } from "@/components/provider/provider-footer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RoleGuard } from "@/components/auth/role-guard";
import { BrandIcon } from "@/components/common/app-logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/utils";

export default function OwnerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="provider-workspace min-h-screen flex flex-col">
      <a
        href="#provider-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:p-3"
      >
        Skip to workspace
      </a>
      {/* Desktop Fixed Left Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 bottom-0 z-30">
        <OwnerSidebar />
      </div>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 lg:ml-64 lg:px-8">
        <Link
          href="/provider/dashboard"
          className="flex items-center gap-2 text-sm font-semibold lg:hidden"
        >
          <BrandIcon size={28} />
          ParkEase BD
        </Link>
        <span className="hidden text-sm text-slate-500 lg:block">
          Provider workspace
        </span>
        <ProviderAccountMenu />
      </header>

      {/* Main Workspace Column */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <main id="provider-main" tabIndex={-1} className="min-w-0 flex-1 pb-8">
          <RoleGuard roles={["PROVIDER", "PARKING_OWNER"]}>
            {children}
          </RoleGuard>
        </main>
        <OwnerFooter />
      </div>

      {/* Mobile Bottom Navigation Bar (like Admin & Driver) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/98 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(15,23,42,0.06)] backdrop-blur lg:hidden"
        aria-label="Mobile provider navigation"
      >
        {mobilePrimary.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors",
                active
                  ? "text-emerald-900"
                  : "text-slate-500 hover:text-slate-900",
              )}
            >
              <span
                className={cn(
                  "grid h-7 w-12 place-items-center rounded-full transition-colors",
                  active && "bg-emerald-100",
                )}
              >
                <Icon
                  className={cn(
                    "size-5",
                    active ? "text-emerald-800" : "text-slate-500",
                  )}
                />
              </span>
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-slate-900"
          aria-expanded={moreOpen}
          aria-label="Open all Provider modules"
        >
          <span className="grid h-7 w-12 place-items-center rounded-full">
            <Menu className="size-5" />
          </span>
          More
        </button>
      </nav>

      {/* Mobile Bottom Sheet for More Navigation */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          style={{ height: "88dvh", maxHeight: "88dvh" }}
          className="!h-[88dvh] !max-h-[88dvh] flex flex-col gap-0 overflow-hidden rounded-t-2xl p-0 lg:hidden"
        >
          <SheetHeader className="shrink-0 border-b bg-white px-5 pb-4 pt-5">
            <SheetTitle className="text-lg font-extrabold text-slate-900">
              Provider modules
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-500">
              Properties, parking resources, bookings, finances and settings.
            </SheetDescription>
          </SheetHeader>
          <div
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 pb-[calc(3rem+env(safe-area-inset-bottom))]"
            style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
          >
            <div className="space-y-5">
              {providerGroups.map((group) => (
                <section key={group.label}>
                  <p className="mb-1.5 px-3 text-[10px] font-bold uppercase text-slate-400">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = isActive(pathname, item.href);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMoreOpen(false)}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex h-10 items-center gap-3 rounded-lg border-l-2 px-3 text-sm font-semibold transition-colors",
                            active
                              ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold"
                              : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                          )}
                        >
                          <Icon
                            className={cn(
                              "size-4 shrink-0",
                              active ? "text-emerald-700" : "text-slate-400",
                            )}
                          />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 pb-6">
              <Link
                href="/provider/properties/new"
                onClick={() => setMoreOpen(false)}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 text-sm font-bold text-white hover:bg-emerald-900 shadow-2xs"
              >
                <Plus className="size-4" /> Add Property
              </Link>
              <LogoutButton
                className="h-10 w-full justify-center border-rose-200 text-rose-700 hover:bg-rose-50"
                label="Sign out"
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
