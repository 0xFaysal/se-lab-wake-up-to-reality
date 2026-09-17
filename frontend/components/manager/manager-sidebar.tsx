"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Building2,
  CalendarDays,
  ShieldCheck,
  Radio,
  Scale,
  MessageSquareQuote,
  Bell,
  HelpCircle,
  Lock,
  Sparkles,
  ArrowRight,
  Banknote,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/lib/security/use-permissions";
import { AppPermission } from "@/lib/security/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermission?: AppPermission;
  badge?: number | string;
}

const ALL_MANAGER_NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/manager/dashboard", icon: LayoutGrid },
  {
    label: "Assigned Listings",
    href: "/manager/properties",
    icon: Building2,
    requiredPermission: "canViewProperty",
  },
  {
    label: "Bookings Feed",
    href: "/manager/bookings",
    icon: CalendarDays,
    requiredPermission: "canViewBookings",
  },
  {
    label: "Live Gate Sessions",
    href: "/manager/sessions",
    icon: Radio,
    badge: "Live",
    requiredPermission: "canManageActiveSessions",
  },
  {
    label: "Security Guards",
    href: "/manager/guards",
    icon: ShieldCheck,
    requiredPermission: "canManageGuards",
  },
  {
    label: "Driver Disputes",
    href: "/manager/disputes",
    icon: Scale,
    requiredPermission: "canManageBookings",
  },
  {
    label: "Customer Reviews",
    href: "/manager/reviews",
    icon: MessageSquareQuote,
    requiredPermission: "canRespondReviews",
  },
  {
    label: "Financial Earnings",
    href: "/manager/earnings",
    icon: Banknote,
    requiredPermission: "financial_access",
  },
  {
    label: "Disbursement Payouts",
    href: "/manager/payouts",
    icon: Wallet,
    requiredPermission: "payout_manage",
  },
  { label: "Notifications", href: "/manager/notifications", icon: Bell },
  { label: "Help & Support", href: "/manager/support", icon: HelpCircle },
];

interface ManagerSidebarProps {
  onCloseMobile?: () => void;
}

export function ManagerSidebar({ onCloseMobile }: ManagerSidebarProps) {
  const pathname = usePathname();
  const { permissions, manager, hasPermission } = usePermissions();

  // Filter navigation items: only show items the manager has scope for
  const visibleNavItems = ALL_MANAGER_NAV_ITEMS.filter((item) => {
    if (!item.requiredPermission) return true;
    return hasPermission(item.requiredPermission);
  });

  return (
    <aside className="w-64 h-screen bg-white border-r border-[#E5E7EB] flex flex-col justify-between shrink-0 select-none">
      {/* Top Brand + Nav Area */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Logo Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-[#064E3B] text-white flex items-center justify-center font-bold text-lg shadow-xs">
              P
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-sm tracking-tight text-slate-900 leading-none">
                ParkEase BD
              </span>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mt-0.5 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Manager Portal
              </span>
            </div>
          </div>
        </div>

        {/* Manager Delegation Scope Tag */}
        <div className="mx-4 mt-4 p-3 rounded-xl bg-[#f9f9ff] border border-[#E5E7EB] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Active Delegate
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-[#064E3B]">
              RBAC Scoped
            </span>
          </div>
          <div className="text-xs font-bold text-slate-900 truncate">
            {manager?.name || "Rahim Uddin"}
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            {manager?.assignedPropertyTitles?.length || 2} Properties Assigned
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1">
            Operational Menu
          </div>
          {visibleNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/manager/dashboard" && pathname.startsWith(item.href));
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
                  <span
                    className={cn(
                      "px-2 py-0.5 text-[11px] font-bold rounded-full",
                      isActive
                        ? "bg-[#064E3B] text-white"
                        : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Isolation Notice */}
      <div className="p-4 border-t border-[#E5E7EB] bg-slate-50/50 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Lock className="size-3.5 text-amber-600 shrink-0" />
          <span>Financial Scope Isolated</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-snug">
          Earnings and bank withdrawal access are restricted to the Property Owner.
        </p>
      </div>
    </aside>
  );
}
