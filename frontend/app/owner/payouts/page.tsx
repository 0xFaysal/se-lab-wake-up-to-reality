import React from "react";
import type { Metadata } from "next";
import { OwnerPayoutHistoryView } from "@/features/owner/components/owner-payout-history-view";

export const metadata: Metadata = {
  title: "Payout History | ParkEase BD Owner Portal",
  description:
    "Review historical disbursements, pending transfers, and weekly settlement statements for all your parking listings.",
};

export default function OwnerPayoutsPage() {
  return <OwnerPayoutHistoryView />;
}
