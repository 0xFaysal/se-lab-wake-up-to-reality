import React from "react";
import type { Metadata } from "next";
import { Step5AmenitiesView } from "@/features/owner/wizard/steps/step-5-amenities-view";

export const metadata: Metadata = {
  title: "Step 5: Amenities & Security | Add Parking Space | ParkEase BD",
  description: "Select parking amenities, configure on-site security standards, gate access controls, and driver instructions.",
};

export default function Step5AmenitiesPage() {
  return <Step5AmenitiesView />;
}
