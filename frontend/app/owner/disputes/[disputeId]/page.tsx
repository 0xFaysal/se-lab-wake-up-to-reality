import React from "react";
import type { Metadata } from "next";
import { OwnerDisputeDetailView } from "@/features/owner/components/owner-dispute-detail-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ disputeId: string }>;
}): Promise<Metadata> {
  const { disputeId } = await params;
  return {
    title: `Dispute Case #${disputeId} | Evidence Room | ParkEase BD`,
    description: `Review evidence, submitted statements, and manage mediation proceedings for dispute case #${disputeId}.`,
  };
}

export default async function OwnerDisputeDetailPage({
  params,
}: {
  params: Promise<{ disputeId: string }>;
}) {
  const { disputeId } = await params;
  return <OwnerDisputeDetailView disputeId={disputeId} />;
}
