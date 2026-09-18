import type { Metadata } from "next";
import { PropertyEditLiveView } from "@/features/owner/components/property-edit-live-view";

export const metadata: Metadata = {
  title: "Edit Listing | Residential Building, Gulshan | ParkEase BD",
  description: "Update parking property information, location, bay inventory, pricing, amenities, and photos.",
};

export default async function OwnerEditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PropertyEditLiveView propertyId={id} />;
}
