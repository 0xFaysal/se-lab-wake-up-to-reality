import React from "react";
import type { Metadata } from "next";
import { OwnerDisputesView } from "@/features/owner/components/owner-disputes-view";

export const metadata: Metadata = {
  title: "Disputes & Claims Manager | ParkEase BD Owner Portal",
  description:
    "Mediate customer grievances, review driver claims, submit facility CCTV evidence, and manage parking refund requests.",
};

export default function OwnerDisputesPage() {
  return <OwnerDisputesView />;
}
