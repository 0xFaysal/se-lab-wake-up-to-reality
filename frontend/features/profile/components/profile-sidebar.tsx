"use client";

import Link from "next/link";
import {
  Car,
  CreditCard,
  History,
  HelpCircle,
  ChevronRight,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";

export function ProfileSidebar() {
  const { data: currentUser } = useCurrentUser();
  const displayName = currentUser?.fullName || "Driver";
  const initials = displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const NAV_LINKS = [
    {
      label: "Manage Vehicles",
      href: "/driver/vehicles",
      icon: Car,
    },
    {
      label: "Payment Methods",
      href: "/driver/payment-methods",
      icon: CreditCard,
    },
    {
      label: "My Bookings",
      href: "/driver/bookings",
      icon: History,
    },
    {
      label: "Help & Support",
      href: "/support",
      icon: HelpCircle,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Deep Emerald Profile Summary Card */}
      <div className="rounded-2xl bg-[#064E3B] text-white p-6 shadow-md text-center space-y-4">
        {/* Avatar Photo */}
        <div className="mx-auto flex size-20 items-center justify-center rounded-full border-2 border-white/60 bg-white/15 text-2xl font-black shadow-lg ring-3 ring-white/30 sm:size-24">{initials}</div>

        {/* Name & Role Badge */}
        <div className="space-y-1.5">
          <h3 className="text-xl font-black font-heading tracking-tight text-white">
            {displayName}
          </h3>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-0.5 text-xs font-bold text-emerald-100 font-heading">
            <span>Driver</span>
            <CheckCircle2 className="size-3.5 fill-emerald-400 text-[#064E3B]" />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/15 pt-2" />

        {/* Quick Links List */}
        <nav className="space-y-1 text-left">
          {NAV_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between p-2.5 rounded-xl text-emerald-50/90 hover:text-white hover:bg-white/10 transition-colors text-xs sm:text-sm font-medium font-heading"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="size-4 text-emerald-200/90" />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="size-4 text-white/50" />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 2. Your Privacy Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs urban-card-shadow space-y-3">
        <div className="flex items-center gap-2 text-foreground">
          <Shield className="size-4 text-primary shrink-0" />
          <h4 className="text-sm font-bold font-heading">Your privacy</h4>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          ParkEase BD strictly adheres to data protection guidelines. Your
          personal information is encrypted and only used to facilitate secure
          parking transactions.
        </p>

        <div className="pt-1">
          <Link
            href="/privacy"
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline transition-colors font-heading"
          >
            <span>View Privacy Policy</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
