import React from "react";
import type { Metadata } from "next";
import { OwnerManagersView } from "@/features/owner/components/owner-managers-view";

export const metadata: Metadata = {
  title: "Managers Management | ParkEase BD Owner Portal",
  description:
    "Delegate parking property operations, manage listings, bookings, guards, and configure restricted financial access scopes for your property managers.",
};

export default function OwnerManagersPage() {
  return <OwnerManagersView />;
}
