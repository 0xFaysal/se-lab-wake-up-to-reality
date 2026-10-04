import React from "react";
import type { Metadata } from "next";
import { OwnerPropertyLiveDetail } from "@/features/provider/components/provider-property-live-detail";

export const metadata: Metadata = {
  title: "Property Details",
  description: "Manage parking spaces inventory, availability, rates, security standards, and assigned staff for your property.",
};

export default async function OwnerPropertyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OwnerPropertyLiveDetail propertyId={id} />;
}
