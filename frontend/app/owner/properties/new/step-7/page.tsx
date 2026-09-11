import React from "react";
import type { Metadata } from "next";
import { Step7ReviewView } from "@/features/owner/wizard/steps/step-7-review-view";

export const metadata: Metadata = {
  title: "Step 7: Review & Publish | Add Parking Space | ParkEase BD",
  description: "Review your parking listing details, verify capacity, rates, amenities, and publish live to Dhaka marketplace.",
};

export default function Step7ReviewPage() {
  return <Step7ReviewView />;
}
