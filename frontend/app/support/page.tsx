"use client";

import { useState } from "react";
import {
  Search,
  Calendar,
  MapPin,
  CreditCard,
  User,
  ShieldCheck,
  X,
} from "lucide-react";
import { SupportTopicCard } from "@/features/support/components/support-topic-card";
import { SupportFaqAccordion } from "@/features/support/components/support-faq-accordion";
import { SupportTicketForm } from "@/features/support/components/support-ticket-form";
import { SupportSidebar } from "@/features/support/components/support-sidebar";

const TOPICS = [
  {
    id: "booking",
    title: "Booking Help",
    description: "Reservation changes, Cancellation policy",
    icon: Calendar,
    query: "cancel",
  },
  {
    id: "access",
    title: "Parking Access",
    description: "QR / OTP problems, Finding the entrance",
    icon: MapPin,
    query: "QR",
  },
  {
    id: "payments",
    title: "Payments",
    description: "Payment failed, Refunds & Receipts",
    icon: CreditCard,
    query: "payment",
  },
  {
    id: "account",
    title: "Account",
    description: "Profile & Password, Vehicles & Alerts",
    icon: User,
    query: "account",
  },
  {
    id: "safety",
    title: "Safety",
    description: "Safety concerns, Emergency guidance",
    icon: ShieldCheck,
    query: "safety",
  },
];

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 pb-12">
      {/* Header & Search */}
      <div className="space-y-4 max-w-3xl">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading">
            Help & Support
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Get help with bookings, payments, parking access, account issues, and
            safety concerns.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="e.g. booking cancellation, payment issue, access OTP"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-11 pr-10 rounded-xl urban-input bg-[#F3F4F6] focus:bg-white text-sm text-foreground placeholder:text-muted-foreground border border-transparent focus:border-primary shadow-2xs outline-hidden"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: 2/3 Content (Left) + 1/3 Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* 1. Support Topics Grid */}
          <div className="space-y-3.5">
            <h3 className="text-xl font-bold text-foreground font-heading">
              Support Topics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {TOPICS.map((topic) => (
                <SupportTopicCard
                  key={topic.id}
                  title={topic.title}
                  description={topic.description}
                  icon={topic.icon}
                  onClick={() => setSearchQuery(topic.query)}
                />
              ))}
            </div>
          </div>

          {/* 2. Common Questions Accordion */}
          <SupportFaqAccordion searchQuery={searchQuery} />

          {/* 3. Contact Support Card */}
          <SupportTicketForm />
        </div>

        {/* Right Column (4 cols) - Sticky Sidebar */}
        <div className="lg:col-span-4 sticky top-24">
          <SupportSidebar />
        </div>
      </div>
    </div>
  );
}
