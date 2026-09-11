import React from "react";
import type { Metadata } from "next";
import { OwnerEarningsView } from "@/features/owner/components/owner-earnings-view";

export const metadata: Metadata = {
  title: "Earnings & Payouts | Property Owner Management Portal",
  description: "Track parking revenue, owner earnings, bank payouts, and recent transaction settlements across your properties.",
};

export default function OwnerEarningsPage() {
  return <OwnerEarningsView />;
}
