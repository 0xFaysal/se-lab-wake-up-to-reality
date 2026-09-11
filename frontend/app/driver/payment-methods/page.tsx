"use client";

import { useState } from "react";
import { SavedPaymentMethod } from "@/features/payments/types";
import { SavedPaymentCard } from "@/features/payments/components/saved-payment-card";
import { AddPaymentForm } from "@/features/payments/components/add-payment-form";
import { PaymentSecurityBanner } from "@/features/payments/components/payment-security-banner";
import { PaymentMethodsSidebar } from "@/features/payments/components/payment-methods-sidebar";

const INITIAL_METHODS: SavedPaymentMethod[] = [
  {
    id: "pay-1",
    type: "BKASH",
    title: "bKash",
    subtitle: "017XXXXX456",
    isDefault: true,
    brand: "bkash",
  },
  {
    id: "pay-2",
    type: "NAGAD",
    title: "Nagad",
    subtitle: "019XXXXX789",
    isDefault: false,
    brand: "nagad",
  },
  {
    id: "pay-3",
    type: "CARD",
    title: "Visa Card ending in 4242",
    subtitle: "Exp 08/28",
    isDefault: false,
    brand: "visa",
    lastDigits: "4242",
    expiry: "08/28",
  },
];

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<SavedPaymentMethod[]>(INITIAL_METHODS);

  const defaultMethod = methods.find((m) => m.isDefault);

  function handleSetDefault(id: string) {
    setMethods((prev) =>
      prev.map((m) => ({
        ...m,
        isDefault: m.id === id,
      }))
    );
  }

  function handleRemove(id: string) {
    setMethods((prev) => {
      const remaining = prev.filter((m) => m.id !== id);
      // If we removed the default method and others exist, make the first one default
      if (prev.find((m) => m.id === id)?.isDefault && remaining.length > 0) {
        remaining[0].isDefault = true;
      }
      return remaining;
    });
  }

  function handleAddMethod(newMethodData: Omit<SavedPaymentMethod, "id">) {
    const newMethod: SavedPaymentMethod = {
      ...newMethodData,
      id: `pay-${Date.now()}`,
    };

    setMethods((prev) => {
      if (newMethod.isDefault || prev.length === 0) {
        return [
          ...prev.map((m) => ({ ...m, isDefault: false })),
          { ...newMethod, isDefault: true },
        ];
      }
      return [...prev, newMethod];
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 pb-12">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading">
          Payment Methods
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage the payment methods you use for parking reservations.
        </p>
      </div>

      {/* Main Grid: 2/3 Content (Left) + 1/3 Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Left 2/3 Column (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Saved Payment Methods Section */}
          <div className="space-y-3.5">
            <h3 className="text-lg font-bold text-foreground font-heading">
              Saved Payment Methods
            </h3>

            {methods.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center bg-card text-muted-foreground text-sm">
                No saved payment methods. Add one below to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {methods.map((method) => (
                  <SavedPaymentCard
                    key={method.id}
                    method={method}
                    onSetDefault={handleSetDefault}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Add Payment Method Form Card */}
          <AddPaymentForm onAddMethod={handleAddMethod} />

          {/* Payment Security Banner */}
          <PaymentSecurityBanner />
        </div>

        {/* Right 1/3 Column (4 cols) */}
        <div className="lg:col-span-4 sticky top-24">
          <PaymentMethodsSidebar defaultMethod={defaultMethod} />
        </div>
      </div>
    </div>
  );
}
