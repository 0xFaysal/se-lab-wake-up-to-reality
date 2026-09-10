import React from "react";
import type { Metadata } from "next";
import { DriverDisputeFormView } from "@/features/bookings/components/driver-dispute-form-view";

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

export const metadata: Metadata = {
  title: "Open Dispute & Resolution | ParkEase BD",
  description: "File a formal parking dispute for investigation by ParkEase BD safety and settlement officers.",
};

export default async function DriverDisputePage({ params }: PageProps) {
  const { bookingId } = await params;
  return <DriverDisputeFormView bookingId={bookingId} />;
}
