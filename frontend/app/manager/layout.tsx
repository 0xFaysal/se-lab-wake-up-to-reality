"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Building2,
  CalendarDays,
  Car,
  CircleParking,
  HelpCircle,
  LayoutGrid,
  Menu,
  MessageSquareQuote,
  Shield,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ManagerSidebar } from "@/components/manager/manager-sidebar";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RoleGuard } from "@/components/auth/role-guard";
import { BrandIcon } from "@/components/common/app-logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { managerApi } from "@/lib/api/manager-api";
import { bookingsApi } from "@/lib/api/bookings-api";
import { notificationsApi } from "@/lib/api/notifications-api";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  dot?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const mobilePrimary: NavItem[] = [
  { label: "Dashboard", href: "/manager/dashboard", icon: LayoutGrid },
  { label: "Properties", href: "/manager/properties", icon: Building2 },
  { label: "Bookings", href: "/manager/bookings", icon: CalendarDays },
  { label: "Sessions", href: "/manager/active-sessions", icon: Car },
];

function isActive(pathname: string, href: string) {
  if (href === "/manager/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

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
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();
  const { data: user } = useCurrentUser();

  const delegationsQuery = useQuery({
    queryKey: queryKeys.managerDelegations.manager,
    queryFn: managerApi.listForManager,
  });

  const bookingsQuery = useQuery({
    queryKey: queryKeys.bookings.provider({}),
    queryFn: () => bookingsApi.providerList(),
    retry: false,
  });

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications.all({}),
    queryFn: notificationsApi.list,
    retry: false,
  });

  const activeCount =
    delegationsQuery.data?.filter((d) => d.status === "ACTIVE").length ?? 0;

  const rawBookings = Array.isArray(bookingsQuery.data) ? bookingsQuery.data : [];
  const bookingsCount = rawBookings.length;
  const activeSessionsCount = rawBookings.filter(
    (b) => b.status === "CHECKED_IN" || b.status === "CHECKOUT_REQUESTED",
  ).length;

  const unreadNotifs =
    notificationsQuery.data?.filter((n) => !n.readAt).length ?? 0;

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "PM";

  const managerGroups: NavGroup[] = [
    {
      label: "Operations",
      items: [
        { label: "Overview", href: "/manager/dashboard", icon: LayoutGrid },
        {
          label: "Assigned Properties",
          href: "/manager/properties",
          icon: Building2,
          badge: activeCount > 0 ? String(activeCount) : undefined,
        },
        {
          label: "Bookings",
          href: "/manager/bookings",
          icon: CalendarDays,
          badge: bookingsCount > 0 ? String(bookingsCount) : undefined,
        },
        {
          label: "Active Sessions",
          href: "/manager/active-sessions",
          icon: Car,
          badge: activeSessionsCount > 0 ? String(activeSessionsCount) : undefined,
          dot: activeSessionsCount > 0,
        },
        {
          label: "Parking Spaces",
          href: "/manager/parking-spaces",
          icon: CircleParking,
        },
        {
          label: "Guards",
          href: "/manager/guards",
          icon: Shield,
        },
      ],
    },
    {
      label: "Feedback & Alerts",
      items: [
        {
          label: "Reviews",
          href: "/manager/reviews",
          icon: MessageSquareQuote,
        },
        {
          label: "Notifications",
          href: "/manager/notifications",
          icon: Bell,
          badge: unreadNotifs > 0 ? String(unreadNotifs) : undefined,
        },
      ],
    },
    {
      label: "Account & Support",
      items: [
        {
          label: "Help & Support",
          href: "/manager/support",
          icon: HelpCircle,
        },
        {
          label: "Profile",
          href: "/manager/profile",
          icon: User,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-slate-800 flex flex-col">
      {/* Desktop Fixed Left Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 bottom-0 z-30">
        <ManagerSidebar />
      </div>

      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
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

        <div className="flex items-center gap-2">
          <Link
            href="/manager/notifications"
            className="relative size-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            {unreadNotifs > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-bold text-white">
                {unreadNotifs > 9 ? "9+" : unreadNotifs}
              </span>
            )}
          </Link>
          <Link
            href="/manager/profile"
            className="flex size-9 items-center justify-center rounded-lg bg-[#064E3B] text-xs font-bold text-white shadow-2xs"
            aria-label="Manager Profile"
          >
            {initials}
          </Link>
        </div>
      </header>

      {/* Main Workspace Column */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <main className="flex-1 pb-8">
          <RoleGuard roles={["MANAGER"]}>{children}</RoleGuard>
        </main>
        <ManagerFooter />
      </div>

      {/* Mobile Bottom Navigation Bar (like Admin & Driver) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/98 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(15,23,42,0.06)] backdrop-blur lg:hidden"
        aria-label="Mobile manager navigation"
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
          aria-label="Open all Manager modules"
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
            <SheetTitle className="text-lg font-extrabold text-slate-900">Manager modules</SheetTitle>
            <SheetDescription className="text-xs text-slate-500">
              Property operations, bookings, guards, reviews and settings.
            </SheetDescription>
          </SheetHeader>
          <div
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 pb-[calc(3rem+env(safe-area-inset-bottom))]"
            style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
          >
            <div className="space-y-5">
              {managerGroups.map((group) => (
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
                            "flex h-10 items-center justify-between rounded-lg border-l-2 px-3 text-sm font-semibold transition-colors",
                            active
                              ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold"
                              : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={cn("size-4 shrink-0", active ? "text-emerald-700" : "text-slate-400")} />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-5 border-t border-slate-200 pt-4 pb-6">
              <LogoutButton className="h-10 w-full justify-center border-rose-200 text-rose-700 hover:bg-rose-50" label="Sign out" />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
