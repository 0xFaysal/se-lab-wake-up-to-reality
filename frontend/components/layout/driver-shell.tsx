"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Bell, CalendarDays, Car, ChevronDown, CircleHelp, Clock3, CreditCard, Heart,
  Home, MapPin, Menu, MessageSquareWarning, ReceiptText, Search, ShieldCheck,
  Star, UserRound, WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { AppLogo } from "@/components/common/app-logo";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCurrentUser } from "@/hooks/use-current-user";
import { notificationsApi } from "@/lib/api/notifications-api";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

type NavigationItem = { href: string; label: string; icon: LucideIcon };
type NavigationGroup = { label: string; items: NavigationItem[] };

const groups: NavigationGroup[] = [
  { label: "Parking", items: [
    { href: "/driver/dashboard", label: "Overview", icon: Home },
    { href: "/driver/parking", label: "Find parking", icon: Search },
    { href: "/driver/favorites", label: "Favorites", icon: Heart },
    { href: "/driver/saved-locations", label: "Saved places", icon: MapPin },
    { href: "/driver/recent-searches", label: "Recent searches", icon: Clock3 },
  ] },
  { label: "Trips", items: [
    { href: "/driver/bookings", label: "Bookings", icon: CalendarDays },
    { href: "/driver/active-session", label: "Active session", icon: MapPin },
    { href: "/driver/vehicles", label: "Vehicles", icon: Car },
  ] },
  { label: "Money", items: [
    { href: "/driver/payments", label: "Payments", icon: CreditCard },
    { href: "/driver/refunds", label: "Refunds", icon: ReceiptText },
    { href: "/driver/wallet", label: "Wallet", icon: WalletCards },
  ] },
  { label: "Account", items: [
    { href: "/driver/notifications", label: "Notifications", icon: Bell },
    { href: "/driver/disputes", label: "Disputes", icon: MessageSquareWarning },
    { href: "/driver/reviews", label: "My reviews", icon: Star },
    { href: "/driver/profile", label: "Profile", icon: UserRound },
    { href: "/driver/support", label: "Help & support", icon: CircleHelp },
  ] },
];

const mobileItems: NavigationItem[] = [
  { href: "/driver/dashboard", label: "Home", icon: Home },
  { href: "/driver/parking", label: "Search", icon: Search },
  { href: "/driver/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/driver/vehicles", label: "Vehicles", icon: Car },
];

const moreGroups: NavigationGroup[] = [
  { label: "Saved", items: [
    { href: "/driver/favorites", label: "Favorites", icon: Heart },
    { href: "/driver/recent-searches", label: "Recent searches", icon: Clock3 },
  ] },
  { label: "Money & activity", items: [
    { href: "/driver/payments", label: "Payments", icon: CreditCard },
    { href: "/driver/refunds", label: "Refunds", icon: ReceiptText },
    { href: "/driver/reviews", label: "Reviews", icon: Star },
    { href: "/driver/disputes", label: "Disputes", icon: MessageSquareWarning },
  ] },
  { label: "Account", items: [
    { href: "/driver/notifications", label: "Notifications", icon: Bell },
    { href: "/driver/support", label: "Help", icon: CircleHelp },
    { href: "/driver/profile", label: "Profile", icon: UserRound },
    { href: "/driver/account/security", label: "Security", icon: ShieldCheck },
    { href: "/driver/account/sessions", label: "Sessions", icon: Clock3 },
  ] },
];

function active(pathname: string, href: string) {
  return pathname === href || (href !== "/driver/dashboard" && pathname.startsWith(`${href}/`));
}

function Navigation({ pathname, close }: { pathname: string; close?: () => void }) {
  return <nav className="space-y-5 px-3 py-5">
    {groups.map((group) => <section key={group.label}>
      <p className="mb-1.5 px-3 text-[11px] font-bold uppercase text-muted-foreground">{group.label}</p>
      <div className="space-y-1">{group.items.map((item) => {
        const Icon = item.icon;
        const selected = active(pathname, item.href);
        return <Link key={item.href} href={item.href} onClick={close} className={cn("flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors", selected ? "bg-emerald-50 text-emerald-900" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950")}>
          <Icon className={cn("size-4", selected && "text-emerald-700")} />{item.label}
        </Link>;
      })}</div>
    </section>)}
  </nav>;
}

export function DriverShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useCurrentUser();
  const notifications = useQuery({ queryKey: queryKeys.notifications.all(), queryFn: notificationsApi.list, staleTime: 30_000 });
  const [moreOpen, setMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const unread = notifications.data?.filter((item) => !item.readAt).length ?? 0;
  const displayName = user.data?.fullName ?? "Driver";
  const initials = displayName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const current = [...groups, ...moreGroups].flatMap((group) => group.items).find((item) => active(pathname, item.href));
  const isPrimaryMobileRoute = mobileItems.some((item) => active(pathname, item.href));
  const pathDepth = pathname.split("/").filter(Boolean).length;

  return <div className="min-h-screen bg-slate-50 text-slate-950">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-white lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b px-5"><AppLogo size="sm" /></div>
      <div className="flex-1 overflow-y-auto"><Navigation pathname={pathname} /></div>
      <div className="border-t p-4"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-full bg-emerald-950 text-xs font-bold text-white">{initials}</div><div className="min-w-0"><p className="truncate text-sm font-semibold">{displayName}</p><p className="text-xs text-muted-foreground">Driver account</p></div></div></div>
    </aside>

    <div className="lg:pl-64">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/95 px-4 backdrop-blur sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {pathDepth > 2 && <button type="button" onClick={() => router.back()} className="grid size-10 shrink-0 place-items-center rounded-full text-slate-700 hover:bg-slate-100 lg:hidden" aria-label="Go back"><ArrowLeft className="size-5" /></button>}
          <div className="min-w-0"><p className="text-[10px] font-bold uppercase text-emerald-700 sm:text-[11px]">Driver</p><p className="truncate text-[15px] font-extrabold sm:text-base">{current?.label ?? "ParkEase BD"}</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/driver/notifications" aria-label={`${unread} unread notifications`} className="relative grid size-10 place-items-center rounded-md text-slate-600 hover:bg-slate-100"><Bell className="size-5" />{unread > 0 && <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{Math.min(unread, 99)}</span>}</Link>
          <div className="relative">
            <button type="button" onClick={() => setProfileOpen((value) => !value)} className="flex size-10 items-center justify-center rounded-full border bg-white text-sm font-semibold sm:w-auto sm:gap-2 sm:rounded-md sm:px-2" aria-expanded={profileOpen} aria-label="Open profile menu"><span className="grid size-7 place-items-center rounded-full bg-emerald-950 text-[10px] text-white">{initials}</span><span className="hidden max-w-28 truncate sm:block">{displayName.split(" ")[0]}</span><ChevronDown className="hidden size-4 text-muted-foreground sm:block" /></button>
            {profileOpen && <div className="absolute right-0 mt-2 w-60 rounded-md border bg-white p-2 shadow-lg" onMouseLeave={() => setProfileOpen(false)}>
              <div className="border-b px-3 py-2"><p className="truncate text-sm font-semibold">{displayName}</p><p className="truncate text-xs text-muted-foreground">{user.data?.email}</p></div>
              <Link href="/driver/profile" className="mt-1 flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-slate-100"><UserRound className="size-4" />Profile</Link>
              <Link href="/driver/account/security" className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-slate-100"><ShieldCheck className="size-4" />Security</Link>
              <Link href="/driver/account/sessions" className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-slate-100"><Clock3 className="size-4" />Sessions</Link>
              <div className="my-1 border-t" /><LogoutButton className="h-9 w-full justify-start border-0 px-3 text-sm" />
            </div>}
          </div>
        </div>
      </header>
      <main className="min-h-[calc(100vh-4rem)] pb-[calc(5.25rem+env(safe-area-inset-bottom))] lg:pb-8">{children}</main>
    </div>

    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/98 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.06)] backdrop-blur lg:hidden" aria-label="Driver navigation">
      {mobileItems.map((item) => { const Icon = item.icon; const selected = active(pathname, item.href); return <Link key={item.href} href={item.href} aria-current={selected ? "page" : undefined} className={cn("flex min-h-16 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-semibold transition-colors", selected ? "text-emerald-900" : "text-slate-500")}><span className={cn("grid h-8 min-w-12 place-items-center rounded-full px-3", selected && "bg-emerald-100")}><Icon className="size-5" /></span>{item.label}</Link>; })}
      <button type="button" onClick={() => setMoreOpen(true)} className={cn("flex min-h-16 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-semibold", !isPrimaryMobileRoute ? "text-emerald-900" : "text-slate-500")} aria-expanded={moreOpen}><span className={cn("grid h-8 min-w-12 place-items-center rounded-full px-3", !isPrimaryMobileRoute && "bg-emerald-100")}><Menu className="size-5" /></span>More</button>
    </nav>

    <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
      <SheetContent side="bottom" className="h-[min(88dvh,720px)] gap-0 overflow-hidden rounded-t-2xl p-0 lg:hidden">
        <SheetHeader className="border-b px-5 pb-4 pt-5"><SheetTitle className="text-lg font-extrabold">More</SheetTitle><SheetDescription>Saved parking, payments, help, and account settings.</SheetDescription></SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {moreGroups.map((group) => <section key={group.label} className="mb-5"><h2 className="mb-2 px-2 text-[11px] font-bold uppercase text-slate-400">{group.label}</h2><div className="grid grid-cols-2 gap-2">{group.items.map((item) => { const Icon = item.icon; const selected = active(pathname, item.href); return <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)} className={cn("flex min-h-12 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700", selected && "border-emerald-200 bg-emerald-50 text-emerald-900")}><Icon className="size-4 shrink-0" />{item.label}</Link>; })}</div></section>)}
          <div className="border-t pt-4"><LogoutButton className="h-12 w-full justify-center border-rose-200 text-rose-700" label="Sign out" /></div>
        </div>
      </SheetContent>
    </Sheet>
  </div>;
}
