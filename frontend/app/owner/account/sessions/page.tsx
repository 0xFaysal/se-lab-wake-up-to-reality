"use client";

import { ProviderPage, ProviderPageHeader } from "@/components/owner/provider-page";
import { SessionManager } from "@/features/profile/components/session-manager";

export default function ProviderSessionsPage() {
  return <ProviderPage className="max-w-4xl"><ProviderPageHeader title="Active sessions" description="Review and revoke devices signed in to your Provider account." breadcrumbs={[{ label: "Account" }, { label: "Sessions" }]} /><SessionManager /></ProviderPage>;
}
