import React from "react";
import type { Metadata } from "next";
import { OwnerPropertyDetailsView } from "@/features/owner/components/owner-property-details-view";

export const metadata: Metadata = {
  title: "Residential Building, Gulshan | Property Details | ParkEase BD",
  description: "Manage parking spaces inventory, availability, rates, security standards, and assigned staff for your property.",
};

export default async function OwnerPropertyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OwnerPropertyDetailsView propertyId={id} />;
}
