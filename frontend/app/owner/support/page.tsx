import React from "react";
import type { Metadata } from "next";
import { OwnerSupportView } from "@/features/owner/components/owner-support-view";

export const metadata: Metadata = {
  title: "Help & Support | Property Owner Management Portal",
  description: "Find answers, search guides, open priority host support tickets, and contact ParkEase BD owner assistance.",
};

export default function OwnerSupportPage() {
  return <OwnerSupportView />;
}
