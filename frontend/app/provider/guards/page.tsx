import React from "react";
import type { Metadata } from "next";
import { OwnerGuardsLiveView } from "@/features/provider/guard-management/provider-guards-live-view";

export const metadata: Metadata = {
  title: "Guards & Gate Access | ParkEase Provider",
  description: "Manage security guards, duty schedules, gate assignments, and temporary credential onboarding across your parking properties in Dhaka.",
};

export default async function OwnerGuardsPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string }>;
}) {
  const { propertyId } = await searchParams;
  return <OwnerGuardsLiveView initialPropertyId={propertyId} />;
}
