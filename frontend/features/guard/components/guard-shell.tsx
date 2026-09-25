"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ClipboardCheck,
  Home,
  QrCode,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { RoleGuard } from "@/components/auth/role-guard";
import { cn } from "@/lib/utils";
import { GuardTopBar } from "./guard-top-bar";
import { GuardBottomNav } from "./guard-bottom-nav";

const navigation = [
  { href: "/guard", label: "Overview", icon: Home, exact: true },
  { href: "/guard/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/guard/assignments", label: "Assignments", icon: ClipboardCheck },
  { href: "/guard/notifications", label: "Notifications", icon: Bell },
  { href: "/guard/profile", label: "Profile", icon: UserRound },
] as const;

function isCurrent(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function GuardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <RoleGuard roles={["GUARD"]}>
      <div className="guard-app min-h-dvh bg-[var(--guard-canvas)] text-foreground lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)]">
        <aside className="hidden min-h-dvh border-r border-emerald-950/10 bg-[var(--guard-ink)] text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
          <div className="border-b border-white/10 px-7 py-7">
            <Link href="/guard" className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200">
              <span className="grid size-11 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <ShieldCheck className="size-6 text-emerald-200" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-[0.68rem] font-bold uppercase tracking-[0.22em] text-emerald-200">ParkEase BD</span>
                <span className="mt-0.5 block text-lg font-semibold tracking-[-0.02em]">Guard portal</span>
              </span>
            </Link>
          </div>

          <nav aria-label="Guard portal" className="flex-1 px-4 py-6">
            <p className="px-3 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/45">Gate operations</p>
            <div className="mt-3 space-y-1.5">
              {navigation.map((item) => {
                const active = isCurrent(pathname, item.href, "exact" in item && item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200",
                      active && "bg-white text-emerald-950 shadow-[0_8px_28px_rgba(0,0,0,0.16)] hover:bg-white hover:text-emerald-950",
                    )}
                  >
                    <Icon className={cn("size-[1.15rem]", active ? "text-emerald-800" : "text-emerald-200/70 group-hover:text-emerald-100")} aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="p-4">
            <Link
              href="/guard/scan"
              className="group flex min-h-24 items-center gap-4 rounded-2xl bg-emerald-300 p-4 text-emerald-950 shadow-[0_16px_40px_rgba(0,0,0,0.18)] transition-colors hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-emerald-950 text-white">
                <QrCode className="size-6" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-bold">Scan booking QR</span>
                <span className="mt-1 block text-xs leading-4 text-emerald-950/65">Camera or access code</span>
              </span>
            </Link>
            <p className="mt-4 px-2 text-[0.68rem] leading-5 text-white/40">Operational access is limited to your active property and provider assignments.</p>
          </div>
        </aside>

        <div className="min-w-0">
          <GuardTopBar />
          <main id="guard-main" className="mx-auto w-full max-w-[94rem] px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8 xl:px-10">
            {children}
          </main>
          <GuardBottomNav />
        </div>
      </div>
    </RoleGuard>
  );
}
