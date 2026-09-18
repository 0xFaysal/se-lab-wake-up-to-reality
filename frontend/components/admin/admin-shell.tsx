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
import { BrandIcon } from "@/components/common/app-logo";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type NavItem = { label: string; href: string; icon: typeof Home };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  { label: "Overview", items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }] },
  { label: "Operations", items: [
    { label: "Properties", href: "/admin/properties", icon: Building2 },
    { label: "Parking resources", href: "/admin/parking-resources", icon: CarFront },
    { label: "Parking rights", href: "/admin/marketplace/rights", icon: ShieldCheck },
    { label: "Right changes", href: "/admin/marketplace/right-amendments", icon: GitCompare },
    { label: "Right batches", href: "/admin/marketplace/right-batches", icon: ClipboardList },
    { label: "Listings", href: "/admin/marketplace/listings", icon: ListChecks },
    { label: "Bookings", href: "/admin/bookings", icon: ClipboardList },
    { label: "Parking sessions", href: "/admin/sessions", icon: Activity },
    { label: "Occupancy", href: "/admin/parking-operations", icon: CarFront },
  ] },
  { label: "People", items: [
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Drivers", href: "/admin/drivers", icon: CarFront },
    { label: "Providers", href: "/admin/providers", icon: Building2 },
    { label: "Managers", href: "/admin/managers", icon: UserCog },
    { label: "Guards", href: "/admin/guards", icon: ShieldCheck },
  ] },
  { label: "Finance", items: [
    { label: "Payments", href: "/admin/payments", icon: CircleDollarSign },
    { label: "Ledger", href: "/admin/ledger", icon: ScrollText },
    { label: "Refunds", href: "/admin/refunds", icon: WalletCards },
    { label: "Earnings", href: "/admin/earnings", icon: Banknote },
    { label: "Payouts", href: "/admin/marketplace/payouts", icon: Banknote },
    { label: "Reconciliation", href: "/admin/finance/reconciliation", icon: ShieldCheck },
    { label: "Platform fees", href: "/admin/platform-fees", icon: CircleDollarSign },
  ] },
  { label: "Trust & Safety", items: [
    { label: "Disputes", href: "/admin/marketplace/disputes", icon: Scale },
    { label: "Reported listings", href: "/admin/listing-reports", icon: ShieldAlert },
    { label: "Reviews", href: "/admin/reviews", icon: MessageSquareWarning },
    { label: "Risk flags", href: "/admin/risk-flags", icon: ShieldAlert },
    { label: "Security events", href: "/admin/security-events", icon: ShieldCheck },
  ] },
  { label: "Communication", items: [
    { label: "Notifications", href: "/admin/notifications", icon: Bell },
    { label: "Broadcasts", href: "/admin/broadcasts", icon: Bell },
    { label: "Email templates", href: "/admin/communications/templates", icon: Mail },
    { label: "Email campaigns", href: "/admin/communications/campaigns", icon: Send },
    { label: "Email delivery", href: "/admin/communications/deliveries", icon: Activity },
  ] },
  { label: "Content", items: [
    { label: "Legal documents", href: "/admin/content/legal", icon: FileText },
    { label: "FAQ", href: "/admin/content/faq", icon: BookOpen },
    { label: "Help articles", href: "/admin/content/help", icon: BookOpen },
  ] },
  { label: "Platform", items: [
    { label: "Analytics", href: "/admin/analytics", icon: Activity },
    { label: "Audit logs", href: "/admin/audit-logs", icon: ScrollText },
    { label: "System health", href: "/admin/system-health", icon: HeartPulse },
    { label: "Capabilities", href: "/admin/platform-capabilities", icon: ShieldCheck },
  ] },
  { label: "Account", items: [
    { label: "Security", href: "/admin/account/security", icon: ShieldCheck },
    { label: "Sessions", href: "/admin/account/sessions", icon: Activity },
  ] },
];

const mobilePrimary: NavItem[] = [
  { label: "Home", href: "/admin", icon: Home },
  { label: "Ops", href: "/admin/parking-operations", icon: CarFront },
  { label: "Bookings", href: "/admin/bookings", icon: ClipboardList },
  { label: "Finance", href: "/admin/payments", icon: WalletCards },
];

function isActive(pathname: string, href: string) {
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
          <p className="mb-1 px-3 text-[10px] font-bold uppercase text-slate-400">{group.label}</p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={`flex h-9 items-center gap-3 border-l-2 px-3 text-sm font-semibold transition-colors ${active ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}>
                  <Icon className="size-4" />
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
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <Link href="/admin" className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <BrandIcon size={36} className="size-9" />
          <span><strong className="block text-sm">ParkEase BD</strong><small className="block text-[11px] text-slate-500">Admin Console</small></span>
        </Link>
        <div className="flex-1 overflow-y-auto px-3 py-5"><Navigation pathname={pathname} /></div>
        <div className="border-t border-slate-200 p-4">
          <Link href="/admin/account/security" className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{user?.fullName.slice(0, 2).toUpperCase() ?? "AD"}</span>
            <span className="min-w-0 flex-1"><strong className="block truncate text-xs">{user?.fullName ?? "Administrator"}</strong><small className="block truncate text-[11px] text-slate-500">Platform Administrator</small></span>
            <ChevronRight className="size-4 text-slate-400" />
          </Link>
          <LogoutButton className="mt-3 h-8 w-full justify-start border-0 px-0 text-xs" />
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <BrandIcon size={32} className="size-8 lg:hidden" />
            <div><p className="text-[10px] font-bold uppercase text-slate-400">Admin Console</p><p className="text-sm font-bold">{current?.label ?? "Operations"}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/account/security" className="text-right"><strong className="block text-xs">{user?.fullName}</strong><small className="text-[10px] font-bold text-emerald-700">ADMIN</small></Link>
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
