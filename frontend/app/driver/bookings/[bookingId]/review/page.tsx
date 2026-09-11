import React from "react";
import type { Metadata } from "next";
import { DriverPostBookingReviewView } from "@/features/bookings/components/driver-post-booking-review-view";

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

export const metadata: Metadata = {
  title: "Rate & Review Parking Experience | ParkEase BD",
  description: "Share feedback on slot accuracy, security, and cleanliness for your completed parking session.",
};

export default async function DriverPostBookingReviewPage({ params }: PageProps) {
  const { bookingId } = await params;
  return <DriverPostBookingReviewView bookingId={bookingId} />;
}
