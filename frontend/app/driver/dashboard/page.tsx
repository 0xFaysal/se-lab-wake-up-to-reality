import React from "react";
import type { Metadata } from "next";
import { DriverDashboardView } from "@/features/dashboard/components/driver-dashboard-view";

export const metadata: Metadata = {
  title: "Driver Dashboard | ParkEase BD",
  description: "Manage active parking passes, upcoming arrivals, and quick reservations in Dhaka.",
};

export default function DriverDashboardPage() {
  return <DriverDashboardView />;
}
