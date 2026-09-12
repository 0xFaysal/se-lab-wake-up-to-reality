import React from "react";
import type { Metadata } from "next";
import { OwnerPropertiesLiveView } from "@/features/owner/components/owner-properties-live-view";

export const metadata: Metadata = {
  title: "My Listings | Property Owner Management Portal",
  description: "Manage parking properties, availability, pricing, and assigned operations teams across Dhaka.",
};

export default function OwnerPropertiesPage() {
  return <OwnerPropertiesLiveView />;
}
