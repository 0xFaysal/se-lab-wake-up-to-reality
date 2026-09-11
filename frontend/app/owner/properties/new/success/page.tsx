import React from "react";
import type { Metadata } from "next";
import { StepSuccessView } from "@/features/owner/wizard/steps/step-success-view";

export const metadata: Metadata = {
  title: "Listing Published Live | Add Parking Space | ParkEase BD",
  description: "Your parking space listing is now live and accepting reservations across Dhaka on ParkEase BD.",
};

export default function StepSuccessPage() {
  return <StepSuccessView />;
}
