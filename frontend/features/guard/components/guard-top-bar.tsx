"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Bell, Clock3, MapPin, Menu, ShieldCheck } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { guardApi } from "@/lib/api/guard-api";
import { notificationsApi } from "@/lib/api/notifications-api";
import { queryKeys } from "@/lib/query-keys";

const pageTitles: Array<[RegExp, string]> = [
  [/^\/guard$/, "Operations overview"],
  [/^\/guard\/scan/, "Verify booking"],
  [/^\/guard\/bookings\/.+\/active/, "Active session"],
  [/^\/guard\/bookings\/.+/, "Booking details"],
  [/^\/guard\/bookings/, "Booking operations"],
  [/^\/guard\/assignments/, "Assignments"],
  [/^\/guard\/notifications/, "Notifications"],
  [/^\/guard\/profile/, "Guard profile"],
  [/^\/guard\/account/, "Account security"],
];

export function GuardTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useCurrentUser();
  const assignments = useQuery({
    queryKey: queryKeys.guardAssignments.all({ limit: 100 }),
    queryFn: () => guardApi.listForGuard({ limit: 100 }),
    staleTime: 30_000,
  });
  const memberships = useQuery({
    queryKey: queryKeys.guardMemberships.all({ limit: 100 }),
    queryFn: () => guardApi.listMemberships({ limit: 100 }),
    staleTime: 30_000,
  });
  const notifications = useQuery({
    queryKey: queryKeys.notifications.all(),
    queryFn: notificationsApi.list,
    staleTime: 30_000,
  });

  const activeAssignment = assignments.data?.assignments.find((item) => item.status === "ACTIVE");
  const pendingMembership = memberships.data?.memberships.find((item) => item.status === "PENDING_ACCEPTANCE");
  const acceptedMembership = memberships.data?.memberships.find((item) => item.status === "ACTIVE");
  const unread = notifications.data?.filter((item) => !item.readAt).length ?? 0;
  const title = pageTitles.find(([pattern]) => pattern.test(pathname))?.[1] ?? "Guard portal";
  const initials = user.data?.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() ?? "G";
  const isRoot = pathname === "/guard";

  useEffect(() => {
    document.title = `${title} | ParkEase Guard`;
  }, [title]);

  return (
    <header className="sticky top-0 z-30 border-b border-emerald-950/10 bg-[color-mix(in_srgb,var(--guard-canvas)_92%,white)]/95 backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--guard-canvas)_82%,white)]/88">
      <a href="#guard-main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-emerald-900 focus:shadow-lg">Skip to operations</a>
      <div className="mx-auto flex h-[4.5rem] w-full max-w-[94rem] items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8 xl:px-10">
        <div className="flex min-w-0 items-center gap-3">
          {!isRoot ? (
            <button type="button" onClick={() => router.back()} aria-label="Go back" className="grid size-11 shrink-0 place-items-center rounded-xl border border-emerald-950/10 bg-white text-slate-700 transition-colors hover:border-emerald-800/30 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800 lg:hidden">
              <ArrowLeft className="size-5" aria-hidden="true" />
            </button>
          ) : (
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-900 text-white lg:hidden">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Menu className="hidden size-4 text-emerald-800 lg:block" aria-hidden="true" />
              <p className="truncate text-sm font-bold tracking-[-0.01em] text-slate-950 sm:text-base">{title}</p>
            </div>
            <p className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-[0.7rem] text-slate-500 sm:text-xs">
              <MapPin className="size-3 shrink-0 text-emerald-700" aria-hidden="true" />
              {activeAssignment ? `${activeAssignment.property.name}${activeAssignment.provider ? ` · ${activeAssignment.provider.fullName}` : ""}` : pendingMembership ? "Property invitation needs your response" : acceptedMembership ? "Property accepted · waiting for Provider shift" : "No active gate assignment"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {activeAssignment ? (
            <span className="hidden items-center gap-2 rounded-full border border-emerald-800/15 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900 sm:inline-flex"><span className="size-2 rounded-full bg-emerald-600 motion-safe:animate-pulse" aria-hidden="true" />On duty</span>
          ) : pendingMembership ? (
            <Link href="/guard/assignments" className="hidden items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-950 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 sm:inline-flex"><Clock3 className="size-3.5" aria-hidden="true" />Invitation waiting</Link>
          ) : acceptedMembership ? (
            <Link href="/guard/assignments" className="hidden items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-900 hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 sm:inline-flex"><Clock3 className="size-3.5" aria-hidden="true" />Waiting for shift</Link>
          ) : (
            <Link href="/guard/assignments" className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-emerald-700/30 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800 sm:inline-flex"><span className="size-2 rounded-full bg-slate-300" aria-hidden="true" />Not assigned</Link>
          )}
          <Link href="/guard/notifications" aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"} className="relative grid size-11 place-items-center rounded-xl text-slate-600 transition-colors hover:bg-white hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800">
            <Bell className="size-5" aria-hidden="true" />
            {unread > 0 && <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-amber-500 px-1 text-[0.58rem] font-bold leading-4 text-amber-950">{unread > 9 ? "9+" : unread}</span>}
          </Link>
          <Link href="/guard/profile" aria-label={user.data ? `${user.data.fullName}, open profile` : "Open profile"} className="grid size-10 place-items-center rounded-xl bg-emerald-950 text-xs font-bold text-white shadow-sm transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800 focus-visible:ring-offset-2">
            {initials}
          </Link>
        </div>
      </div>
    </header>
  );
}
