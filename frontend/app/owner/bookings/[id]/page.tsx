import React from "react";
import type { Metadata } from "next";
import { OwnerBookingDetailsView } from "@/features/owner/components/owner-booking-details-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Booking Details | Property Owner Management Portal",
  description: "View complete reservation overview, driver contact, vehicle information, payment breakdown, and assigned guard.",
};

export default async function OwnerBookingDetailsPage({ params }: PageProps) {
  const { id } = await params;
  return <OwnerBookingDetailsView bookingId={id} />;
}
