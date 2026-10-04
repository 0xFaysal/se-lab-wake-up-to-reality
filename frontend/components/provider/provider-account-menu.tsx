"use client";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  LockKeyhole,
  Settings,
  UserRound,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-current-user";
import { notificationsApi } from "@/lib/api/notifications-api";
import { queryKeys } from "@/lib/query-keys";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function ProviderAccountMenu() {
  const user = useCurrentUser();
  const notifications = useQuery({
    queryKey: queryKeys.notifications.all(),
    queryFn: notificationsApi.list,
    enabled: Boolean(user.data),
    staleTime: 30_000,
  });
  const unread = notifications.data?.filter((item) => !item.readAt).length ?? 0;
  const name = user.data?.fullName ?? "Provider";
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Link
        href="/provider/notifications"
        aria-label={
          unread ? `Notifications, ${unread} unread` : "Notifications"
        }
        className="relative grid size-10 shrink-0 place-items-center rounded-md hover:bg-slate-100"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute right-0 top-0 rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex min-h-10 max-w-64 items-center gap-2 rounded-md border bg-white px-2 text-sm"
          aria-label="Provider account menu"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald-950 text-xs font-bold text-white">
            {initials}
          </span>
          <span className="hidden truncate sm:block">{name}</span>
          <ChevronDown className="size-4 shrink-0" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-56">
          <DropdownMenuItem render={<Link href="/provider/profile" />}>
            <UserRound />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/provider/settings" />}>
            <Settings />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/provider/account/security" />}>
            <LockKeyhole />
            Security
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
