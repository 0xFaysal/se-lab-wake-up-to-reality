import React from "react";
import type { Metadata } from "next";
import { OwnerSessionsView } from "@/features/owner/components/owner-sessions-view";

export const metadata: Metadata = {
  title: "Active Sessions Live Monitor | ParkEase BD Owner Portal",
  description:
    "Real-time occupancy tracking, vehicle telemetry, duration counters, and overtime alerts across all your properties.",
};

export default function OwnerSessionsPage() {
  return <OwnerSessionsView />;
}
