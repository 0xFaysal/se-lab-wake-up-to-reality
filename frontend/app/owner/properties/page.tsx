import React from "react";
import type { Metadata } from "next";
import { OwnerPropertiesLiveView } from "@/features/owner/components/owner-properties-live-view";

export const metadata: Metadata = {
  title: "My Properties | ParkEase BD Provider Portal",
  description: "Manage verified Properties, parking resources, and operations.",
};

export default function OwnerPropertiesPage() {
  return <OwnerPropertiesLiveView />;
}
