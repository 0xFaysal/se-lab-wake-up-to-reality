"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";

export function PreferencesCard() {
  const [bookingConfirmations, setBookingConfirmations] = useState(true);
  const [arrivalReminders, setArrivalReminders] = useState(true);
  const [paymentReceipts, setPaymentReceipts] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs urban-card-shadow space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-foreground font-heading">
          Preferences
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Manage how we communicate with you.
        </p>
      </div>

      {/* Switch Items List */}
      <div className="space-y-4 divide-y divide-border/60">
        {/* Item 1: Booking Confirmations */}
        <div className="flex items-center justify-between gap-4 pt-1 first:pt-0">
          <div className="space-y-0.5 pr-2">
            <span className="text-sm font-bold text-foreground font-heading block">
              Booking confirmations
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Receive emails and SMS when a booking is confirmed.
            </p>
          </div>
          <Switch
            checked={bookingConfirmations}
            onCheckedChange={setBookingConfirmations}
            aria-label="Toggle booking confirmations"
          />
        </div>

        {/* Item 2: Arrival Reminders */}
        <div className="flex items-center justify-between gap-4 pt-4">
          <div className="space-y-0.5 pr-2">
            <span className="text-sm font-bold text-foreground font-heading block">
              Arrival reminders
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Get notified 30 minutes before your parking reservation begins.
            </p>
          </div>
          <Switch
            checked={arrivalReminders}
            onCheckedChange={setArrivalReminders}
            aria-label="Toggle arrival reminders"
          />
        </div>

        {/* Item 3: Payment Receipts */}
        <div className="flex items-center justify-between gap-4 pt-4">
          <div className="space-y-0.5 pr-2">
            <span className="text-sm font-bold text-foreground font-heading block">
              Payment receipts
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Receive automated invoices after each completed transaction.
            </p>
          </div>
          <Switch
            checked={paymentReceipts}
            onCheckedChange={setPaymentReceipts}
            aria-label="Toggle payment receipts"
          />
        </div>

        {/* Item 4: Safety and Security Alerts (MANDATORY) */}
        <div className="flex items-center justify-between gap-4 pt-4">
          <div className="space-y-0.5 pr-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground font-heading block">
                Safety and security alerts
              </span>
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-heading">
                Mandatory
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Critical alerts regarding your account and vehicle safety.
            </p>
          </div>
          <Switch
            checked={true}
            disabled={true}
            aria-label="Mandatory safety alerts (disabled)"
          />
        </div>
      </div>
    </div>
  );
}
