"use client";

import { ProviderPage, ProviderPageHeader } from "@/components/owner/provider-page";
import { AccountActionsCard } from "@/features/profile/components/account-actions-card";
import { SecuritySettingsCard } from "@/features/profile/components/security-settings-card";

export default function ProviderSecurityPage() {
  return <ProviderPage className="max-w-4xl"><ProviderPageHeader title="Account security" description="Protect your Provider account, update your password and control active sessions." breadcrumbs={[{ label: "Account" }, { label: "Security" }]} /><SecuritySettingsCard sessionsHref="/owner/account/sessions" /><AccountActionsCard /></ProviderPage>;
}
