import React from "react";
import { GuardUpcomingBookingView } from "@/features/guard/components/guard-upcoming-booking-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GuardUpcomingBookingPage({ params }: PageProps) {
  const { id } = await params;
  return <GuardUpcomingBookingView bookingId={id} />;
}
