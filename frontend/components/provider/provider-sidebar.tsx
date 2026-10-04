"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { providerGroups as NAV_GROUPS, providerRouteActive } from "./provider-navigation";
import { cn } from "@/lib/utils";
import { BrandIcon } from "@/components/common/app-logo";
import { LogoutButton } from "@/components/auth/logout-button";


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
                const active = providerRouteActive(pathname, item.href);
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
