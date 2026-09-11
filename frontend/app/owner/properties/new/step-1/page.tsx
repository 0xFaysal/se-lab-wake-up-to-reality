import React from "react";
import type { Metadata } from "next";
import { Step1DetailsView } from "@/features/owner/wizard/steps/step-1-details-view";

export const metadata: Metadata = {
  title: "Step 1: Property Details | Add Parking Space | ParkEase BD",
  description: "Enter property identification, facility category, structure, parking floors, and building description for your listing.",
};

export default function Step1DetailsPage() {
  return <Step1DetailsView />;
}
