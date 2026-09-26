"use client";

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
  MessageSquareQuote,
  Shield,
  ShieldCheck,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { managerApi } from "@/lib/api/manager-api";
import { queryKeys } from "@/lib/query-keys";
import { useCurrentUser } from "@/hooks/use-current-user";

import { bookingsApi } from "@/lib/api/bookings-api";
import { notificationsApi } from "@/lib/api/notifications-api";

export function ManagerSidebar({
  onCloseMobile,
}: {
  onCloseMobile?: () => void;
}) {
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

  const navItems = [
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
      badgeColor: "bg-emerald-600 text-white",
    },
  ];

  const bottomNavItems = [
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
  ];

  return (
    <aside className="flex h-dvh w-64 shrink-0 flex-col border-r border-slate-200 bg-white font-sans text-slate-800">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100">
        <Link
          href="/manager/dashboard"
          onClick={onCloseMobile}
          className="flex items-center gap-3 group"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#064E3B] text-white font-bold text-lg shadow-sm">
            P
          </div>
          <div>
            <span className="font-extrabold text-base text-slate-950 block leading-tight tracking-tight">
              ParkEase BD
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200/60 mt-0.5">
              <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Manager Portal
            </span>
          </div>
        </Link>

        {/* Access Mode Tag */}
        <div className="mt-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-600">Access Mode:</span>
            <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200 shadow-2xs">
              <ShieldCheck className="size-3 text-emerald-700" /> Delegated
            </span>
          </div>
          <p className="mt-1 text-[10px] text-slate-500">Assigned by Property Owner</p>
        </div>
      </div>

      {/* Main Nav */}
      <nav
        aria-label="Manager primary navigation"
        className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 scrollbar-thin"
      >
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/manager/dashboard" && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex h-10 items-center justify-between rounded-lg px-3 text-xs font-semibold transition-all",
                active
                  ? "bg-[#E6F4EA] text-[#064E3B] font-bold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    "size-4 transition-colors",
                    active ? "text-[#064E3B]" : "text-slate-500 group-hover:text-slate-700",
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    item.badgeColor ?? "bg-slate-100 text-slate-600",
                  )}
                >
                  {item.badge}
                </span>
              )}
              {item.dot && (
                <span className="size-2 rounded-full bg-emerald-600 ring-2 ring-emerald-100" />
              )}
            </Link>
          );
        })}

        <div className="my-3 border-t border-slate-100 pt-2" />

        {bottomNavItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex h-9 items-center gap-2.5 rounded-lg px-3 text-xs font-semibold transition-all",
                active
                  ? "bg-[#E6F4EA] text-[#064E3B] font-bold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Icon
                className={cn(
                  "size-4 transition-colors",
                  active ? "text-[#064E3B]" : "text-slate-500 group-hover:text-slate-700",
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer Card */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60">
        <Link
          href="/manager/profile"
          className="flex items-center gap-2.5 rounded-lg p-2 transition hover:bg-white border border-transparent hover:border-slate-200"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#064E3B] text-white font-bold text-xs shadow-2xs">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-bold text-slate-900 leading-tight">
              {user?.fullName ?? "Property Manager"}
            </p>
            <p className="truncate text-[10px] text-slate-500 mt-0.5">
              {user?.email ?? "Delegated Manager"}
            </p>
          </div>
        </Link>
        <div className="mt-2 flex items-center justify-between px-2 text-[10px] text-slate-400">
          <span>Portal v2.4</span>
          <span className="flex items-center gap-1 font-semibold text-emerald-700">
            <span className="size-1.5 rounded-full bg-emerald-600" />
            Online
          </span>
        </div>
      </div>
    </aside>
  );
}
