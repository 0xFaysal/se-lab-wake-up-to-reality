"use client";

import { SessionManager } from "@/features/profile/components/session-manager";
import {
  ProviderPage,
  ProviderPageHeader,
} from "@/components/provider/provider-page";

export default function ProviderSessionsPage() {
  return (
    <ProviderPage className="max-w-5xl">
      <ProviderPageHeader
        title="Account sessions"
        description="Review signed-in devices and revoke sessions you no longer trust."
        breadcrumbs={[
          { label: "Settings", href: "/provider/settings" },
          { label: "Account sessions" },
        ]}
      />
      <SessionManager />
    </ProviderPage>
  );
}
