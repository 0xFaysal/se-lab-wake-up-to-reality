import React from "react";
import type { Metadata } from "next";
import { OwnerBookingsView } from "@/features/owner/components/owner-bookings-view";

export const metadata: Metadata = {
  title: "Bookings | Property Owner Management Portal",
  description: "Manage and monitor reservations, drivers, and parking schedules across all your properties in Dhaka.",
};

export default function OwnerBookingsPage() {
  return <OwnerBookingsView />;
}
