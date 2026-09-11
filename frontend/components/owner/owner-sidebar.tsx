"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Building2,
  CalendarDays,
  ShieldCheck,
  Users,
  Banknote,
  MessageSquareQuote,
  Bell,
  HelpCircle,
  Settings,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/owner/dashboard", icon: LayoutGrid },
  { label: "My Listings", href: "/owner/properties", icon: Building2 },
  { label: "Bookings", href: "/owner/bookings", icon: CalendarDays },
  { label: "Guards", href: "/owner/guards", icon: ShieldCheck },
  { label: "Managers", href: "/owner/managers", icon: Users },
  { label: "Earnings", href: "/owner/earnings", icon: Banknote },
  { label: "Reviews", href: "/owner/reviews", icon: MessageSquareQuote },
  { label: "Notifications", href: "/owner/notifications", icon: Bell, badge: 3 },
  { label: "Help & Support", href: "/owner/support", icon: HelpCircle },
  { label: "Settings", href: "/owner/settings", icon: Settings },
];

interface OwnerSidebarProps {
  onCloseMobile?: () => void;
}

export function OwnerSidebar({ onCloseMobile }: OwnerSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-white border-r border-[#E5E7EB] flex flex-col justify-between shrink-0 select-none">
      {/* Top Brand + Nav Area */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Logo Brand */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-[#E5E7EB]">
          <div className="size-9 rounded-xl bg-[#064E3B] text-white flex items-center justify-center font-bold text-lg shadow-xs">
            P
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-extrabold text-sm tracking-tight text-slate-900 leading-none">
              ParkEase BD
            </span>
            <span className="text-[11px] font-medium text-slate-500 mt-0.5">
              Management Portal
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/owner/dashboard" && pathname.startsWith(item.href)) ||
              (item.href === "/owner/earnings" && pathname.startsWith("/owner/payouts"));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  isActive
                    ? "bg-[#E6F4EA] text-[#064E3B] font-semibold shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "size-4.5 transition-colors",
                      isActive
                        ? "text-[#064E3B]"
                        : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="size-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center font-mono">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom CTA & Verification Footnote */}
      <div className="p-4 border-t border-[#E5E7EB] space-y-3 bg-white">
        <Link
          href="/owner/properties/new"
          onClick={onCloseMobile}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#064E3B] hover:bg-[#064E3B]/90 text-white text-sm font-semibold shadow-sm transition-all active:scale-[0.99]"
        >
          <Plus className="size-4 stroke-[2.5]" />
          <span>Add Parking Space</span>
        </Link>

        <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 font-medium">
          <span>Owner Portal v2.4</span>
          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
            <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Verified Host
          </span>
        </div>
      </div>
    </aside>
  );
}
