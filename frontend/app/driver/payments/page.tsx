import React from "react";
import type { Metadata } from "next";
import { DriverFinancialHistoryView } from "@/features/payments/components/driver-financial-history-view";

export const metadata: Metadata = {
  title: "Payment History | ParkEase BD",
  description: "View and download receipts for all completed parking sessions and extensions in Dhaka.",
};

export default function DriverPaymentsPage() {
  return <DriverFinancialHistoryView initialTab="payments" />;
}
