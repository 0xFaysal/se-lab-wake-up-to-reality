import React from "react";
import type { Metadata } from "next";
import { OwnerNotificationsView } from "@/features/owner/components/owner-notifications-view";

export const metadata: Metadata = {
  title: "Notifications & Alerts | Property Owner Management Portal",
  description: "Stay updated on real-time bookings, payment settlements, security guard check-ins, driver reviews, and property alerts across your facilities.",
};

export default function OwnerNotificationsPage() {
  return <OwnerNotificationsView />;
}
