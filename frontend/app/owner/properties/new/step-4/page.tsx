import React from "react";
import type { Metadata } from "next";
import { Step4PricingView } from "@/features/owner/wizard/steps/step-4-pricing-view";

export const metadata: Metadata = {
  title: "Step 4: Availability & Pricing | Add Parking Space | ParkEase BD",
  description: "Configure weekly operating hours, hourly and daily rates, space-type pricing, peak surcharges, and cancellation policies.",
};

export default function Step4PricingPage() {
  return <Step4PricingView />;
}
