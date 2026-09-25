"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, QrCode, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/guard", label: "Home", icon: Home, exact: true },
  { href: "/guard/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/guard/profile", label: "Profile", icon: UserRound },
] as const;

export function GuardBottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Guard mobile navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-950/10 bg-white/95 px-3 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_30px_rgba(6,78,59,0.08)] backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-[1fr_1fr_4.5rem_1fr] items-end">
        {items.slice(0, 2).map((item) => {
          const active = "exact" in item && item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return <NavItem key={item.href} href={item.href} label={item.label} active={active} icon={<Icon className="size-5" aria-hidden="true" />} />;
        })}

        <Link href="/guard/scan" aria-label="Scan booking QR" aria-current={pathname === "/guard/scan" ? "page" : undefined} className="group -mt-8 flex flex-col items-center gap-1 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800">
          <span className={cn("grid size-14 place-items-center rounded-2xl border-4 border-white bg-emerald-900 text-white shadow-[0_10px_24px_rgba(6,78,59,0.34)] transition-transform group-active:scale-95", pathname === "/guard/scan" && "bg-emerald-700")}>
            <QrCode className="size-7" aria-hidden="true" />
          </span>
          <span className="text-[0.68rem] font-bold text-emerald-950">Scan</span>
        </Link>

        {items.slice(2).map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return <NavItem key={item.href} href={item.href} label={item.label} active={active} icon={<Icon className="size-5" aria-hidden="true" />} />;
        })}
      </div>
    </nav>
  );
}

function NavItem({ href, label, active, icon }: { href: string; label: string; active: boolean; icon: ReactNode }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-slate-500 transition-colors hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800", active && "text-emerald-900")}>
      <span className={cn("grid min-h-7 min-w-10 place-items-center rounded-full px-3", active && "bg-emerald-100")}>{icon}</span>
      <span className="text-[0.68rem] font-semibold">{label}</span>
    </Link>
  );
}
