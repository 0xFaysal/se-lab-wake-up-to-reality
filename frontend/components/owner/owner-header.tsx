"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bell, Settings, ShieldCheck, User } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { useCurrentUser } from "@/hooks/use-current-user";

interface OwnerHeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

export function OwnerHeader({
  title = "Overview",
  subtitle = "Welcome back, here is your property portfolio summary",
  actions,
  badge,
}: OwnerHeaderProps) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { data: currentUser } = useCurrentUser();
  const displayName = currentUser?.fullName ?? "Provider";
  const initials = displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const role = "Provider";

  return (
    <header className="h-20 bg-white border-b border-[#E5E7EB] px-6 sm:px-8 lg:px-10 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Page Title, Badge & Subtitle */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 tracking-tight leading-tight">
            {title}
          </h1>
          {badge && <div>{badge}</div>}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right: Actions, Notifications, Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {actions && <div className="hidden sm:block">{actions}</div>}

        {/* Notifications Icon Button */}
        <Link
          href="/owner/notifications"
          className="relative size-10 rounded-full border border-[#E5E7EB] hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shadow-2xs"
          aria-label="View notifications"
        >
          <Bell className="size-4.5" />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-emerald-600 ring-2 ring-white" />
        </Link>

        {/* Settings Icon Button */}
        <Link
          href="/owner/security"
          className="size-10 rounded-full border border-[#E5E7EB] hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shadow-2xs"
          aria-label="Owner settings"
        >
          <Settings className="size-4.5" />
        </Link>

        {/* User Profile Capsule */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-xl border border-transparent hover:border-[#E5E7EB] hover:bg-slate-50 transition-all cursor-pointer text-left"
            aria-label="Owner profile menu"
          >
            <div className="size-9 rounded-lg bg-emerald-100 text-[#064E3B] font-bold text-xs flex items-center justify-center font-heading shadow-2xs shrink-0">
              {initials}
            </div>

            <div className="hidden md:flex flex-col">
              <span className="text-sm font-bold text-slate-900 font-heading leading-tight">
                {displayName}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {role}
              </span>
            </div>
          </button>

          {/* Profile Dropdown */}
          {profileDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-[#E5E7EB] shadow-lg py-2 z-50 animate-in fade-in-50 zoom-in-95"
              onMouseLeave={() => setProfileDropdownOpen(false)}
            >
              <div className="px-4 py-2 border-b border-[#E5E7EB] mb-1">
                <p className="text-xs text-slate-400">Signed in as</p>
                <p className="text-sm font-bold text-slate-800 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {currentUser?.email ?? "Loading account..."}
                </p>
              </div>

              <Link
                href="/owner/security"
                onClick={() => setProfileDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                <User className="size-4 text-slate-400" />
                Account Security
              </Link>

              <Link
                href="/owner/support"
                onClick={() => setProfileDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                <ShieldCheck className="size-4 text-emerald-700" />
                Verified Host Guidelines
              </Link>

              <div className="my-1 border-t border-[#E5E7EB]" />

              <LogoutButton className="h-auto w-full justify-start rounded-none border-0 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
