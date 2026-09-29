"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  Bell,
  Building2,
  CalendarClock,
  CalendarDays,
  CircleParking,
  Clock3,
  CreditCard,
  LayoutGrid,
  ListChecks,
  LockKeyhole,
  Menu,
  MessageSquareQuote,
  MonitorSmartphone,
  Plus,
  Radio,
  Scale,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { OwnerSidebar } from "@/components/provider/provider-sidebar";
import { OwnerFooter } from "@/components/provider/provider-footer";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RoleGuard } from "@/components/auth/role-guard";
import { BrandIcon } from "@/components/common/app-logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const mobilePrimary: NavItem[] = [
  { label: "Dashboard", href: "/provider/dashboard", icon: LayoutGrid },
  { label: "Properties", href: "/provider/properties", icon: Building2 },
  { label: "Bookings", href: "/provider/bookings", icon: CalendarDays },
  { label: "Earnings", href: "/provider/earnings", icon: Banknote },
];

const providerGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/provider/dashboard", icon: LayoutGrid }],
  },
  {
    label: "Properties",
    items: [
      { label: "My Properties", href: "/provider/properties", icon: Building2 },
      { label: "Add Property", href: "/provider/properties/new", icon: Plus },
    ],
  },
  {
    label: "Parking",
    items: [
      { label: "Resources", href: "/provider/parking", icon: CircleParking },
      { label: "Listings", href: "/provider/listings", icon: ListChecks },
      { label: "Availability", href: "/provider/availability", icon: CalendarClock },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Bookings", href: "/provider/bookings", icon: CalendarDays },
      { label: "Live Sessions", href: "/provider/sessions", icon: Radio },
      { label: "Guards", href: "/provider/guards", icon: ShieldCheck },
      { label: "Managers", href: "/provider/managers", icon: Users },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Earnings", href: "/provider/earnings", icon: Banknote },
      { label: "Payouts", href: "/provider/payouts", icon: Clock3 },
      { label: "Payout methods", href: "/provider/settings/payout-methods", icon: CreditCard },
    ],
  },
  {
    label: "Reputation & Updates",
    items: [
      { label: "Reviews", href: "/provider/reviews", icon: MessageSquareQuote },
      { label: "Disputes", href: "/provider/disputes", icon: Scale },
      { label: "Notifications", href: "/provider/notifications", icon: Bell },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Security", href: "/provider/account/security", icon: LockKeyhole },
      { label: "Sessions", href: "/provider/account/sessions", icon: MonitorSmartphone },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/provider/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function OwnerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "PR";

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-slate-800 flex flex-col">
      {/* Desktop Fixed Left Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 bottom-0 z-30">
        <OwnerSidebar />
      </div>

      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BrandIcon size={32} className="size-8" />
          <div>
            <span className="font-heading font-extrabold text-sm text-slate-900 block leading-tight">
              ParkEase BD
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
              Provider Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/provider/notifications"
            className="size-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
          </Link>
          <Link
            href="/provider/account/security"
            className="flex size-9 items-center justify-center rounded-lg bg-emerald-950 text-xs font-bold text-white shadow-2xs"
            aria-label="Account Settings"
          >
            {initials}
          </Link>
        </div>
      </header>

      {/* Main Workspace Column */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <main className="flex-1 pb-8">
          <RoleGuard roles={["PROVIDER", "PARKING_OWNER"]}>{children}</RoleGuard>
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
                active ? "text-emerald-900" : "text-slate-500 hover:text-slate-900",
              )}
            >
              <span className={cn("grid h-7 w-12 place-items-center rounded-full transition-colors", active && "bg-emerald-100")}>
                <Icon className={cn("size-5", active ? "text-emerald-800" : "text-slate-500")} />
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
            <SheetTitle className="text-lg font-extrabold text-slate-900">Provider modules</SheetTitle>
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
                  <p className="mb-1.5 px-3 text-[10px] font-bold uppercase text-slate-400">{group.label}</p>
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
                          <Icon className={cn("size-4 shrink-0", active ? "text-emerald-700" : "text-slate-400")} />
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
              <LogoutButton className="h-10 w-full justify-center border-rose-200 text-rose-700 hover:bg-rose-50" label="Sign out" />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
