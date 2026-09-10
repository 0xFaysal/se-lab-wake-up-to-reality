import React from "react";
import { GuardConfirmCheckinView } from "@/features/guard/components/guard-confirm-checkin-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GuardConfirmCheckinPage({ params }: PageProps) {
  const { id } = await params;
  return <GuardConfirmCheckinView bookingId={id} />;
}
