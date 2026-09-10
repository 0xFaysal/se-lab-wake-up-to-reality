import React from "react";
import type { Metadata } from "next";
import { DriverFinancialHistoryView } from "@/features/payments/components/driver-financial-history-view";

export const metadata: Metadata = {
  title: "Refund History | ParkEase BD",
  description: "Track automated security deposit returns, adjustments, and cancellation refunds in Dhaka.",
};

export default function DriverRefundsPage() {
  return <DriverFinancialHistoryView initialTab="refunds" />;
}
