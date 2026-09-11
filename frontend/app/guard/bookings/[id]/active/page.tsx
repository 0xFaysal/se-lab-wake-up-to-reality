import React from "react";
import { GuardActiveSessionView } from "@/features/guard/components/guard-active-session-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GuardActiveSessionPage({ params }: PageProps) {
  const { id } = await params;
  return <GuardActiveSessionView bookingId={id} />;
}
