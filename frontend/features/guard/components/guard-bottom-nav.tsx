"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ClipboardCheck, Home, QrCode, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { guardApi } from "@/lib/api/guard-api";
import { queryKeys } from "@/lib/query-keys";

interface NavItemConfig {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const leftItems: NavItemConfig[] = [
  { href: "/guard", label: "Home", icon: Home, exact: true },
  { href: "/guard/bookings", label: "Bookings", icon: CalendarDays },
];

const rightItems: NavItemConfig[] = [
  { href: "/guard/assignments", label: "Duty", icon: ClipboardCheck },
  { href: "/guard/profile", label: "Profile", icon: UserRound },
];

export function GuardBottomNav() {
  const pathname = usePathname();

  const memberships = useQuery({
    queryKey: queryKeys.guardMemberships.all({ limit: 100 }),
    queryFn: () => guardApi.listMemberships({ limit: 100 }),
    staleTime: 30_000,
  });

  const hasPendingInvite = Boolean(
    memberships.data?.memberships.some((item) => item.status === "PENDING_ACCEPTANCE")
  );

  const isScanActive = pathname.startsWith("/guard/scan");

  return (
    <nav
      aria-label="Guard mobile navigation"
      className="fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto w-[calc(100%-1.5rem)] max-w-md lg:hidden"
    >
      <div className="relative grid grid-cols-5 items-center rounded-[28px] border border-emerald-950/10 bg-white/95 px-1.5 py-1.5 shadow-[0_14px_40px_rgba(6,63,50,0.12),0_2px_10px_rgba(0,0,0,0.04)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/88">
        {/* Left Side (2 items: Home, Bookings) */}
        {leftItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={active}
            />
          );
        })}

        {/* Center Item (Prominent QR Code Floating FAB) */}
        <div className="relative flex flex-col items-center justify-center">
          <Link
            href="/guard/scan"
            aria-label="Scan booking QR"
            aria-current={isScanActive ? "page" : undefined}
            className="group relative -mt-7 flex flex-col items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 rounded-full"
          >
            <span
              className={cn(
                "relative grid size-14 place-items-center rounded-full text-white transition-all duration-300 border-[3.5px] border-white shadow-[0_10px_25px_rgba(6,63,50,0.38)] group-hover:scale-105 group-hover:shadow-[0_14px_30px_rgba(6,63,50,0.48)] group-active:scale-95",
                isScanActive
                  ? "bg-gradient-to-tr from-emerald-800 via-emerald-700 to-emerald-600 ring-2 ring-emerald-400/40 shadow-[0_0_24px_rgba(16,185,129,0.5)]"
                  : "bg-gradient-to-tr from-emerald-950 via-emerald-900 to-emerald-800"
              )}
            >
              <QrCode
                className="size-6 transition-transform duration-300 group-hover:rotate-6 group-active:scale-90"
                aria-hidden="true"
              />
              <span className="absolute inset-0 rounded-full bg-white/0 transition-colors group-hover:bg-white/10" />
            </span>
            <span
              className={cn(
                "mt-1 text-[0.65rem] tracking-tight transition-colors duration-200",
                isScanActive
                  ? "font-bold text-emerald-800"
                  : "font-semibold text-emerald-950 group-hover:text-emerald-800"
              )}
            >
              Scan
            </span>
            <span
              className={cn(
                "-mt-0.5 size-1 rounded-full transition-all duration-300",
                isScanActive ? "bg-emerald-700 opacity-100 scale-100" : "opacity-0 scale-0"
              )}
              aria-hidden="true"
            />
          </Link>
        </div>

        {/* Right Side (2 items: Duty, Profile) */}
        {rightItems.map((item) => {
          const active =
            item.href === "/guard/profile"
              ? pathname.startsWith("/guard/profile") || pathname.startsWith("/guard/account")
              : pathname.startsWith(item.href);
          const badge = item.href === "/guard/assignments" && hasPendingInvite;

          return (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={active}
              badge={badge}
            />
          );
        })}
      </div>
    </nav>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  badge = false,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  badge?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-2xl py-1 text-slate-500 transition-all duration-200 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800",
        active && "text-emerald-950"
      )}
    >
      <span
        className={cn(
          "relative grid h-8 min-w-[2.75rem] place-items-center rounded-full px-2.5 transition-all duration-300",
          active
            ? "bg-emerald-100/90 text-emerald-950 shadow-xs"
            : "text-slate-500 group-hover:bg-emerald-50/80 group-hover:text-emerald-900"
        )}
      >
        <Icon
          className={cn(
            "size-[1.18rem] transition-transform duration-200 group-hover:scale-110",
            active && "stroke-[2.35px]"
          )}
          aria-hidden="true"
        />
        {badge && (
          <span className="absolute right-1.5 top-1 flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-amber-500 ring-2 ring-white" />
          </span>
        )}
      </span>
      <span
        className={cn(
          "text-[0.62rem] tracking-tight transition-colors duration-200",
          active ? "font-bold text-emerald-950" : "font-medium text-slate-500 group-hover:text-slate-800"
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "-mt-0.5 size-1 rounded-full transition-all duration-300",
          active ? "bg-emerald-700 opacity-100 scale-100" : "opacity-0 scale-0"
        )}
        aria-hidden="true"
      />
    </Link>
  );
}
