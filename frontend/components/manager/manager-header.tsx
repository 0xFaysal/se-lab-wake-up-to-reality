"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell, Building2, HelpCircle } from "lucide-react";
import { managerApi } from "@/lib/api/manager-api";
import { queryKeys } from "@/lib/query-keys";
import { useCurrentUser } from "@/hooks/use-current-user";

import { notificationsApi } from "@/lib/api/notifications-api";

export interface ManagerHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  selectedPropertyId?: string;
  onSelectPropertyId?: (propertyId: string) => void;
  rightExtra?: React.ReactNode;
}

export function ManagerHeader({
  title,
  subtitle,
  badge = "Manager View",
  breadcrumbs = [],
  selectedPropertyId,
  onSelectPropertyId,
  rightExtra,
}: ManagerHeaderProps) {
  const { data: user } = useCurrentUser();

  const delegationsQuery = useQuery({
    queryKey: queryKeys.managerDelegations.manager,
    queryFn: managerApi.listForManager,
  });

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications.all({}),
    queryFn: notificationsApi.list,
    retry: false,
  });

  const activeDelegations = delegationsQuery.data?.filter((d) => d.status === "ACTIVE") ?? [];
  const unreadNotifs = notificationsQuery.data?.filter((n) => !n.readAt).length ?? 0;

  const displayName = user?.fullName || "Property Manager";
  const userInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3.5 sm:px-6 lg:px-8">
      <div className="mx-auto flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between max-w-7xl">
        {/* Left: Title, Badge, Breadcrumbs, Subtitle */}
        <div className="min-w-0">
          {breadcrumbs.length > 0 && (
            <nav
              aria-label="Breadcrumb"
              className="mb-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500"
            >
              <Link href="/manager/dashboard" className="transition-colors hover:text-slate-900">
                Manager Portal
              </Link>
              {breadcrumbs.map((b) => (
                <React.Fragment key={`${b.label}-${b.href ?? "current"}`}>
                  <span className="text-slate-300">/</span>
                  {b.href ? (
                    <Link href={b.href} className="transition-colors hover:text-slate-900">
                      {b.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-slate-800" aria-current="page">
                      {b.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              {title}
            </h1>
            {badge && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-[#064E3B] border border-emerald-200/80">
                <span className="size-1.5 rounded-full bg-emerald-600" />
                {badge}
              </span>
            )}
          </div>

          {subtitle && (
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500 line-clamp-1 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right: Controls, Notifications, Help, Profile */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
          {rightExtra}

          {/* Assigned Property Dropdown Selector */}
          <div className="relative">
            <label htmlFor="property-switcher" className="sr-only">
              Assigned Property
            </label>
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 transition px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs">
              <Building2 className="size-3.5 text-[#064E3B] shrink-0" />
              <span className="hidden sm:inline text-slate-500 font-normal">Assigned Property:</span>
              <select
                id="property-switcher"
                value={selectedPropertyId ?? "ALL"}
                onChange={(e) => onSelectPropertyId?.(e.target.value)}
                className="bg-transparent pr-1 font-semibold text-slate-900 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">
                  All Assigned Properties ({activeDelegations.length})
                </option>
                {activeDelegations.map((d) => (
                  <option key={d.property.id} value={d.property.id}>
                    {d.property.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notification Bell */}
          <Link
            href="/manager/notifications"
            className="relative flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
            aria-label="View notifications"
          >
            <Bell className="size-4" />
            {unreadNotifs > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-xs">
                {unreadNotifs > 9 ? "9+" : unreadNotifs}
              </span>
            )}
          </Link>

          {/* Help & Support */}
          <Link
            href="/manager/support"
            className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
            aria-label="Help & Support"
          >
            <HelpCircle className="size-4" />
          </Link>

          {/* User Profile Pill */}
          <Link
            href="/manager/profile"
            className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 hover:bg-slate-50 transition shadow-2xs group"
          >
            <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-[#064E3B] text-xs font-bold text-white shadow-2xs">
              {userInitials}
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <span className="block text-xs font-bold text-slate-900 group-hover:text-[#064E3B] transition-colors">
                {displayName}
              </span>
              <span className="block text-[11px] font-medium text-slate-500">
                Property Manager
              </span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
