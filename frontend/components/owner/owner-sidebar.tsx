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

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  { label: "Overview", items: [{ label: "Dashboard", href: "/owner/dashboard", icon: LayoutGrid }] },
  {
    label: "Properties",
    items: [
      { label: "My Properties", href: "/owner/properties", icon: Building2 },
      { label: "Add Property", href: "/owner/properties/new", icon: Plus },
    ],
  },
  {
    label: "Parking",
    items: [
      { label: "Resources", href: "/owner/parking", icon: CircleParking },
      { label: "Listings", href: "/owner/listings", icon: ListChecks },
      { label: "Availability", href: "/owner/availability", icon: CalendarClock },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Bookings", href: "/owner/bookings", icon: CalendarDays },
      { label: "Live Sessions", href: "/owner/sessions", icon: Radio },
      { label: "Guards", href: "/owner/guards", icon: ShieldCheck },
      { label: "Managers", href: "/owner/managers", icon: Users },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Earnings", href: "/owner/earnings", icon: Banknote },
      { label: "Payouts", href: "/owner/payouts", icon: Clock3 },
    ],
  },
  {
    label: "Reputation",
    items: [
      { label: "Reviews", href: "/owner/reviews", icon: MessageSquareQuote },
      { label: "Disputes", href: "/owner/disputes", icon: Scale },
      { label: "Notifications", href: "/owner/notifications", icon: Bell },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Security", href: "/owner/security", icon: LockKeyhole },
      { label: "Sessions", href: "/owner/account/sessions", icon: MonitorSmartphone },
    ],
  },
];

export function OwnerSidebar({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-dvh w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <Link href="/owner/dashboard" onClick={onCloseMobile} className="flex h-16 items-center gap-3 border-b px-5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-[#064E3B] text-base font-extrabold text-white">P</span>
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
                const active = pathname === item.href || (item.href !== "/owner/dashboard" && pathname.startsWith(`${item.href}/`));
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

      <div className="border-t p-4">
        <Link href="/owner/properties/new" onClick={onCloseMobile} className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#064E3B] px-4 text-sm font-semibold text-white hover:bg-emerald-900">
          <Plus className="size-4" /> Add Property
        </Link>
      </div>
    </aside>
  );
}
