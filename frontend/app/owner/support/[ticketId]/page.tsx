import React from "react";
import type { Metadata } from "next";
import { OwnerSupportTicketDetailsView } from "@/features/owner/components/owner-support-ticket-details-view";

export const metadata: Metadata = {
  title: "Support Ticket #SUP-1048 | Help & Support | ParkEase BD",
  description: "Track your support ticket progress, communicate with ParkEase BD Support team, and review updates.",
};

export default async function OwnerSupportTicketDetailsPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  return <OwnerSupportTicketDetailsView ticketId={ticketId} />;
}
