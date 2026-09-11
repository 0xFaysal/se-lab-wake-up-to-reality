import React from "react";
import type { Metadata } from "next";
import { Step6PhotosView } from "@/features/owner/wizard/steps/step-6-photos-view";

export const metadata: Metadata = {
  title: "Step 6: Photos | Add Parking Space | ParkEase BD",
  description: "Upload clear photos of property exterior, entrance gate, parking spaces, and access ramp to help drivers arrive smoothly.",
};

export default function Step6PhotosPage() {
  return <Step6PhotosView />;
}
