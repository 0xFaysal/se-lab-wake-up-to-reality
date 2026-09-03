"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Car,
  CreditCard,
  HelpCircle,
  Shield,
  Lock,
  CalendarCheck,
  Building2,
} from "lucide-react";
import { NearestReservationCard } from "@/features/bookings/components/nearest-reservation-card";
import { BookingListItem } from "@/features/bookings/components/booking-list-item";
import { MOCK_BOOKINGS } from "@/lib/data/mock-driver-data";
import { BookingStatus } from "@/types/driver";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "UPCOMING", label: "Upcoming (3)" },
  { id: "ACTIVE", label: "Active" },
  { id: "COMPLETED", label: "Completed" },
  { id: "CANCELLED", label: "Cancelled" },
];

export default function MyBookingsPage() {
  const [activeTab, setActiveTab] = useState("UPCOMING");
  const [bookings, setBookings] = useState(MOCK_BOOKINGS);

  const nearestBooking = bookings[0];
  const laterBookings = bookings.slice(1, 3);
  const completedBookings = bookings.filter((b) => b.status === "COMPLETED");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading">
            My Bookings
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
            Manage your upcoming reservations, access parking spaces, and review
            your past activity across Dhaka.
          </p>
        </div>

        {/* Interactive Filter Tabs */}
        <div className="flex items-center gap-6 border-b border-border/80 overflow-x-auto pb-px">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative pb-3 text-sm font-bold transition-colors whitespace-nowrap cursor-pointer font-heading",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left 2/3 + Right 1/3 */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-8 space-y-8">
          {activeTab === "UPCOMING" ? (
            <>
              {/* Nearest Reservation Section */}
              {nearestBooking && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground font-heading">
                    Nearest Reservation
                  </h2>
                  <NearestReservationCard booking={nearestBooking} />
                </div>
              )}

              {/* Later This Month Section */}
              <div className="space-y-4 pt-2">
                <h2 className="text-xl font-bold text-foreground font-heading">
                  Later This Month
                </h2>
                <div className="space-y-3">
                  {laterBookings.map((b, idx) => (
                    <BookingListItem
                      key={b.id}
                      booking={b}
                      iconType={idx === 0 ? "parking" : "building"}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : activeTab === "COMPLETED" ? (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground font-heading">
                Past Completed Parking
              </h2>
              <div className="space-y-3">
                {completedBookings.map((b) => (
                  <BookingListItem key={b.id} booking={b} iconType="parking" />
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center space-y-3">
              <CalendarCheck className="mx-auto size-10 text-muted-foreground/60" />
              <h3 className="text-base font-bold text-foreground font-heading">
                No {activeTab.toLowerCase()} reservations
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                You do not have any {activeTab.toLowerCase()} parking bookings in
                Dhaka right now.
              </p>
              <Link
                href="/parking"
                className="inline-block mt-2 rounded-lg bg-primary text-white text-xs font-bold px-4 py-2 hover:bg-primary/90"
              >
                Find Parking Now
              </Link>
            </div>
          )}
        </div>

        {/* Right Sidebar (1/3) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm ring-1 ring-border/50 urban-card-shadow space-y-5">
            <h3 className="text-lg font-bold text-foreground font-heading">
              Quick Actions
            </h3>

            <div className="space-y-3">
              <Link
                href="/parking"
                className="flex items-center gap-3.5 rounded-xl p-3 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Search className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground font-heading">
                    Find Parking
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Search available spaces in Dhaka
                  </p>
                </div>
              </Link>

              <Link
                href="/driver/vehicles"
                className="flex items-center gap-3.5 rounded-xl p-3 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Car className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground font-heading">
                    Manage Vehicles
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    View registered vehicles
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-3.5 rounded-xl p-3 hover:bg-muted/50 transition-colors group cursor-pointer">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground font-heading">
                    Payment Methods
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Manage saved payment options
                  </p>
                </div>
              </div>

              <Link
                href="/safety"
                className="flex items-center gap-3.5 rounded-xl p-3 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <HelpCircle className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground font-heading">
                    Help & Support
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Contact support team
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Secure Access Card */}
          <div className="relative overflow-hidden rounded-2xl bg-[#064E3B] p-6 text-white shadow-md">
            <Lock className="absolute -right-4 -bottom-4 size-28 text-white/10 pointer-events-none" />
            <div className="relative z-10 space-y-2.5">
              <div className="flex items-center gap-2">
                <Shield className="size-5 text-emerald-300" />
                <h4 className="text-base font-bold text-white font-heading">
                  Secure Access
                </h4>
              </div>
              <p className="text-xs text-emerald-50/90 leading-relaxed">
                Your QR code and access OTP are unique to this booking. Never
                share them outside the ParkEase BD verification process.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
