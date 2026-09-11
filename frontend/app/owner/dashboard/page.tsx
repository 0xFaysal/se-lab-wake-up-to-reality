import React from "react";
import type { Metadata } from "next";
import { OwnerDashboardView } from "@/features/owner/components/owner-dashboard-view";

export const metadata: Metadata = {
  title: "Overview | Property Owner Management Portal",
  description: "Monitor active listings, occupied spaces, upcoming bookings, and recent operational activity across your parking spaces in Dhaka.",
};

export default function OwnerDashboardPage() {
  return <OwnerDashboardView />;
}
