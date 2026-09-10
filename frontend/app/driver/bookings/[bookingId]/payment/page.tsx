import React from "react";
import type { Metadata } from "next";
import { DriverHoldCheckoutView } from "@/features/payments/components/driver-hold-checkout-view";

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

export const metadata: Metadata = {
  title: "Secure Hold & Checkout | ParkEase BD",
  description: "Complete payment to confirm your 5-minute reserved parking slot in Dhaka.",
};

export default async function DriverHoldPaymentPage({ params }: PageProps) {
  const { bookingId } = await params;
  return <DriverHoldCheckoutView bookingId={bookingId} />;
}
