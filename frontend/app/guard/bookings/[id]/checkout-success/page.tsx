import React from "react";
import { GuardCheckoutSuccessView } from "@/features/guard/components/guard-checkout-success-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GuardCheckoutSuccessPage({ params }: PageProps) {
  const { id } = await params;
  return <GuardCheckoutSuccessView bookingId={id} />;
}
