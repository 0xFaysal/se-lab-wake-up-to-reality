"use client";

import { useState } from "react";
import { Search, CreditCard, ShieldCheck, PlusCircle, CalendarCheck, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const DRIVER_STEPS = [
  {
    step: "01",
    icon: Search,
    title: "Search & Compare",
    description:
      "Enter your destination in Dhaka (Dhanmondi, Gulshan, Banani, etc.) to discover nearby residential parking spaces with live hourly rates.",
  },
  {
    step: "02",
    icon: CreditCard,
    title: "Instant 5-Min Hold & Book",
    description:
      "Lock your parking slot with conflict-free instant holds. Complete payment safely via SSLCOMMERZ or digital wallet.",
  },
  {
    step: "03",
    icon: ShieldCheck,
    title: "Show QR/OTP & Park",
    description:
      "Arrive at the gate and present your single-use entry QR or OTP to the building security guard for instant verification.",
  },
];

const OWNER_STEPS = [
  {
    step: "01",
    icon: PlusCircle,
    title: "List Empty Daytime Slots",
    description:
      "Add your residential garage or building slots that sit vacant while you or your tenants are away at work during the day.",
  },
  {
    step: "02",
    icon: CalendarCheck,
    title: "Set Weekly Availability",
    description:
      "Configure recurring operating hours, vehicle size limits, and block specific dates or times whenever you need the space.",
  },
  {
    step: "03",
    icon: Wallet,
    title: "Earn Hassle-Free Income",
    description:
      "Guards verify entry/exit on mobile. Completed bookings automatically credit your earnings ledger for quick payout withdrawal.",
  },
];

export function HowItWorks() {
  const [activeTab, setActiveTab] = useState<"driver" | "owner">("driver");

  const steps = activeTab === "driver" ? DRIVER_STEPS : OWNER_STEPS;

  return (
    <section className="py-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-xs font-semibold tracking-wider text-primary uppercase">
            Simple & Seamless
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How ParkEase BD Works
          </p>
          <p className="mt-4 text-base text-muted-foreground">
            Whether you need a parking spot or have unused space during daytime,
            getting started takes under two minutes.
          </p>

          {/* Tab Switcher */}
          <div className="mt-8 inline-flex p-1 rounded-xl bg-muted/60 border">
            <button
              onClick={() => setActiveTab("driver")}
              className={cn(
                "px-6 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
                activeTab === "driver"
                  ? "bg-card text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              For Drivers
            </button>
            <button
              onClick={() => setActiveTab("owner")}
              className={cn(
                "px-6 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
                activeTab === "owner"
                  ? "bg-card text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              For Property Owners
            </button>
          </div>
        </div>

        {/* 3-Step Grid */}
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative rounded-2xl border bg-card p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-primary/30">
                    {item.step}
                  </span>
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-6" />
                  </div>
                </div>

                <h3 className="mt-6 text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
