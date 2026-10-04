import type { Metadata } from "next";
import { PropertyEditLiveView } from "@/features/provider/components/property-edit-live-view";

export const metadata: Metadata = {
  title: "Edit Property",
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
