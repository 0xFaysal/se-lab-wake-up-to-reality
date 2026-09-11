import React from "react";
import type { Metadata } from "next";
import { OwnerSettingsView } from "@/features/owner/components/owner-settings-view";

export const metadata: Metadata = {
  title: "Settings | Property Owner Management Portal",
  description: "Manage your owner profile, security, notifications, payout account, and account preferences.",
};

export default function OwnerSettingsPage() {
  return <OwnerSettingsView />;
}
