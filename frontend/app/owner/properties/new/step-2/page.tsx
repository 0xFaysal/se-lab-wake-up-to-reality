import React from "react";
import type { Metadata } from "next";
import { Step2LocationView } from "@/features/owner/wizard/steps/step-2-location-view";

export const metadata: Metadata = {
  title: "Step 2: Location & Entrance | Add Parking Space | ParkEase BD",
  description: "Set the exact parking location, entrance gate pin, and navigation instructions for drivers.",
};

export default function Step2LocationPage() {
  return <Step2LocationView />;
}
