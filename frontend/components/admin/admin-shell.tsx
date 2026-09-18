"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, Banknote, Bell, BookOpen, Building2, CarFront, ChevronRight,
  CircleDollarSign, ClipboardList, FileText, HeartPulse, Home, LayoutDashboard,
  GitCompare, ListChecks, Menu, MessageSquareWarning, Scale, ScrollText, ShieldAlert,
  ShieldCheck, UserCog, Users, WalletCards, Mail, Send,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { LogoutButton } from "@/components/auth/logout-button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type NavItem = { label: string; href: string; icon: typeof Home };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Operations Hub", href: "/admin", icon: Home },
    ],
  },
  {
    label: "Operations & Verification",
    items: [
      { label: "KYC Approvals", href: "/admin/kyc-approvals", icon: FileText },
      { label: "Properties", href: "/admin/properties", icon: Building2 },
      { label: "Parking resources", href: "/admin/parking-resources", icon: CarFront },
      { label: "Parking rights", href: "/admin/marketplace/rights", icon: ShieldCheck },
      { label: "Listings", href: "/admin/marketplace/listings", icon: ListChecks },
      { label: "Bookings", href: "/admin/bookings", icon: ClipboardList },
      { label: "Occupancy", href: "/admin/parking-operations", icon: CarFront },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Drivers", href: "/admin/drivers", icon: CarFront },
      { label: "Providers / Hosts", href: "/admin/providers", icon: Building2 },
      { label: "Managers", href: "/admin/managers", icon: UserCog },
      { label: "Guards", href: "/admin/guards", icon: ShieldCheck },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Payments", href: "/admin/payments", icon: CircleDollarSign },
      { label: "Payouts", href: "/admin/marketplace/payouts", icon: Banknote },
      { label: "Ledger", href: "/admin/ledger", icon: ScrollText },
      { label: "Refunds", href: "/admin/refunds", icon: WalletCards },
      { label: "Earnings", href: "/admin/earnings", icon: Banknote },
    ],
  },
  {
    label: "Trust & Safety",
    items: [
      { label: "Dispute Arbitration", href: "/admin/disputes", icon: Scale },
      { label: "Reported listings", href: "/admin/listing-reports", icon: ShieldAlert },
      { label: "Reviews", href: "/admin/reviews", icon: MessageSquareWarning },
      { label: "Risk flags", href: "/admin/risk-flags", icon: ShieldAlert },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "Analytics", href: "/admin/analytics", icon: Activity },
      { label: "Audit logs", href: "/admin/audit-logs", icon: ScrollText },
      { label: "System health", href: "/admin/system-health", icon: HeartPulse },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Security", href: "/admin/account/security", icon: ShieldCheck },
      { label: "Sessions", href: "/admin/account/sessions", icon: Activity },
    ],
  },
];

const mobilePrimary: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "KYC", href: "/admin/kyc-approvals", icon: FileText },
  { label: "Disputes", href: "/admin/disputes", icon: Scale },
  { label: "Finance", href: "/admin/payments", icon: WalletCards },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin/dashboard") {
    return pathname === "/admin/dashboard" || pathname === "/admin";
  }
  if (href === "/admin") return pathname === href;
  if (["/admin/users", "/admin/drivers", "/admin/providers", "/admin/managers", "/admin/guards"].includes(href)) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Navigation({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="space-y-5" aria-label="Admin navigation">
      {groups.map((group) => (
        <section key={group.label}>
          <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-heading">
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
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-9 items-center gap-3 rounded-md px-3 text-xs font-semibold transition-all ${
                    active
                      ? "bg-[#064E3B] text-white font-bold shadow-xs border-l-2 border-emerald-400"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                  }`}
                >
                  <Icon className={`size-4 ${active ? "text-emerald-300" : "text-slate-400"}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const current = groups.flatMap((group) => group.items).find((item) => isActive(pathname, item.href));

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-slate-950 font-sans">
      {/* Dark/Black Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-800/80 bg-slate-950 text-slate-100 lg:flex lg:flex-col shadow-xl">
        <Link href="/admin/dashboard" className="flex h-16 items-center gap-3 border-b border-slate-800/80 px-5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-[#064E3B] text-sm font-black text-white shadow-xs border border-emerald-500/30 font-heading">
            P
          </span>
          <span>
            <strong className="block text-sm font-extrabold tracking-tight text-white font-heading">
              ParkEase BD
            </strong>
            <small className="block text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
              Super Admin Portal
            </small>
          </span>
        </Link>
        <div className="flex-1 overflow-y-auto px-3 py-4"><Navigation pathname={pathname} /></div>
        <div className="border-t border-slate-800/80 bg-slate-900/40 p-4">
          <Link href="/admin/account/security" className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-emerald-400 border border-slate-700">
              {user?.fullName?.slice(0, 2).toUpperCase() ?? "AD"}
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-xs text-slate-200 font-semibold font-heading">
                {user?.fullName ?? "Administrator"}
              </strong>
              <small className="block truncate text-[10px] text-slate-400">Super Admin Authority</small>
            </span>
            <ChevronRight className="size-4 text-slate-500" />
          </Link>
          <LogoutButton className="mt-3 h-8 w-full justify-start border-0 px-0 text-xs text-slate-400 hover:text-red-400" />
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#E5E7EB] bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-md bg-[#064E3B] text-xs font-black text-white lg:hidden font-heading">
              P
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-heading">
                Super Admin Console
              </p>
              <p className="text-sm font-extrabold text-foreground font-heading">
                {current?.label ?? "Operations"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-[#064E3B]">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Platform Mode
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] px-4 py-6 pb-24 sm:px-6 lg:pb-8 xl:px-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Mobile admin navigation">
        {mobilePrimary.map((item) => { const Icon = item.icon; const active = isActive(pathname, item.href); return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-semibold ${active ? "text-emerald-800" : "text-slate-500"}`}><Icon className="size-5" />{item.label}</Link>; })}
        <Sheet>
          <SheetTrigger render={<button type="button" className="flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-semibold text-slate-500" aria-label="Open all Admin modules" />}><Menu className="size-5" />More</SheetTrigger>
          <SheetContent side="bottom" className="h-[88dvh] overflow-y-auto rounded-t-lg">
            <SheetHeader><SheetTitle>Admin modules</SheetTitle><SheetDescription>Platform operations, finance, trust and account tools.</SheetDescription></SheetHeader>
            <div className="px-3 pb-8"><Navigation pathname={pathname} /></div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
