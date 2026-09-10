"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield, Bell, ArrowLeft } from "lucide-react";

interface GuardTopBarProps {
  guardName?: string;
  avatarUrl?: string;
  notificationsCount?: number;
}

export function GuardTopBar({
  guardName = "Rahim Uddin",
  avatarUrl = "/assets/avatar-guard.jpg",
  notificationsCount = 2,
}: GuardTopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isSubPage = pathname !== "/guard";

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-[#E5E7EB] bg-white px-3 select-none">
      {/* Brand & Portal Label with Back Navigation if on subpage */}
      <div className="flex items-center gap-2">
        {isSubPage ? (
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go Back"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 active:scale-95 transition-colors [-webkit-tap-highlight-color:transparent]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : null}

        <Link href="/guard" className="flex items-center gap-2 group transition-opacity hover:opacity-90">
          {!isSubPage && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#064E3B] text-white shadow-sm">
              <Shield className="h-4.5 w-4.5 fill-current" />
            </div>
          )}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 font-bold text-sm tracking-tight text-[#064E3B] font-heading">
              <span>ParkEase BD</span>
              <span className="text-[#9CA3AF] font-normal">|</span>
              <span className="text-[#1F2937] font-semibold text-xs tracking-normal">Guard Portal</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Right Actions: Notifications & Avatar */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          aria-label="Duty Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 active:scale-95 [-webkit-tap-highlight-color:transparent]"
        >
          <Bell className="h-5 w-5 text-[#374151]" />
          {notificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#064E3B]" />
            </span>
          )}
        </button>

        <Link
          href="/guard/profile"
          className="relative flex h-8.5 w-8.5 overflow-hidden rounded-full border-2 border-emerald-700/20 shadow-xs transition-transform active:scale-95 [-webkit-tap-highlight-color:transparent]"
        >
          <Image
            src={avatarUrl}
            alt={guardName}
            width={34}
            height={34}
            className="h-full w-full object-cover"
            priority
          />
        </Link>
      </div>
    </header>
  );
}
