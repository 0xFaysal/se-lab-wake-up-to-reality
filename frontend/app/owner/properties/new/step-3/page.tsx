import React from "react";
import type { Metadata } from "next";
import { Step3SpacesView } from "@/features/owner/wizard/steps/step-3-spaces-view";

export const metadata: Metadata = {
  title: "Step 3: Parking Spaces | Add Parking Space | ParkEase BD",
  description: "Configure individual reservable parking spaces, bay sizes, features, and vehicle compatibility rules.",
};

export default function Step3SpacesPage() {
  return <Step3SpacesView />;
}
