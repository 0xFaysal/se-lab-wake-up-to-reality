import React from "react";
import type { Metadata } from "next";
import { OwnerGuardsLiveView } from "@/features/owner/components/owner-guards-live-view";

export const metadata: Metadata = {
  title: "Guards Management | Property Owner Management Portal",
  description: "Manage security guards, duty schedules, gate assignments, and temporary credential onboarding across your parking properties in Dhaka.",
};

export default function OwnerGuardsPage() {
  return <OwnerGuardsLiveView />;
}
