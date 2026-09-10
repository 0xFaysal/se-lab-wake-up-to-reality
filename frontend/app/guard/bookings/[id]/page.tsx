import React from "react";
import { GuardBookingDetailsView } from "@/features/guard/components/guard-booking-details-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GuardBookingDetailsPage({ params }: PageProps) {
  const { id } = await params;
  return <GuardBookingDetailsView bookingId={id} />;
}
