"use client";

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
  MessageSquareQuote,
  MonitorSmartphone,
  Plus,
  Radio,
  Scale,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandIcon } from "@/components/common/app-logo";
import { LogoutButton } from "@/components/auth/logout-button";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  { label: "Overview", items: [{ label: "Dashboard", href: "/provider/dashboard", icon: LayoutGrid }] },
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
    label: "Reputation",
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

export function OwnerSidebar({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-dvh w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <Link href="/provider/dashboard" onClick={onCloseMobile} className="flex h-16 items-center gap-3 border-b px-5">
        <BrandIcon size={36} className="size-9" />
        <span>
          <strong className="block text-sm text-slate-950">ParkEase BD</strong>
          <span className="text-[11px] text-slate-500">Provider Portal</span>
        </span>
      </Link>

      <nav aria-label="Provider navigation" className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase text-slate-400">{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/provider/dashboard" && pathname.startsWith(`${item.href}/`));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                      active ? "bg-emerald-50 text-[#064E3B]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-2 border-t p-4">
        <Link href="/provider/properties/new" onClick={onCloseMobile} className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#064E3B] px-4 text-sm font-semibold text-white hover:bg-emerald-900">
          <Plus className="size-4" /> Add Property
        </Link>
        <LogoutButton className="h-10 w-full justify-start border-0 px-3 text-slate-600 hover:bg-slate-50" />
      </div>
    </aside>
  );
}
