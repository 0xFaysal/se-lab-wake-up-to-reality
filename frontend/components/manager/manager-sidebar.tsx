"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  LayoutGrid,
  LockKeyhole,
  MonitorSmartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandIcon } from "@/components/common/app-logo";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/manager/dashboard", icon: LayoutGrid },
    ],
  },
  {
    label: "Delegated Work",
    items: [
      {
        label: "Properties",
        href: "/manager/properties",
        icon: Building2,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        label: "Security",
        href: "/manager/account/security",
        icon: LockKeyhole,
      },
      {
        label: "Sessions",
        href: "/manager/account/sessions",
        icon: MonitorSmartphone,
      },
    ],
  },
];

export function ManagerSidebar({
  onCloseMobile,
}: {
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-dvh w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <Link
        href="/manager/dashboard"
        onClick={onCloseMobile}
        className="flex h-16 items-center gap-3 border-b border-slate-200 px-5"
      >
        <BrandIcon size={36} className="size-9" />
        <span>
          <strong className="block text-sm text-slate-950">ParkEase BD</strong>
          <span className="text-[11px] font-medium text-emerald-700">
            Manager Portal
          </span>
        </span>
      </Link>

      <nav
        aria-label="Manager navigation"
        className="flex-1 overflow-y-auto px-3 py-4"
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/manager/dashboard" &&
                    pathname.startsWith(`${item.href}/`));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-emerald-50 text-[#064E3B]"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
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

      <div className="border-t border-slate-200 p-4">
        <p className="text-[11px] leading-5 text-slate-500">
          Your access is limited by the permissions and resource scope in your
          active Provider delegation.
        </p>
      </div>
    </aside>
  );
}
