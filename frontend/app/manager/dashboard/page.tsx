import React from "react";
import type { Metadata } from "next";
import { ManagerDashboardClient } from "./manager-dashboard-client";

export const metadata: Metadata = {
  title: "Manager Dashboard | ParkEase BD",
  description:
    "Delegated operational management dashboard for assigned parking facilities, reservations, and security personnel in Dhaka.",
};

export default function ManagerDashboardPage() {
  return <ManagerDashboardClient />;
}
